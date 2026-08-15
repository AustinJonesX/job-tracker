import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getDashboardData } from "@/db/queries";
import { STATUSES } from "@/lib/constants";
import { daysFromToday, formatDate, todayIsoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

function followUpLabel(date: string) {
  const delta = daysFromToday(date);
  if (delta < 0) return `${Math.abs(delta)}d overdue`;
  if (delta === 0) return "Due today";
  if (delta === 1) return "Tomorrow";
  return `In ${delta}d`;
}

export default function DashboardPage() {
  const data = getDashboardData();
  const today = todayIsoDate();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A snapshot of your pipeline and anything that needs a follow-up."
        action={{ href: "/applications/new", label: "Add application" }}
      />

      {data.total === 0 ? (
        <EmptyState
          title="No applications yet"
          body="Add a job you are interested in, attach the resume you tailored for it, and track it from first click to offer."
          actionHref="/applications/new"
          actionLabel="Add application"
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {STATUSES.map((status) => {
              const count = data.counts[status.value] ?? 0;
              return (
                <Link
                  key={status.value}
                  href={`/applications?status=${status.value}`}
                  className="rounded-2xl border border-border bg-card px-4 py-4 hover:border-accent hover:shadow-sm"
                >
                  <p className="text-sm text-muted">{status.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {count}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Follow-ups
                </h2>
                <span className="text-xs text-muted">
                  {data.overdue.length} overdue · {data.dueToday.length} today
                </span>
              </div>
              {data.overdue.length + data.dueToday.length + data.upcoming.length ===
              0 ? (
                <p className="text-sm text-muted">
                  Nothing scheduled. Set a follow-up date on an application to
                  see it here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {[...data.overdue, ...data.dueToday, ...data.upcoming].map(
                    (item) => (
                      <li key={item.id}>
                        <Link
                          href={`/applications/${item.id}`}
                          className="flex items-start justify-between gap-3 rounded-lg p-2 hover:bg-subtle"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {item.company}
                            </p>
                            <p className="text-sm text-muted">{item.title}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-xs font-medium ${
                                item.followUpOn! < today
                                  ? "text-danger"
                                  : item.followUpOn === today
                                    ? "text-warning"
                                    : "text-muted"
                              }`}
                            >
                              {followUpLabel(item.followUpOn!)}
                            </p>
                            <p className="text-xs text-muted">
                              {formatDate(item.followUpOn)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Recently updated
                </h2>
                <Link
                  href="/applications"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  View all
                </Link>
              </div>
              <ul className="space-y-3">
                {data.recent.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/applications/${item.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-subtle"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.company}
                        </p>
                        <p className="text-sm text-muted">{item.title}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
