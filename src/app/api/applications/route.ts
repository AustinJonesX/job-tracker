import { NextResponse } from "next/server";
import {
  createApplication,
  listApplications,
  upsertResumeFromUpload,
  type ApplicationInput,
} from "@/db/queries";
import { isStatus, type Status } from "@/lib/constants";
import {
  formText,
  handleApiError,
  readResumeFromForm,
  requireShareSession,
} from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseStatuses(raw: string | null): Status[] | undefined {
  if (!raw) return undefined;
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.some((value) => !isStatus(value))) {
    throw new Error("Invalid status filter");
  }
  return values as Status[];
}

function inputFromForm(form: FormData): ApplicationInput {
  const status = formText(form, "status") ?? "interested";
  if (!isStatus(status)) {
    throw new Error("Invalid status");
  }
  const resumeIdRaw = formText(form, "resumeId");
  return {
    title: formText(form, "title") ?? "",
    company: formText(form, "company") ?? "",
    url: formText(form, "url"),
    location: formText(form, "location"),
    workMode: formText(form, "workMode"),
    source: formText(form, "source"),
    salary: formText(form, "salary"),
    status,
    resumeId: resumeIdRaw ? Number(resumeIdRaw) : null,
    appliedAt: formText(form, "appliedAt"),
    followUpOn: formText(form, "followUpOn"),
    notes: formText(form, "notes"),
  };
}

export async function GET(request: Request) {
  try {
    requireShareSession(request);
    const url = new URL(request.url);
    const applications = listApplications({
      q: url.searchParams.get("q") ?? undefined,
      statuses: parseStatuses(url.searchParams.get("status")),
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });
    return NextResponse.json({ applications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireShareSession(request);
    const form = await request.formData();
    const input = inputFromForm(form);
    const upload = await readResumeFromForm(form);
    if (upload) {
      const { resume } = upsertResumeFromUpload(upload);
      input.resumeId = resume.id;
    }
    const application = createApplication(input);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
