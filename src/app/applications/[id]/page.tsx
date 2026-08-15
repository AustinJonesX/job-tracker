import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteApplicationButton } from "@/components/DeleteApplicationButton";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusSelect } from "@/components/StatusSelect";
import { getApplication } from "@/db/queries";
import { formatDate, formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const application = getApplication(id);
  if (!application) notFound();

  const facts = [
    ["Location", application.location],
    ["Work mode", application.workMode],
    ["Source", application.source],
    ["Salary", application.salary],
    ["Applied", application.appliedAt ? formatDate(application.appliedAt) : null],
    [
      "Follow-up",
      application.followUpOn ? formatDate(application.followUpOn) : null,
    ],
  ].filter(([, value]) => value);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link href="/applications" className="hover:text-indigo-700">
              Applications
            </Link>
            <span className="px-1.5">/</span>
            {application.company}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
            {application.title}
          </h1>
          <p className="mt-1 text-sm text-muted">{application.company}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusSelect applicationId={application.id} value={application.status} />
          <Link
            href={`/applications/${application.id}/edit`}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeleteApplicationButton
            id={application.id}
            company={application.company}
          />
        </div>
      </div>

      <div className="grid gap-5">
        <section className="rounded-2xl border border-border bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={application.status} />
            {application.url ? (
              <a
                href={application.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-indigo-700 hover:underline"
              >
                Open job posting
              </a>
            ) : null}
          </div>
          {facts.length > 0 ? (
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Resume</h2>
          {application.resume ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {application.resume.label}
                </p>
                <p className="text-sm text-muted">
                  {application.resume.originalFilename}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/resumes/${application.resume.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                >
                  Open
                </a>
                <a
                  href={`/api/resumes/${application.resume.id}/file?download=1`}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                >
                  Download
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              No resume attached.{" "}
              <Link
                href={`/applications/${application.id}/edit`}
                className="font-medium text-indigo-700 hover:underline"
              >
                Add one
              </Link>
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Notes</h2>
          {application.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {application.notes}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">No notes yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Status history</h2>
          <ol className="mt-4 space-y-3">
            {application.events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3">
                <StatusBadge status={event.status} />
                <span className="text-xs text-muted">
                  {formatDateTime(event.changedAt)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
