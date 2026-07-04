import { NextResponse } from "next/server";
import { rechunk, getState } from "../../../lib/store";
import { ChunkingMode } from "../../../lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const input = body as { mode?: ChunkingMode; chunkSize?: number; overlap?: number };
  if (!input.mode || !["characters", "paragraphs", "sentences"].includes(input.mode)) {
    return NextResponse.json({ error: "A valid chunking mode is required." }, { status: 400 });
  }

  rechunk({
    mode: input.mode,
    chunkSize: Number(input.chunkSize ?? 700),
    overlap: Number(input.overlap ?? 100),
  });
  return NextResponse.json(getState());
}
