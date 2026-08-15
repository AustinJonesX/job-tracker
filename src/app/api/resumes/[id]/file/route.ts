import fs from "node:fs";
import { NextResponse } from "next/server";
import { resumeFilePath } from "@/db/client";
import { getResume } from "@/db/queries";
import { handleApiError, jsonError, parseId } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  rtf: "application/rtf",
  pages: "application/vnd.apple.pages",
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const id = parseId((await context.params).id);
    const resume = getResume(id);
    if (!resume) return jsonError("Resume not found", 404);

    const filePath = resumeFilePath(resume.sha256, resume.extension);
    if (!fs.existsSync(filePath)) {
      return jsonError("Resume file is missing from disk", 404);
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    const buffer = fs.readFileSync(filePath);
    const contentType =
      CONTENT_TYPES[resume.extension] ?? "application/octet-stream";
    const disposition = download ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `${disposition}; filename="${resume.originalFilename.replaceAll('"', "")}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
