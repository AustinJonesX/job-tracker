"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ResumeListItem } from "@/lib/types";
import { formatDate } from "@/lib/dates";
import { formatBytes } from "@/lib/format";

export function ResumeLibrary({ resumes }: { resumes: ResumeListItem[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reused, setReused] = useState(false);

  async function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setReused(false);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/resumes", { method: "POST", body: form });
      const data = (await response.json()) as {
        error?: string;
        reused?: boolean;
      };
      if (!response.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setReused(Boolean(data.reused));
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Network error. Is the app still running?");
    } finally {
      setPending(false);
    }
  }

  async function onRename(id: number, current: string) {
    const label = window.prompt("Resume label", current);
    if (!label || label.trim() === current) return;
    const form = new FormData();
    form.set("label", label);
    const response = await fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      body: form,
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not rename");
      return;
    }
    router.refresh();
  }

  async function onDelete(id: number, usageCount: number) {
    if (usageCount > 0) return;
    if (!window.confirm("Delete this resume file from the library?")) return;
    const response = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not delete");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={onUpload}
        className="rounded-2xl border border-border bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-gray-900">Upload a resume</h2>
        <p className="mt-1 text-sm text-muted">
          PDF, Word, text, RTF, or Pages, up to 10 MB. If the file is identical
          to one you already stored, the existing copy is reused.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-gray-700">
            File
            <input
              name="file"
              type="file"
              required
              accept=".pdf,.doc,.docx,.txt,.rtf,.pages"
              className="mt-1 block rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Label
            <input
              name="resumeLabel"
              placeholder="General SWE 2026"
              className="mt-1 block rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending ? "Uploading..." : "Add to library"}
          </button>
        </div>
        {reused ? (
          <p className="mt-3 text-sm text-indigo-700">
            That file was already in the library, so the existing copy was used.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </form>

      {resumes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted">
          No resumes yet. Upload one here, or attach a file when you add an
          application.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Used by</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {resumes.map((resume) => (
                <tr key={resume.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {resume.label}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {resume.originalFilename} · {formatBytes(resume.sizeBytes)}
                  </td>
                  <td className="px-4 py-3">
                    {resume.usedBy.length === 0 ? (
                      <span className="text-muted">Unused</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {resume.usedBy.map((app) => (
                          <Link
                            key={app.id}
                            href={`/applications/${app.id}`}
                            className="text-indigo-700 hover:underline"
                          >
                            {app.company} — {app.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(resume.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <a
                        href={`/api/resumes/${resume.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
                      >
                        Open
                      </a>
                      <a
                        href={`/api/resumes/${resume.id}/file?download=1`}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() => onRename(resume.id, resume.label)}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        disabled={resume.usageCount > 0}
                        title={
                          resume.usageCount > 0
                            ? "Detach this resume from applications first"
                            : "Delete"
                        }
                        onClick={() => onDelete(resume.id, resume.usageCount)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
