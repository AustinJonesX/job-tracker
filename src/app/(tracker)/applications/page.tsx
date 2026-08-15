import { Suspense } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { listApplications } from "@/db/queries";
import { isStatus, type Status } from "@/lib/constants";
import { formatDate, todayIsoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

function parseList(value?: string | string[]) {
  if (!value) return undefined;
  return (Array.isArray(value) ? value.join(",") : value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const statuses = parseList(params.status)?.filter(isStatus) as
    | Status[]
    | undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;
  const applications = listApplications({ q, statuses, from, to });
  const today = todayIsoDate();
  const filtered = Boolean(q || statuses?.length || from || to);

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Search, filter, and open a row to see the posting, resume, and status history."
        action={{ href: "/applications/new", label: "Add application" }}
      />
      <Suspense>
        <FilterBar />
      </Suspense>

      {applications.length === 0 ? (
        <EmptyState
          title={filtered ? "No matching applications" : "No applications yet"}
          body={
            filtered
              ? "Try clearing filters or searching for a different company or title."
              : "Add a job you are interested in. You can attach a tailored resume now or pick one from your library later."
          }
          actionHref={filtered ? undefined : "/applications/new"}
          actionLabel={filtered ? undefined : "Add application"}
        />
      ) : (
        <>
          <ul className="space-y-2 lg:hidden">
            {applications.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/applications/${app.id}`}
                  className="block min-w-0 rounded-xl border border-border bg-card p-3"
                >
                  <p className="truncate font-medium text-foreground">
                    {app.company}
                  </p>
                  <p className="truncate text-sm text-muted">{app.title}</p>
                  <div className="mt-2">
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    <span>Applied {formatDate(app.appliedAt)}</span>
                    {app.followUpOn ? (
                      <span
                        className={
                          app.followUpOn < today
                            ? "font-medium text-danger"
                            : app.followUpOn === today
                              ? "font-medium text-warning"
                              : undefined
                        }
                      >
                        Follow-up {formatDate(app.followUpOn)}
                      </span>
                    ) : null}
                    {app.resumeLabel ? (
                      <span className="min-w-0 break-all">{app.resumeLabel}</span>
                    ) : null}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card lg:block">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-border bg-subtle text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Company / role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium">Follow-up</th>
                  <th className="px-4 py-3 font-medium">Resume</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-border last:border-0">
                    <td className="max-w-xs px-4 py-3">
                      <Link
                        href={`/applications/${app.id}`}
                        className="block min-w-0 hover:text-accent"
                      >
                        <span className="block truncate font-medium text-foreground">
                          {app.company}
                        </span>
                        <span className="mt-0.5 block truncate text-muted">
                          {app.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(app.appliedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {app.followUpOn ? (
                        <span
                          className={
                            app.followUpOn < today
                              ? "font-medium text-danger"
                              : app.followUpOn === today
                                ? "font-medium text-warning"
                                : "text-muted"
                          }
                        >
                          {formatDate(app.followUpOn)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {app.resumeLabel ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
