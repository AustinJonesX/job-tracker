import { NextResponse } from "next/server";
import { handleApiError, jsonError, requireShareSession } from "@/lib/api-helpers";
import {
  SESSION_COOKIE,
  getOrCreateShareConfig,
  sessionCookieValue,
  setSharePassword,
} from "@/lib/share-config";
import {
  disableShare,
  enableShare,
  shareStatus,
} from "@/lib/share-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireShareSession(request);
    return NextResponse.json(await shareStatus());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireShareSession(request);
    const form = await request.formData();
    const action = String(form.get("action") ?? "");
    const password = String(form.get("password") ?? "").trim();
    const portRaw = String(form.get("publicPort") ?? "");
    const publicPort = portRaw ? Number(portRaw) : undefined;
    const methodRaw = String(form.get("method") ?? "");
    const method =
      methodRaw === "upnp" || methodRaw === "port-forward"
        ? methodRaw
        : undefined;

    if (action === "enable") {
      if (password) setSharePassword(password);
      await enableShare({ publicPort, method });
      const config = getOrCreateShareConfig();
      const response = NextResponse.json(await shareStatus());
      response.cookies.set({
        name: SESSION_COOKIE,
        value: sessionCookieValue(config.sessionSecret),
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }
    if (action === "disable") {
      await disableShare();
      return NextResponse.json(await shareStatus());
    }
    return jsonError("Unknown action");
  } catch (error) {
    return handleApiError(error);
  }
}
