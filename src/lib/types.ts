import type { Application, Resume, StatusEvent } from "@/db/schema";
import type { Status } from "@/lib/constants";

export type ApplicationListItem = {
  id: number;
  title: string;
  company: string;
  url: string | null;
  location: string | null;
  workMode: string | null;
  source: string | null;
  salary: string | null;
  status: string;
  resumeId: number | null;
  resumeLabel: string | null;
  appliedAt: string | null;
  followUpOn: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationDetail = ApplicationListItem & {
  resume: Resume | null;
  events: StatusEvent[];
};

export type ResumeListItem = Resume & {
  usageCount: number;
  usedBy: { id: number; company: string; title: string }[];
};

export type ApplicationFilters = {
  q?: string;
  statuses?: Status[];
  from?: string;
  to?: string;
};

export type ApplicationInput = {
  title: string;
  company: string;
  url?: string | null;
  location?: string | null;
  workMode?: string | null;
  source?: string | null;
  salary?: string | null;
  status: Status;
  resumeId?: number | null;
  appliedAt?: string | null;
  followUpOn?: string | null;
  notes?: string | null;
};

export type { Application, Resume, StatusEvent };
