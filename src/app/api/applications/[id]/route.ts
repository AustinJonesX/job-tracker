import { NextResponse } from "next/server";
import {
  getApplication,
  softDeleteApplication,
  updateApplication,
  upsertResumeFromUpload,
  type ApplicationInput,
} from "@/db/queries";
import { isStatus } from "@/lib/constants";
import {
  formText,
  handleApiError,
  jsonError,
  parseId,
  readResumeFromForm,
} from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function patchFromForm(form: FormData): Partial<ApplicationInput> {
  const patch: Partial<ApplicationInput> = {};
  const title = formText(form, "title");
  const company = formText(form, "company");
  const status = formText(form, "status");
  if (title !== undefined) patch.title = title;
  if (company !== undefined) patch.company = company;
  if (form.has("url")) patch.url = formText(form, "url");
  if (form.has("location")) patch.location = formText(form, "location");
  if (form.has("workMode")) patch.workMode = formText(form, "workMode");
  if (form.has("source")) patch.source = formText(form, "source");
  if (form.has("salary")) patch.salary = formText(form, "salary");
  if (status !== undefined) {
    if (!isStatus(status)) throw new Error("Invalid status");
    patch.status = status;
  }
  if (form.has("resumeId")) {
    const raw = formText(form, "resumeId");
    patch.resumeId = raw ? Number(raw) : null;
  }
  if (form.has("appliedAt")) patch.appliedAt = formText(form, "appliedAt");
  if (form.has("followUpOn")) patch.followUpOn = formText(form, "followUpOn");
  if (form.has("notes")) patch.notes = formText(form, "notes");
  return patch;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = parseId((await context.params).id);
    const application = getApplication(id);
    if (!application) return jsonError("Application not found", 404);
    return NextResponse.json({ application });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const id = parseId((await context.params).id);
    const form = await request.formData();
    const patch = patchFromForm(form);
    const upload = await readResumeFromForm(form);
    if (upload) {
      const { resume } = upsertResumeFromUpload(upload);
      patch.resumeId = resume.id;
    }
    const application = updateApplication(id, patch);
    return NextResponse.json({ application });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = parseId((await context.params).id);
    softDeleteApplication(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
