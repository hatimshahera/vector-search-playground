import { ChunkingSettings } from "./types";

export function estimateTokenCount(text: string) {
  return Math.ceil(text.trim().split(/\s+/).filter(Boolean).join(" ").length / 4);
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function chunkByCharacters(text: string, size: number, overlap: number) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const safeSize = Math.max(120, size);
  const safeOverlap = Math.min(Math.max(0, overlap), safeSize - 1);
  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + safeSize, normalized.length);
    chunks.push(normalized.slice(start, end).trim());
    if (end === normalized.length) break;
    start = end - safeOverlap;
  }

  return chunks.filter(Boolean);
}

export function chunkByParagraphs(text: string) {
  return text
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

export function chunkBySentences(text: string) {
  const matches = text
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return (matches ?? []).map((chunk) => chunk.trim()).filter(Boolean);
}

export function chunkText(text: string, settings: ChunkingSettings) {
  if (settings.mode === "paragraphs") return chunkByParagraphs(text);
  if (settings.mode === "sentences") return chunkBySentences(text);
  return chunkByCharacters(text, settings.chunkSize, settings.overlap);
}

export function describeChunking(settings: ChunkingSettings) {
  if (settings.mode === "paragraphs") return "Paragraph split";
  if (settings.mode === "sentences") return "Sentence split";
  return `${settings.chunkSize} chars / ${settings.overlap} overlap`;
}
