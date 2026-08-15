import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export const DATA_DIR = path.join(process.cwd(), "data");
export const FILES_DIR = path.join(DATA_DIR, "files");
export const BACKUPS_DIR = path.join(DATA_DIR, "backups");
export const DB_PATH = path.join(DATA_DIR, "job-tracker.db");

export class DatabaseIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseIntegrityError";
  }
}

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let sqlite: Database.Database | null = null;
let db: DrizzleDb | null = null;
let integrityOk = true;
let integrityMessage = "";
let startupBackupDone = false;

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(FILES_DIR, { recursive: true });
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

function applyPragmas(database: Database.Database) {
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.pragma("synchronous = NORMAL");
}

function createTables(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sha256 TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      extension TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      url TEXT,
      location TEXT,
      work_mode TEXT,
      source TEXT,
      salary TEXT,
      status TEXT NOT NULL,
      resume_id INTEGER REFERENCES resumes(id),
      applied_at TEXT,
      follow_up_on TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS status_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id),
      status TEXT NOT NULL,
      changed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
    CREATE INDEX IF NOT EXISTS idx_applications_deleted_at ON applications(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_status_events_application_id ON status_events(application_id);
  `);
}

function rotateBackups() {
  const files = fs
    .readdirSync(BACKUPS_DIR)
    .filter((name) => name.endsWith(".db"))
    .map((name) => ({
      name,
      time: fs.statSync(path.join(BACKUPS_DIR, name)).mtimeMs,
    }))
    .sort((a, b) => a.time - b.time);

  while (files.length > 10) {
    const oldest = files.shift();
    if (oldest) {
      fs.unlinkSync(path.join(BACKUPS_DIR, oldest.name));
    }
  }
}

function backupDatabase(database: Database.Database) {
  if (!fs.existsSync(DB_PATH) || fs.statSync(DB_PATH).size === 0) {
    return;
  }
  const marker = path.join(DATA_DIR, ".last-backup");
  if (fs.existsSync(marker)) {
    const ageMs = Date.now() - fs.statSync(marker).mtimeMs;
    if (ageMs < 60_000) return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(BACKUPS_DIR, `job-tracker-${stamp}.db`);
  const escaped = dest.replaceAll("'", "''");
  database.exec(`VACUUM INTO '${escaped}'`);
  fs.writeFileSync(marker, `${stamp}\n`);
  rotateBackups();
}

function checkIntegrity(database: Database.Database) {
  const rows = database.pragma("integrity_check") as {
    integrity_check: string;
  }[];
  const result = rows.map((row) => row.integrity_check).join("; ");
  if (result !== "ok") {
    integrityOk = false;
    integrityMessage = result;
    return false;
  }
  integrityOk = true;
  integrityMessage = "";
  return true;
}

export function getSqlite(): Database.Database {
  if (sqlite) return sqlite;

  ensureDirs();
  sqlite = new Database(DB_PATH);
  applyPragmas(sqlite);

  const ok = checkIntegrity(sqlite);
  if (ok) {
    createTables(sqlite);
    if (!startupBackupDone) {
      try {
        backupDatabase(sqlite);
      } catch (error) {
        console.error("Startup backup failed:", error);
      }
      startupBackupDone = true;
    }
  }

  db = drizzle(sqlite, { schema });
  return sqlite;
}

export function getDb(): DrizzleDb {
  if (!db) getSqlite();
  return db!;
}

export function assertWritable() {
  getSqlite();
  if (!integrityOk) {
    throw new DatabaseIntegrityError(
      `Database integrity check failed (${integrityMessage || "unknown"}). Writes are blocked. Restore a copy from data/backups/.`,
    );
  }
}

export function getIntegrityStatus() {
  getSqlite();
  return { ok: integrityOk, message: integrityMessage };
}

export function resumeFilePath(sha256: string, extension: string) {
  const ext = extension.replace(/^\./, "");
  return path.join(FILES_DIR, `${sha256}.${ext}`);
}

export function writeFileAtomic(dest: string, buffer: Buffer) {
  const dir = path.dirname(dest);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${dest}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, buffer);
  fs.renameSync(tmp, dest);
}
