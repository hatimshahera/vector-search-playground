import { randomUUID } from "node:crypto";
import { chunkText, countWords, describeChunking } from "./chunking";
import { demoDocuments } from "./demo-data";
import { embedMany, embedText } from "./embeddings";
import {
  ChunkingSettings,
  ChunkRecord,
  ComparisonRow,
  DocumentRecord,
  SearchResult,
  SearchRun,
  VectorMetrics,
} from "./types";
import { average, cosineSimilarity } from "./vector";

const SEARCH_LIMIT = 30;
const DEFAULT_SETTINGS: ChunkingSettings = {
  mode: "paragraphs",
  chunkSize: 700,
  overlap: 100,
};

type VectorStore = {
  documents: DocumentRecord[];
  chunks: ChunkRecord[];
  searchRuns: SearchRun[];
  activeChunking: ChunkingSettings;
};

const globalStore = globalThis as typeof globalThis & {
  __vectorSearchStore?: VectorStore;
};

function createChunkRecords(documents: DocumentRecord[], settings: ChunkingSettings) {
  return documents.flatMap((document) =>
    chunkText(document.rawText, settings).map((text, index) => ({
      id: `chunk_${document.id}_${index}_${randomUUID().slice(0, 8)}`,
      documentId: document.id,
      documentTitle: document.title,
      sourceLabel: document.sourceLabel,
      chunkIndex: index + 1,
      text,
      wordCount: countWords(text),
      charCount: text.length,
      embedding: null,
      createdAt: new Date().toISOString(),
    })),
  );
}

function getStore() {
  if (!globalStore.__vectorSearchStore) {
    const documents = demoDocuments.map((document) => ({ ...document }));
    globalStore.__vectorSearchStore = {
      documents,
      chunks: createChunkRecords(documents, DEFAULT_SETTINGS),
      searchRuns: [],
      activeChunking: DEFAULT_SETTINGS,
    };
  }

  return globalStore.__vectorSearchStore;
}

export function getState() {
  const store = getStore();
  return {
    documents: store.documents,
    chunks: store.chunks,
    searchRuns: store.searchRuns,
    metrics: getMetrics(),
    activeChunking: store.activeChunking,
  };
}

export function addDocument(input: {
  title: string;
  sourceLabel: string;
  rawText: string;
}) {
  const store = getStore();
  const document: DocumentRecord = {
    id: `doc_${randomUUID().slice(0, 8)}`,
    title: input.title.trim() || "Untitled document",
    sourceLabel: input.sourceLabel.trim() || "manual",
    rawText: input.rawText.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!document.rawText) throw new Error("Document text is required.");
  store.documents.unshift(document);
  store.chunks = createChunkRecords(store.documents, store.activeChunking);
  return document;
}

export function deleteDocument(id: string) {
  const store = getStore();
  store.documents = store.documents.filter((document) => document.id !== id);
  store.chunks = store.chunks.filter((chunk) => chunk.documentId !== id);
  store.searchRuns = store.searchRuns.filter((run) =>
    run.results.every((result) => result.chunk.documentId !== id),
  );
}

export function rechunk(settings: ChunkingSettings) {
  const store = getStore();
  store.activeChunking = {
    mode: settings.mode,
    chunkSize: Number(settings.chunkSize),
    overlap: Number(settings.overlap),
  };
  store.chunks = createChunkRecords(store.documents, store.activeChunking);
  return store.chunks;
}

export async function embedCurrentChunks() {
  const store = getStore();
  const embeddings = await embedMany(store.chunks.map((chunk) => chunk.text));
  store.chunks = store.chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index] ?? null,
  }));
  return store.chunks;
}

function rankChunks(queryEmbedding: number[], chunks: ChunkRecord[], topK: number, threshold: number) {
  return chunks
    .filter((chunk) => chunk.embedding)
    .map((chunk) => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding ?? []),
    }))
    .filter((result) => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map((result, index) => ({
      rank: index + 1,
      similarity: result.similarity,
      chunk: result.chunk,
    }));
}

export async function search(input: {
  query: string;
  topK: number;
  threshold: number;
  documentId?: string | null;
}) {
  const store = getStore();
  const startedAt = performance.now();
  const query = input.query.trim();
  if (!query) throw new Error("Search query is required.");
  if (store.chunks.some((chunk) => !chunk.embedding)) await embedCurrentChunks();

  const queryEmbedding = await embedText(query);
  const candidateChunks = input.documentId
    ? store.chunks.filter((chunk) => chunk.documentId === input.documentId)
    : store.chunks;
  const results = rankChunks(
    queryEmbedding,
    candidateChunks,
    Math.max(1, Math.min(20, input.topK)),
    Math.max(0, Math.min(1, input.threshold)),
  );
  const latencyMs = Math.round(performance.now() - startedAt);
  const run: SearchRun = {
    id: `run_${randomUUID().slice(0, 8)}`,
    query,
    timestamp: new Date().toISOString(),
    topK: input.topK,
    threshold: input.threshold,
    documentId: input.documentId ?? null,
    chunkingStrategy: describeChunking(store.activeChunking),
    results,
    latencyMs,
  };

  store.searchRuns.unshift(run);
  if (store.searchRuns.length > SEARCH_LIMIT) store.searchRuns.length = SEARCH_LIMIT;
  return run;
}

export async function compareStrategies(query: string): Promise<ComparisonRow[]> {
  const store = getStore();
  const strategies: Array<{ label: string; settings: ChunkingSettings }> = [
    { label: "Small chunks", settings: { mode: "characters", chunkSize: 300, overlap: 50 } },
    { label: "Medium chunks", settings: { mode: "characters", chunkSize: 700, overlap: 100 } },
    { label: "Large chunks", settings: { mode: "characters", chunkSize: 1200, overlap: 150 } },
    { label: "Paragraph split", settings: { mode: "paragraphs", chunkSize: 700, overlap: 0 } },
  ];
  const queryEmbedding = await embedText(query.trim());

  return Promise.all(
    strategies.map(async ({ label, settings }) => {
      const chunks = createChunkRecords(store.documents, settings);
      const embeddings = await embedMany(chunks.map((chunk) => chunk.text));
      const embeddedChunks = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index] ?? null,
      }));
      const results = rankChunks(queryEmbedding, embeddedChunks, 5, 0);
      return {
        strategy: label,
        topResultScore: results[0]?.similarity ?? 0,
        averageTop5Score: average(results.map((result) => result.similarity)),
        chunkCount: chunks.length,
        bestMatchingChunk: results[0]?.chunk.text ?? "",
      };
    }),
  );
}

export function getMetrics(): VectorMetrics {
  const store = getStore();
  const embeddedChunks = store.chunks.filter((chunk) => chunk.embedding);
  const highestSimilarity = Math.max(
    0,
    ...store.searchRuns.flatMap((run) => run.results.map((result) => result.similarity)),
  );

  return {
    totalDocuments: store.documents.length,
    totalChunks: store.chunks.length,
    embeddedChunks: embeddedChunks.length,
    embeddingDimensions: embeddedChunks[0]?.embedding?.length ?? 0,
    averageChunkSize: Math.round(average(store.chunks.map((chunk) => chunk.charCount))),
    lastSearchLatency: store.searchRuns[0]?.latencyMs ?? 0,
    searchesRun: store.searchRuns.length,
    highestSimilarity,
  };
}
