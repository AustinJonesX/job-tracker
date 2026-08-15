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

export const STATUS_COLORS: Record<Status, string> = {
  interested: "badge-neutral",
  applied: "badge-accent",
  screening: "badge-info",
  interviewing: "badge-done",
  offer: "badge-attention",
  accepted: "badge-success",
  rejected: "badge-danger",
  withdrawn: "badge-muted",
  ghosted: "badge-severe",
};

export function isStatus(value: string): value is Status {
  return (STATUS_VALUES as string[]).includes(value);
}

export function statusLabel(value: string): string {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}
