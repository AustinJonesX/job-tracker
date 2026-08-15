import { STATUS_COLORS, statusLabel, type Status } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const badgeClass = STATUS_COLORS[status as Status] ?? "badge-neutral";

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      {statusLabel(status)}
    </span>
  );
}
