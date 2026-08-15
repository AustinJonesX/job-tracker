import { NextResponse } from "next/server";
import { DatabaseIntegrityError } from "@/db/client";
import {
  SESSION_COOKIE,
  isValidSession,
  loadShareConfig,
} from "@/lib/share-config";

export class AuthError extends Error {
  constructor() {
    super("Sign in required");
    this.name = "AuthError";
  }
}

function cookieValue(header: string | null, name: string) {
  if (!header) return undefined;
  for (const part of header.split(/;\s*/)) {
    const [key, ...rest] = part.split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export function requireShareSession(request: Request) {
  const config = loadShareConfig();
  if (!config?.enabled) return;
  const token = cookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  if (!isValidSession(token, config.sessionSecret)) {
    throw new AuthError();
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return jsonError(error.message, 401);
  }
  if (error instanceof DatabaseIntegrityError) {
    return jsonError(error.message, 503);
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  const notFound = /not found/i.test(message);
  return jsonError(message, notFound ? 404 : 400);
}

export function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid id");
  }
  return id;
}

export async function readResumeFromForm(form: FormData) {
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return null;
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const label = String(form.get("resumeLabel") ?? "");
  return {
    buffer,
    originalFilename: file.name || "resume.pdf",
    label,
  };
}

export function formText(form: FormData, key: string) {
  const value = form.get(key);
  if (typeof value !== "string") return undefined;
  return value;
}
