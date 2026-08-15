"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STATUSES } from "@/lib/constants";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/applications", label: "Applications", icon: "list" },
  { href: "/resumes", label: "Resumes", icon: "file" },
] as const;

function Icon({ name }: { name: (typeof NAV)[number]["icon"] }) {
  const className = "h-4 w-4";
  if (name === "grid") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "list") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

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
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-white">
      <div className="border-b border-border px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <rect x="3" y="7" width="18" height="14" rx="2" />
              <path d="M3 12h18" />
            </svg>
          </span>
          <span>
            <span className="block text-sm font-semibold text-gray-900">Job Tracker</span>
            <span className="block text-xs text-muted">Local applications</span>
          </span>
        </Link>
        <Link
          href="/applications/new"
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add application
        </Link>
      </div>

      <nav className="px-3 py-4">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon name={item.icon} />
              {item.label}
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
              className={`mb-0.5 flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
                pathname.startsWith("/applications")
                  ? "text-gray-700 hover:bg-gray-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{status.label}</span>
              <span className="text-xs tabular-nums text-muted">{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-border px-5 py-4 text-xs text-muted">
        {integrityOk ? (
          <p>SQLite data is stored locally in this project.</p>
        ) : (
          <p className="text-red-700">
            Database integrity check failed. Writes are blocked.
            {integrityMessage ? ` ${integrityMessage}` : ""}
          </p>
        )}
      </div>
    </aside>
  );
}
