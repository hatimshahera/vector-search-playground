import { NextResponse } from "next/server";
import { getState } from "../../../lib/store";

export const runtime = "nodejs";

export async function GET() {
  const state = getState();
  return NextResponse.json({
    searchRuns: state.searchRuns,
    metrics: state.metrics,
  });
}
