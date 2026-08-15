import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  getOrCreateShareConfig,
  sessionCookieValue,
  verifyPassword,
} from "@/lib/share-config";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const config = getOrCreateShareConfig();
    if (!config.enabled) {
      return jsonError("Remote access is not turned on.", 403);
    }
    if (!verifyPassword(body.password ?? "", config.password)) {
      return jsonError("That password is not right.", 401);
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: sessionCookieValue(config.sessionSecret),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
