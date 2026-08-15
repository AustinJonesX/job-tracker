"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STATUSES } from "@/lib/constants";
import { BrandLink, NAV, NavIcon, navItemActive } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar({
  counts,
  total,
  integrityOk,
  integrityMessage,
}: {
  counts: Record<string, number>;
  total: number;
  integrityOk: boolean;
  integrityMessage: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="border-b border-border px-5 py-5">
        <BrandLink />
        <Link
          href="/applications/new"
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover"
        >
          Add application
        </Link>
      </div>

      <nav className="px-3 py-4">
        {NAV.map((item) => {
          const active = navItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-accent-subtle text-accent"
                  : "text-muted hover:bg-subtle hover:text-foreground"
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label === "Home"
                ? "Dashboard"
                : item.label === "Jobs"
                  ? "Applications"
                  : item.label === "Share"
                    ? "Remote access"
                    : item.label}
              {item.href === "/applications" ? (
                <span className="ml-auto text-xs text-muted">{total}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Status
        </p>
        {STATUSES.map((status) => {
          const count = counts[status.value] ?? 0;
          return (
            <Link
              key={status.value}
              href={`/applications?status=${status.value}`}
              className="mb-0.5 flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-subtle hover:text-foreground"
            >
              <span>{status.label}</span>
              <span className="text-xs tabular-nums text-muted">{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto space-y-3 border-t border-border px-5 py-4 text-xs text-muted">
        <ThemeToggle />
        {integrityOk ? (
          <p>SQLite data is stored locally in this project.</p>
        ) : (
          <p className="text-danger">
            Database integrity check failed. Writes are blocked.
            {integrityMessage ? ` ${integrityMessage}` : ""}
          </p>
        )}
      </div>
    </aside>
  );
}
