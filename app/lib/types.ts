export type ChunkingMode = "characters" | "paragraphs" | "sentences";

export interface ChunkingSettings {
  mode: ChunkingMode;
  chunkSize: number;
  overlap: number;
}

export interface DocumentRecord {
  id: string;
  title: string;
  sourceLabel: string;
  rawText: string;
  createdAt: string;
}

export interface ChunkRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  sourceLabel: string;
  chunkIndex: number;
  text: string;
  wordCount: number;
  charCount: number;
  embedding: number[] | null;
  createdAt: string;
}

export interface SearchResult {
  rank: number;
  similarity: number;
  chunk: ChunkRecord;
}

export interface SearchRun {
  id: string;
  query: string;
  timestamp: string;
  topK: number;
  threshold: number;
  documentId: string | null;
  chunkingStrategy: string;
  results: SearchResult[];
  latencyMs: number;
}

export interface VectorMetrics {
  totalDocuments: number;
  totalChunks: number;
  embeddedChunks: number;
  embeddingDimensions: number;
  averageChunkSize: number;
  lastSearchLatency: number;
  searchesRun: number;
  highestSimilarity: number;
}

export interface ComparisonRow {
  strategy: string;
  topResultScore: number;
  averageTop5Score: number;
  chunkCount: number;
  bestMatchingChunk: string;
}
