import { NextResponse } from "next/server";
import { compareStrategies, getState, search } from "../../../lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const input = body as {
    query?: string;
    topK?: number;
    threshold?: number;
    documentId?: string | null;
    compare?: boolean;
  };

  try {
    const run = await search({
      query: input.query ?? "",
      topK: Number(input.topK ?? 5),
      threshold: Number(input.threshold ?? 0),
      documentId: input.documentId ?? null,
    });
    const comparison = input.compare ? await compareStrategies(input.query ?? "") : [];
    return NextResponse.json({
      run,
      comparison,
      state: getState(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed." },
      { status: 400 },
    );
  }
}
