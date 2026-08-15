import { NextResponse } from "next/server";
import { listResumes, upsertResumeFromUpload } from "@/db/queries";
import { handleApiError, jsonError, readResumeFromForm, requireShareSession } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireShareSession(request);
    return NextResponse.json({ resumes: listResumes() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireShareSession(request);
    const form = await request.formData();
    const upload = await readResumeFromForm(form);
    if (!upload) return jsonError("A resume file is required");
    const result = upsertResumeFromUpload(upload);
    return NextResponse.json(result, { status: result.reused ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
