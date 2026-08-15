export const STATUSES = [
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "ghosted", label: "Ghosted" },
] as const;

export type Status = (typeof STATUSES)[number]["value"];

export const STATUS_VALUES = STATUSES.map((s) => s.value);

export const TERMINAL_STATUSES: Status[] = [
  "accepted",
  "rejected",
  "withdrawn",
];

export const SOURCES = [
  "LinkedIn",
  "Company site",
  "Referral",
  "Indeed",
  "Wellfound",
  "Recruiter",
  "Other",
] as const;

export const WORK_MODES = ["Remote", "Hybrid", "On-site"] as const;

export const ALLOWED_RESUME_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "pages",
] as const;

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export const STATUS_COLORS: Record<Status, { bg: string; text: string; dot: string }> =
  {
    interested: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      dot: "bg-slate-500",
    },
    applied: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      dot: "bg-blue-600",
    },
    screening: {
      bg: "bg-cyan-100",
      text: "text-cyan-800",
      dot: "bg-cyan-600",
    },
    interviewing: {
      bg: "bg-violet-100",
      text: "text-violet-800",
      dot: "bg-violet-600",
    },
    offer: {
      bg: "bg-amber-100",
      text: "text-amber-900",
      dot: "bg-amber-500",
    },
    accepted: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      dot: "bg-emerald-600",
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-800",
      dot: "bg-red-600",
    },
    withdrawn: {
      bg: "bg-stone-100",
      text: "text-stone-700",
      dot: "bg-stone-500",
    },
    ghosted: {
      bg: "bg-orange-100",
      text: "text-orange-800",
      dot: "bg-orange-500",
    },
  };

export function isStatus(value: string): value is Status {
  return (STATUS_VALUES as string[]).includes(value);
}

export function statusLabel(value: string): string {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}
