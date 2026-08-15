import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  like,
  or,
  sql,
} from "drizzle-orm";
import {
  ALLOWED_RESUME_EXTENSIONS,
  MAX_RESUME_BYTES,
  TERMINAL_STATUSES,
  isStatus,
  type Status,
} from "@/lib/constants";
import { nowIso, todayIsoDate } from "@/lib/dates";
import type {
  ApplicationDetail,
  ApplicationFilters,
  ApplicationInput,
  ApplicationListItem,
  ResumeListItem,
} from "@/lib/types";
import {
  assertWritable,
  getDb,
  getSqlite,
  resumeFilePath,
  writeFileAtomic,
} from "./client";
import {
  applications,
  resumes,
  statusEvents,
  type Application,
  type Resume,
} from "./schema";

export type {
  ApplicationDetail,
  ApplicationFilters,
  ApplicationInput,
  ApplicationListItem,
  ResumeListItem,
};

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function requireText(value: string | null | undefined, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

export function listApplications(
  filters: ApplicationFilters = {},
): ApplicationListItem[] {
  getDb();
  const conditions = [isNull(applications.deletedAt)];

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        like(applications.title, term),
        like(applications.company, term),
        like(applications.location, term),
      )!,
    );
  }

  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(applications.status, filters.statuses));
  }

  if (filters.from) {
    conditions.push(
      sql`date(coalesce(${applications.appliedAt}, substr(${applications.createdAt}, 1, 10))) >= ${filters.from}`,
    );
  }

  if (filters.to) {
    conditions.push(
      sql`date(coalesce(${applications.appliedAt}, substr(${applications.createdAt}, 1, 10))) <= ${filters.to}`,
    );
  }

  return getDb()
    .select({
      id: applications.id,
      title: applications.title,
      company: applications.company,
      url: applications.url,
      location: applications.location,
      workMode: applications.workMode,
      source: applications.source,
      salary: applications.salary,
      status: applications.status,
      resumeId: applications.resumeId,
      resumeLabel: resumes.label,
      appliedAt: applications.appliedAt,
      followUpOn: applications.followUpOn,
      notes: applications.notes,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
    })
    .from(applications)
    .leftJoin(resumes, eq(applications.resumeId, resumes.id))
    .where(and(...conditions))
    .orderBy(desc(applications.updatedAt), desc(applications.id))
    .all();
}

export function getApplication(id: number): ApplicationDetail | null {
  const row = getDb()
    .select({
      id: applications.id,
      title: applications.title,
      company: applications.company,
      url: applications.url,
      location: applications.location,
      workMode: applications.workMode,
      source: applications.source,
      salary: applications.salary,
      status: applications.status,
      resumeId: applications.resumeId,
      resumeLabel: resumes.label,
      appliedAt: applications.appliedAt,
      followUpOn: applications.followUpOn,
      notes: applications.notes,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
    })
    .from(applications)
    .leftJoin(resumes, eq(applications.resumeId, resumes.id))
    .where(and(eq(applications.id, id), isNull(applications.deletedAt)))
    .get();

  if (!row) return null;

  const resume = row.resumeId
    ? (getDb().select().from(resumes).where(eq(resumes.id, row.resumeId)).get() ??
      null)
    : null;

  const events = getDb()
    .select()
    .from(statusEvents)
    .where(eq(statusEvents.applicationId, id))
    .orderBy(desc(statusEvents.changedAt), desc(statusEvents.id))
    .all();

  return { ...row, resume, events };
}

export function createApplication(input: ApplicationInput): Application {
  assertWritable();
  const title = requireText(input.title, "Title");
  const company = requireText(input.company, "Company");
  if (!isStatus(input.status)) {
    throw new Error("Invalid status");
  }
  if (input.resumeId) {
    const resume = getResume(input.resumeId);
    if (!resume) throw new Error("Resume not found");
  }

  const now = nowIso();
  const sqlite = getSqlite();

  return sqlite.transaction(() => {
    const created = getDb()
      .insert(applications)
      .values({
        title,
        company,
        url: emptyToNull(input.url),
        location: emptyToNull(input.location),
        workMode: emptyToNull(input.workMode),
        source: emptyToNull(input.source),
        salary: emptyToNull(input.salary),
        status: input.status,
        resumeId: input.resumeId ?? null,
        appliedAt: emptyToNull(input.appliedAt),
        followUpOn: emptyToNull(input.followUpOn),
        notes: emptyToNull(input.notes),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
      .returning()
      .get();

    getDb()
      .insert(statusEvents)
      .values({
        applicationId: created.id,
        status: input.status,
        changedAt: now,
      })
      .run();

    return created;
  })();
}

export function updateApplication(
  id: number,
  input: Partial<ApplicationInput>,
): Application {
  assertWritable();
  const existing = getApplication(id);
  if (!existing) {
    throw new Error("Application not found");
  }

  if (input.title !== undefined) requireText(input.title, "Title");
  if (input.company !== undefined) requireText(input.company, "Company");
  if (input.status !== undefined && !isStatus(input.status)) {
    throw new Error("Invalid status");
  }
  if (input.resumeId) {
    const resume = getResume(input.resumeId);
    if (!resume) throw new Error("Resume not found");
  }

  const now = nowIso();
  const sqlite = getSqlite();

  return sqlite.transaction(() => {
    const nextStatus = input.status ?? existing.status;
    const updated = getDb()
      .update(applications)
      .set({
        title: input.title !== undefined ? input.title.trim() : existing.title,
        company:
          input.company !== undefined ? input.company.trim() : existing.company,
        url: input.url !== undefined ? emptyToNull(input.url) : existing.url,
        location:
          input.location !== undefined
            ? emptyToNull(input.location)
            : existing.location,
        workMode:
          input.workMode !== undefined
            ? emptyToNull(input.workMode)
            : existing.workMode,
        source:
          input.source !== undefined ? emptyToNull(input.source) : existing.source,
        salary:
          input.salary !== undefined ? emptyToNull(input.salary) : existing.salary,
        status: nextStatus,
        resumeId:
          input.resumeId !== undefined ? input.resumeId : existing.resumeId,
        appliedAt:
          input.appliedAt !== undefined
            ? emptyToNull(input.appliedAt)
            : existing.appliedAt,
        followUpOn:
          input.followUpOn !== undefined
            ? emptyToNull(input.followUpOn)
            : existing.followUpOn,
        notes:
          input.notes !== undefined ? emptyToNull(input.notes) : existing.notes,
        updatedAt: now,
      })
      .where(eq(applications.id, id))
      .returning()
      .get();

    if (nextStatus !== existing.status) {
      getDb()
        .insert(statusEvents)
        .values({
          applicationId: id,
          status: nextStatus,
          changedAt: now,
        })
        .run();
    }

    return updated;
  })();
}

export function softDeleteApplication(id: number) {
  assertWritable();
  const existing = getApplication(id);
  if (!existing) {
    throw new Error("Application not found");
  }
  const now = nowIso();
  getDb()
    .update(applications)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(applications.id, id))
    .run();
}

export function getResume(id: number): Resume | undefined {
  return getDb().select().from(resumes).where(eq(resumes.id, id)).get();
}

export function listResumes(): ResumeListItem[] {
  const all = getDb()
    .select()
    .from(resumes)
    .orderBy(desc(resumes.createdAt), desc(resumes.id))
    .all();

  const apps = getDb()
    .select({
      id: applications.id,
      company: applications.company,
      title: applications.title,
      resumeId: applications.resumeId,
    })
    .from(applications)
    .where(isNull(applications.deletedAt))
    .all();

  return all.map((resume) => {
    const usedBy = apps
      .filter((app) => app.resumeId === resume.id)
      .map((app) => ({ id: app.id, company: app.company, title: app.title }));
    return { ...resume, usageCount: usedBy.length, usedBy };
  });
}

export function upsertResumeFromUpload(params: {
  buffer: Buffer;
  originalFilename: string;
  label?: string | null;
}): { resume: Resume; reused: boolean } {
  assertWritable();
  if (params.buffer.byteLength === 0) {
    throw new Error("Resume file is empty");
  }
  if (params.buffer.byteLength > MAX_RESUME_BYTES) {
    throw new Error("Resume file is larger than 10 MB");
  }

  const originalFilename = path.basename(params.originalFilename);
  const ext = path.extname(originalFilename).replace(".", "").toLowerCase();
  if (
    !ALLOWED_RESUME_EXTENSIONS.includes(
      ext as (typeof ALLOWED_RESUME_EXTENSIONS)[number],
    )
  ) {
    throw new Error(
      "Unsupported resume type. Use PDF, DOC, DOCX, TXT, RTF, or Pages.",
    );
  }

  const sha256 = createHash("sha256").update(params.buffer).digest("hex");
  const dest = resumeFilePath(sha256, ext);
  const existing = getDb()
    .select()
    .from(resumes)
    .where(eq(resumes.sha256, sha256))
    .get();

  if (!fs.existsSync(dest)) {
    writeFileAtomic(dest, params.buffer);
  }

  if (existing) {
    return { resume: existing, reused: true };
  }

  const label =
    emptyToNull(params.label) ?? originalFilename.replace(/\.[^.]+$/, "");
  const created = getDb()
    .insert(resumes)
    .values({
      sha256,
      label,
      originalFilename,
      extension: ext,
      sizeBytes: params.buffer.byteLength,
      createdAt: nowIso(),
    })
    .returning()
    .get();

  return { resume: created, reused: false };
}

export function renameResume(id: number, label: string): Resume {
  assertWritable();
  const existing = getResume(id);
  if (!existing) throw new Error("Resume not found");
  const nextLabel = requireText(label, "Label");
  return getDb()
    .update(resumes)
    .set({ label: nextLabel })
    .where(eq(resumes.id, id))
    .returning()
    .get();
}

export function deleteResume(id: number) {
  assertWritable();
  const existing = getResume(id);
  if (!existing) throw new Error("Resume not found");

  const usage = getDb()
    .select({ value: count() })
    .from(applications)
    .where(
      and(eq(applications.resumeId, id), isNull(applications.deletedAt)),
    )
    .get();

  if ((usage?.value ?? 0) > 0) {
    throw new Error(
      "This resume is attached to an application and cannot be deleted.",
    );
  }

  const sqlite = getSqlite();
  sqlite.transaction(() => {
    getDb()
      .update(applications)
      .set({ resumeId: null })
      .where(eq(applications.resumeId, id))
      .run();
    getDb().delete(resumes).where(eq(resumes.id, id)).run();
  })();

  const filePath = resumeFilePath(existing.sha256, existing.extension);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getStatusCounts(): Record<string, number> {
  const rows = getDb()
    .select({
      status: applications.status,
      value: count(),
    })
    .from(applications)
    .where(isNull(applications.deletedAt))
    .groupBy(applications.status)
    .all();

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status] = row.value;
  }
  return counts;
}

export function getDashboardData() {
  const items = listApplications();
  const counts = getStatusCounts();
  const today = todayIsoDate();
  const followUps = items
    .filter(
      (item) =>
        item.followUpOn &&
        !TERMINAL_STATUSES.includes(item.status as Status),
    )
    .sort((a, b) => (a.followUpOn ?? "").localeCompare(b.followUpOn ?? ""));

  const overdue = followUps.filter((item) => item.followUpOn! < today);
  const dueToday = followUps.filter((item) => item.followUpOn === today);
  const upcoming = followUps.filter((item) => item.followUpOn! > today).slice(0, 8);

  return {
    total: items.length,
    counts,
    overdue,
    dueToday,
    upcoming,
    recent: items.slice(0, 8),
  };
}
