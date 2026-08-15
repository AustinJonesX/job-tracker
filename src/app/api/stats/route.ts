import { NextResponse } from "next/server";
import { getDashboardData, getStatusCounts } from "@/db/queries";
import { getIntegrityStatus } from "@/db/client";
import { handleApiError } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      integrity: getIntegrityStatus(),
      counts: getStatusCounts(),
      dashboard: getDashboardData(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
