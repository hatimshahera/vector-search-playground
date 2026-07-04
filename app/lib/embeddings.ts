import { createHash } from "node:crypto";

const LOCAL_DIMENSIONS = 96;
const CONCEPTS = [
  ["retrieval", "retrieve", "retriever", "rag", "chunk", "chunks", "chunking", "overlap", "semantic"],
  ["embedding", "embeddings", "vector", "vectors", "similarity", "cosine", "distance", "neighbor", "ranked"],
  ["gateway", "route", "routing", "provider", "fallback", "retry", "cache", "rate", "limit"],
  ["evaluation", "evaluations", "benchmark", "benchmarks", "scoring", "rubric", "regression", "test"],
  ["latency", "tokens", "streaming", "cost", "price", "response", "throughput"],
  ["metadata", "timestamp", "version", "prompt", "template", "reproducible", "debugged"],
  ["threshold", "top", "filter", "filters", "missed", "precision", "quality", "context"],
];

function normalize(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return magnitude ? vector.map((value) => value / magnitude) : vector;
}

function tokenize(text: string) {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function localEmbed(text: string) {
  const vector = Array.from({ length: LOCAL_DIMENSIONS }, () => 0);
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);

  CONCEPTS.forEach((concept, index) => {
    const hits = concept.filter((token) => tokenSet.has(token)).length;
    if (hits) vector[index] += 4 * hits;
  });

  for (const token of tokens) {
    const hash = createHash("sha256").update(token).digest();
    for (let i = 0; i < 8; i += 1) {
      const index = 16 + (hash[i] % (LOCAL_DIMENSIONS - 16));
      const sign = hash[i + 8] % 2 === 0 ? 1 : -1;
      vector[index] += sign * (1 + Math.min(token.length, 12) / 12);
    }
  }
  return normalize(vector);
}

async function openAiEmbedMany(texts: string[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding provider failed with ${response.status}.`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
  };

  return data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

export async function embedText(text: string) {
  const [embedding] = await embedMany([text]);
  return embedding;
}

export async function embedMany(texts: string[]) {
  if (!texts.length) return [];
  const openAiEmbeddings = await openAiEmbedMany(texts);
  return openAiEmbeddings ?? texts.map(localEmbed);
}

export function getEmbeddingProviderLabel() {
  return process.env.OPENAI_API_KEY
    ? process.env.EMBEDDING_MODEL ?? "text-embedding-3-small"
    : "local-hash-embedding-demo";
}
