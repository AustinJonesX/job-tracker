"use client";

import { useRouter } from "next/navigation";
import { STATUSES, type Status } from "@/lib/constants";

export function StatusSelect({
  applicationId,
  value,
}: {
  applicationId: number;
  value: string;
}) {
  const router = useRouter();

  async function onChange(next: string) {
    const form = new FormData();
    form.set("status", next);
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      body: form,
    });
    if (response.ok) router.refresh();
  }

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as Status)}
      className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
    >
      {STATUSES.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
}
