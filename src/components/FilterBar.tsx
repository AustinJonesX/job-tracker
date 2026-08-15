"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { STATUSES, type Status } from "@/lib/constants";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<number | null>(null);
  const urlQuery = searchParams.get("q") ?? "";
  const selected = new Set(
    (searchParams.get("status") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggleStatus(status: Status) {
    const copy = new Set(selected);
    if (copy.has(status)) copy.delete(status);
    else copy.add(status);
    update({ status: copy.size ? Array.from(copy).join(",") : null });
  }

  const hasFilters =
    Boolean(urlQuery) ||
    selected.size > 0 ||
    Boolean(searchParams.get("from")) ||
    Boolean(searchParams.get("to"));

  return (
    <div className="mb-5 rounded-2xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 text-sm">
          <span className="mb-1 block font-medium text-gray-700">Search</span>
          <input
            key={`${searchParams.get("status") ?? ""}|${searchParams.get("from") ?? ""}|${searchParams.get("to") ?? ""}`}
            defaultValue={urlQuery}
            onChange={(event) => {
              const value = event.target.value;
              if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
              timeoutRef.current = window.setTimeout(() => {
                update({ q: value.trim() || null });
              }, 250);
            }}
            placeholder="Company, title, or location"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">From</span>
          <input
            type="date"
            value={searchParams.get("from") ?? ""}
            onChange={(event) => update({ from: event.target.value || null })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">To</span>
          <input
            type="date"
            value={searchParams.get("to") ?? ""}
            onChange={(event) => update({ to: event.target.value || null })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
        </label>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="rounded-lg border border-border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear filters
          </button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {STATUSES.map((status) => {
          const active = selected.has(status.value);
          return (
            <button
              key={status.value}
              type="button"
              onClick={() => toggleStatus(status.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                active
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
