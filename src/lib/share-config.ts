import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/db/client";

export const SHARE_FILE = path.join(DATA_DIR, "share.json");
export const DEFAULT_PUBLIC_PORT = 3000;
export const SESSION_COOKIE = "jt_session";

export type ShareMethod = "upnp" | "port-forward";

export type ShareConfig = {
  enabled: boolean;
  method: ShareMethod;
  publicPort: number;
  privatePort: number;
  password: string;
  sessionSecret: string;
  controlUrl?: string;
  serviceType?: string;
  internalHost?: string;
  externalIp?: string;
  lastError?: string | null;
};

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function randomPassword() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(8);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

export function loadShareConfig(): ShareConfig | null {
  if (!fs.existsSync(SHARE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(SHARE_FILE, "utf8")) as ShareConfig;
  } catch {
    return null;
  }
}

export function saveShareConfig(config: ShareConfig) {
  ensureDataDir();
  const tmp = `${SHARE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(config, null, 2)}\n`);
  fs.renameSync(tmp, SHARE_FILE);
}

export function getOrCreateShareConfig(): ShareConfig {
  const existing = loadShareConfig();
  if (existing?.password && existing.sessionSecret) {
    if (!existing.method) existing.method = "port-forward";
    if (existing.publicPort === 18765) {
      existing.publicPort = existing.privatePort || DEFAULT_PUBLIC_PORT;
      saveShareConfig(existing);
    }
    return existing;
  }
  const created: ShareConfig = {
    enabled: false,
    method: existing?.method ?? "port-forward",
    publicPort: existing?.publicPort ?? DEFAULT_PUBLIC_PORT,
    privatePort: Number(process.env.PORT) || 3000,
    password: existing?.password || randomPassword(),
    sessionSecret: existing?.sessionSecret || randomBytes(32).toString("hex"),
    lastError: null,
  };
  saveShareConfig(created);
  return created;
}

export function setSharePassword(password: string) {
  const trimmed = password.trim();
  if (trimmed.length < 4) {
    throw new Error("Password must be at least 4 characters");
  }
  const config = getOrCreateShareConfig();
  config.password = trimmed;
  saveShareConfig(config);
  return config;
}

export function verifyPassword(password: string, expected: string) {
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    const dummy = scryptSync(password, "jt", 32);
    void dummy;
    return false;
  }
  return timingSafeEqual(a, b);
}

export function createSessionToken(secret: string) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${exp}.${nonce}`;
  const mac = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

export function sessionCookieValue(secret: string) {
  return createSessionToken(secret);
}

export function isValidSession(token: string | undefined, secret: string) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expRaw, nonce, mac] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  if (!nonce || !mac) return false;
  const payload = `${expRaw}.${nonce}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
