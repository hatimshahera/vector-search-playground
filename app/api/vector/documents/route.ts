import { NextResponse } from "next/server";
import { addDocument, getState } from "../../../lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getState());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const input = body as { title?: string; sourceLabel?: string; rawText?: string };
  try {
    addDocument({
      title: input.title ?? "",
      sourceLabel: input.sourceLabel ?? "",
      rawText: input.rawText ?? "",
    });
    return NextResponse.json(getState(), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add document." },
      { status: 400 },
    );
  }
}
