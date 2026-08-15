"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationDetail, ResumeListItem } from "@/lib/types";
import {
  SOURCES,
  STATUSES,
  WORK_MODES,
  type Status,
} from "@/lib/constants";
import { todayIsoDate } from "@/lib/dates";

const fieldClass =
  "mt-1 w-full min-w-0 max-w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2";

type ResumeMode = "none" | "existing" | "upload";

export function ApplicationForm({
  mode,
  application,
  resumes,
}: {
  mode: "create" | "edit";
  application?: ApplicationDetail;
  resumes: ResumeListItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>(
    (application?.status as Status) ?? "interested",
  );
  const [appliedAt, setAppliedAt] = useState(application?.appliedAt ?? "");
  const [resumeMode, setResumeMode] = useState<ResumeMode>(
    application?.resumeId ? "existing" : "none",
  );
  const defaultResumeId = application?.resumeId
    ? String(application.resumeId)
    : "";

  const sortedResumes = useMemo(
    () =>
      [...resumes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [resumes],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    form.set("status", status);
    if (resumeMode === "none") {
      form.set("resumeId", "");
      form.delete("file");
    }
    if (resumeMode === "existing") {
      form.delete("file");
    }
    if (resumeMode === "upload") {
      form.delete("resumeId");
    }

    const url =
      mode === "create"
        ? "/api/applications"
        : `/api/applications/${application!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(url, { method, body: form });
      const data = (await response.json()) as {
        error?: string;
        application?: { id: number };
      };
      if (!response.ok || !data.application) {
        setError(data.error ?? "Could not save application");
        return;
      }
      router.push(`/applications/${data.application.id}`);
      router.refresh();
    } catch {
      setError("Network error. Is the app still running?");
    } finally {
      setPending(false);
    }
  }

  function onStatusChange(next: Status) {
    setStatus(next);
    if (
      !appliedAt &&
      ["applied", "screening", "interviewing", "offer", "accepted"].includes(
        next,
      )
    ) {
      setAppliedAt(todayIsoDate());
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-danger bg-danger-subtle px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Role</h2>
        <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-sm font-medium text-foreground">
            Job title
            <input
              name="title"
              required
              defaultValue={application?.title ?? ""}
              placeholder="Senior software engineer"
              className={fieldClass}
            />
          </label>
          <label className="min-w-0 text-sm font-medium text-foreground">
            Company
            <input
              name="company"
              required
              defaultValue={application?.company ?? ""}
              placeholder="Acme"
              className={fieldClass}
            />
          </label>
          <label className="min-w-0 sm:col-span-2 text-sm font-medium text-foreground">
            Application link
            <input
              name="url"
              type="url"
              defaultValue={application?.url ?? ""}
              placeholder="https://..."
              className={fieldClass}
            />
          </label>
          <label className="min-w-0 text-sm font-medium text-foreground">
            Location
            <input
              name="location"
              defaultValue={application?.location ?? ""}
              placeholder="San Francisco, CA"
              className={fieldClass}
            />
          </label>
          <label className="min-w-0 text-sm font-medium text-foreground">
            Work mode
            <select
              name="workMode"
              defaultValue={application?.workMode ?? ""}
              className={fieldClass}
            >
              <option value="">Not specified</option>
              {WORK_MODES.map((modeOption) => (
                <option key={modeOption} value={modeOption}>
                  {modeOption}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 text-sm font-medium text-foreground">
            Source
            <select
              name="source"
              defaultValue={application?.source ?? ""}
              className={fieldClass}
            >
              <option value="">Not specified</option>
              {SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 text-sm font-medium text-foreground">
            Salary / range
            <input
              name="salary"
              defaultValue={application?.salary ?? ""}
              placeholder="$160k–$190k"
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Tracking</h2>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-3">
          <label className="min-w-0 text-sm font-medium text-foreground">
            Status
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as Status)}
              className={fieldClass}
            >
              {STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 text-sm font-medium text-foreground">
            Applied date
            <input
              name="appliedAt"
              type="date"
              value={appliedAt}
              onChange={(event) => setAppliedAt(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="min-w-0 text-sm font-medium text-foreground">
            Follow up on
            <input
              name="followUpOn"
              type="date"
              defaultValue={application?.followUpOn ?? ""}
              className={fieldClass}
            />
          </label>
          <label className="min-w-0 text-sm font-medium text-foreground md:col-span-3">
            Notes
            <textarea
              name="notes"
              rows={5}
              defaultValue={application?.notes ?? ""}
              placeholder="Recruiter name, interview notes, what you tailored in the resume..."
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Resume</h2>
        <p className="mt-1 text-sm text-muted">
          Attach a tailored resume or reuse one you already uploaded. Identical
          files are stored once.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["none", "No resume"],
              ["existing", "Choose existing"],
              ["upload", "Upload new"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setResumeMode(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                resumeMode === value
                  ? "bg-accent text-accent-fg"
                  : "bg-subtle text-foreground hover:bg-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {resumeMode === "existing" ? (
          <label className="mt-4 block text-sm font-medium text-foreground">
            Resume on file
            <select
              name="resumeId"
              defaultValue={defaultResumeId}
              required
              className={fieldClass}
            >
              <option value="" disabled>
                Select a resume
              </option>
              {sortedResumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.label} — {resume.originalFilename}
                </option>
              ))}
            </select>
            {sortedResumes.length === 0 ? (
              <span className="mt-2 block text-sm font-normal text-muted">
                No resumes uploaded yet. Switch to Upload new.
              </span>
            ) : null}
          </label>
        ) : null}

        {resumeMode === "upload" ? (
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            <label className="min-w-0 text-sm font-medium text-foreground">
              File
              <input
                name="file"
                type="file"
                required
                accept=".pdf,.doc,.docx,.txt,.rtf,.pages"
                className={fieldClass}
              />
            </label>
            <label className="min-w-0 text-sm font-medium text-foreground">
              Label
              <input
                name="resumeLabel"
                placeholder="Acme SWE 2026"
                className={fieldClass}
              />
            </label>
          </div>
        ) : null}
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
        >
          {pending
            ? "Saving..."
            : mode === "create"
              ? "Save application"
              : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-foreground hover:bg-subtle sm:w-auto"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
