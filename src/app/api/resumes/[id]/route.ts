import { NextResponse } from "next/server";
import { deleteResume, getResume, renameResume } from "@/db/queries";
import {
  formText,
  handleApiError,
  jsonError,
  parseId,
} from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = parseId((await context.params).id);
    const resume = getResume(id);
    if (!resume) return jsonError("Resume not found", 404);
    return NextResponse.json({ resume });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const id = parseId((await context.params).id);
    const form = await request.formData();
    const label = formText(form, "label");
    if (label === undefined) return jsonError("Label is required");
    const resume = renameResume(id, label);
    return NextResponse.json({ resume });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = parseId((await context.params).id);
    deleteResume(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
