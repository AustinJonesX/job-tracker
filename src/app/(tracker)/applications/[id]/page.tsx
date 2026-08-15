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
    <div className="mx-auto min-w-0 max-w-3xl">
      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            <Link href="/applications" className="hover:text-accent">
              Applications
            </Link>
            <span className="px-1.5">/</span>
            <span className="break-words">{application.company}</span>
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight break-words text-foreground md:text-2xl">
            {application.title}
          </h1>
          <p className="mt-1 truncate text-sm text-muted">{application.company}</p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:items-center">
          <div className="sm:col-span-2 lg:col-span-1">
            <StatusSelect applicationId={application.id} value={application.status} />
          </div>
          <Link
            href={`/applications/${application.id}/edit`}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-center text-sm font-medium hover:bg-subtle"
          >
            Edit
          </Link>
          <DeleteApplicationButton
            id={application.id}
            company={application.company}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5">
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={application.status} />
            {application.url ? (
              <a
                href={application.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-accent hover:underline"
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
                  <dd className="mt-1 break-words text-sm text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Resume</h2>
          {application.resume ? (
            <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {application.resume.label}
                </p>
                <p className="break-all text-sm text-muted">
                  {application.resume.originalFilename}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <a
                  href={`/api/resumes/${application.resume.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border px-3 py-2 text-center text-sm font-medium hover:bg-subtle"
                >
                  Open
                </a>
                <a
                  href={`/api/resumes/${application.resume.id}/file?download=1`}
                  className="rounded-lg border border-border px-3 py-2 text-center text-sm font-medium hover:bg-subtle"
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
                className="font-medium text-accent hover:underline"
              >
                Add one
              </Link>
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Notes</h2>
          {application.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {application.notes}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">No notes yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Status history</h2>
          <ol className="mt-4 space-y-3">
            {application.events.map((event) => (
              <li
                key={event.id}
                className="flex min-w-0 flex-wrap items-center justify-between gap-2"
              >
                <StatusBadge status={event.status} />
                <span className="shrink-0 text-xs text-muted">
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
