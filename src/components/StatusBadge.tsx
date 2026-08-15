import { STATUS_COLORS, statusLabel, type Status } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status as Status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {statusLabel(status)}
    </span>
  );
}
