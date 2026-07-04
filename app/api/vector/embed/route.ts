import { NextResponse } from "next/server";
import { getEmbeddingProviderLabel } from "../../../lib/embeddings";
import { embedCurrentChunks, getState } from "../../../lib/store";

export const runtime = "nodejs";

export async function POST() {
  try {
    await embedCurrentChunks();
    return NextResponse.json({
      ...getState(),
      provider: getEmbeddingProviderLabel(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Embedding generation failed." },
      { status: 502 },
    );
  }
}
