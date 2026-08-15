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
  "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2";

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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Role</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Job title
            <input
              name="title"
              required
              defaultValue={application?.title ?? ""}
              placeholder="Senior software engineer"
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Company
            <input
              name="company"
              required
              defaultValue={application?.company ?? ""}
              placeholder="Acme"
              className={fieldClass}
            />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700">
            Application link
            <input
              name="url"
              type="url"
              defaultValue={application?.url ?? ""}
              placeholder="https://..."
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Location
            <input
              name="location"
              defaultValue={application?.location ?? ""}
              placeholder="San Francisco, CA"
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
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
          <label className="text-sm font-medium text-gray-700">
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
          <label className="text-sm font-medium text-gray-700">
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

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Tracking</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
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
          <label className="text-sm font-medium text-gray-700">
            Applied date
            <input
              name="appliedAt"
              type="date"
              value={appliedAt}
              onChange={(event) => setAppliedAt(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Follow up on
            <input
              name="followUpOn"
              type="date"
              defaultValue={application?.followUpOn ?? ""}
              className={fieldClass}
            />
          </label>
          <label className="sm:col-span-3 text-sm font-medium text-gray-700">
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

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Resume</h2>
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
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {resumeMode === "existing" ? (
          <label className="mt-4 block text-sm font-medium text-gray-700">
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              File
              <input
                name="file"
                type="file"
                required
                accept=".pdf,.doc,.docx,.txt,.rtf,.pages"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
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
          className="rounded-lg border border-border px-4 py-2 text-sm text-gray-700 hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
