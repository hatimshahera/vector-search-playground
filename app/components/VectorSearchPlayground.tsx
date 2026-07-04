"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChunkingMode,
  ChunkingSettings,
  ChunkRecord,
  ComparisonRow,
  DocumentRecord,
  SearchRun,
  VectorMetrics,
} from "../lib/types";

interface VectorState {
  documents: DocumentRecord[];
  chunks: ChunkRecord[];
  searchRuns: SearchRun[];
  metrics: VectorMetrics;
  activeChunking: ChunkingSettings;
}

const EMPTY_METRICS: VectorMetrics = {
  totalDocuments: 0,
  totalChunks: 0,
  embeddedChunks: 0,
  embeddingDimensions: 0,
  averageChunkSize: 0,
  lastSearchLatency: 0,
  searchesRun: 0,
  highestSimilarity: 0,
};

const EMPTY_STATE: VectorState = {
  documents: [],
  chunks: [],
  searchRuns: [],
  metrics: EMPTY_METRICS,
  activeChunking: { mode: "paragraphs", chunkSize: 700, overlap: 100 },
};

function scoreLabel(score: number) {
  if (score >= 0.72) return "high";
  if (score >= 0.45) return "medium";
  return "low";
}

function formatScore(value: number) {
  return value.toFixed(3);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function VectorSearchPlayground() {
  const [state, setState] = useState<VectorState>(EMPTY_STATE);
  const [title, setTitle] = useState("Retrieval architecture note");
  const [sourceLabel, setSourceLabel] = useState("manual-lab");
  const [rawText, setRawText] = useState(
    "Chunking strategy changes what the retriever can find. Smaller chunks improve precision for focused facts, while larger chunks preserve context for broad questions.",
  );
  const [chunking, setChunking] = useState<ChunkingSettings>(EMPTY_STATE.activeChunking);
  const [query, setQuery] = useState("Why does chunk overlap improve retrieval quality?");
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.12);
  const [documentId, setDocumentId] = useState("");
  const [selectedRun, setSelectedRun] = useState<SearchRun | null>(null);
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("local-hash-embedding-demo");
  const [busyAction, setBusyAction] = useState("");

  const visibleChunks = useMemo(
    () =>
      documentId
        ? state.chunks.filter((chunk) => chunk.documentId === documentId)
        : state.chunks,
    [documentId, state.chunks],
  );
  const embeddingProgress = state.metrics.totalChunks
    ? Math.round((state.metrics.embeddedChunks / state.metrics.totalChunks) * 100)
    : 0;
  const latestRun = selectedRun ?? state.searchRuns[0] ?? null;

  async function loadState() {
    const response = await fetch("/api/vector/documents");
    if (!response.ok) return;
    const data = (await response.json()) as VectorState;
    setState(data);
    setChunking(data.activeChunking);
    setSelectedRun(data.searchRuns[0] ?? null);
  }

  useEffect(() => {
    loadState().catch(() => {});
  }, []);

  async function requestJson<T>(url: string, init?: RequestInit) {
    setError("");
    const response = await fetch(url, init);
    const data = (await response.json()) as unknown;
    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof data.error === "string"
          ? data.error
          : "Request failed.";
      throw new Error(message);
    }
    return data as T;
  }

  async function handleAddDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("document");
    try {
      const data = await requestJson<VectorState>("/api/vector/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sourceLabel, rawText }),
      });
      setState(data);
      setRawText("");
      setSelectedRun(data.searchRuns[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add document.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleChunk() {
    setBusyAction("chunk");
    try {
      const data = await requestJson<VectorState>("/api/vector/chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunking),
      });
      setState(data);
      setSelectedRun(data.searchRuns[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chunking failed.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleEmbed() {
    setBusyAction("embed");
    try {
      const data = await requestJson<VectorState & { provider: string }>("/api/vector/embed", {
        method: "POST",
      });
      setProvider(data.provider);
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Embedding failed.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("search");
    try {
      const data = await requestJson<{
        run: SearchRun;
        comparison: ComparisonRow[];
        state: VectorState;
      }>("/api/vector/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          topK,
          threshold,
          documentId: documentId || null,
          compare: true,
        }),
      });
      setSelectedRun(data.run);
      setComparison(data.comparison);
      setState(data.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleDelete(id: string) {
    setBusyAction(id);
    try {
      const data = await requestJson<VectorState>(`/api/vector/documents/${id}`, {
        method: "DELETE",
      });
      setState(data);
      if (documentId === id) setDocumentId("");
      setSelectedRun(data.searchRuns[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">60 Days of AI - Tool 04</p>
          <h1>Vector Search Playground</h1>
          <p className="lede">
            A retrieval lab for testing chunking, embeddings, cosine similarity,
            thresholds, and ranking quality before adding a chatbot layer.
          </p>
        </div>
        <div className="endpoint-card">
          <span>Route surface</span>
          <code>/api/vector/search</code>
          <p>Documents, chunks, vectors, search runs, and comparison strategies.</p>
        </div>
      </header>

      {error ? <div className="error">{error}</div> : null}

      <section className="lab-grid">
        <aside className="panel document-panel">
          <div className="panel-heading">
            <div>
              <h2>Documents</h2>
              <p>Add raw text, then regenerate chunks with a selected strategy.</p>
            </div>
          </div>

          <form onSubmit={handleAddDocument} className="stack">
            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Source label
              <input
                value={sourceLabel}
                onChange={(event) => setSourceLabel(event.target.value)}
              />
            </label>
            <label>
              Raw text
              <textarea
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                rows={7}
              />
            </label>
            <button type="submit" disabled={busyAction === "document"}>
              {busyAction === "document" ? "Adding..." : "Add document"}
            </button>
          </form>

          <div className="doc-list">
            {state.documents.map((document) => (
              <article key={document.id} className="doc-row">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setDocumentId(document.id === documentId ? "" : document.id)}
                >
                  <strong>{document.title}</strong>
                  <span>{document.sourceLabel}</span>
                </button>
                <button
                  type="button"
                  className="icon-button danger"
                  aria-label={`Delete ${document.title}`}
                  onClick={() => handleDelete(document.id)}
                  disabled={busyAction === document.id}
                >
                  x
                </button>
              </article>
            ))}
          </div>

          <div className="section-block">
            <h2>Chunking</h2>
            <div className="segmented">
              {(["paragraphs", "sentences", "characters"] as ChunkingMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={chunking.mode === mode ? "active" : ""}
                  onClick={() => setChunking((current) => ({ ...current, mode }))}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="two-col">
              <label>
                Chunk size
                <input
                  type="number"
                  min={120}
                  step={50}
                  value={chunking.chunkSize}
                  disabled={chunking.mode !== "characters"}
                  onChange={(event) =>
                    setChunking((current) => ({
                      ...current,
                      chunkSize: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Overlap
                <input
                  type="number"
                  min={0}
                  step={25}
                  value={chunking.overlap}
                  disabled={chunking.mode !== "characters"}
                  onChange={(event) =>
                    setChunking((current) => ({
                      ...current,
                      overlap: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <button type="button" onClick={handleChunk} disabled={busyAction === "chunk"}>
              {busyAction === "chunk" ? "Chunking..." : "Preview chunks"}
            </button>
          </div>
        </aside>

        <section className="panel work-panel">
          <div className="panel-heading">
            <div>
              <h2>Chunks and Search</h2>
              <p>
                {visibleChunks.length} visible chunks. {state.metrics.embeddedChunks} currently
                embedded.
              </p>
            </div>
            <button type="button" onClick={handleEmbed} disabled={busyAction === "embed"}>
              {busyAction === "embed" ? "Embedding..." : "Generate embeddings"}
            </button>
          </div>

          <div className="embedding-status">
            <div>
              <strong>{embeddingProgress}% embedded</strong>
              <span>{provider}</span>
            </div>
            <div className="progress">
              <span style={{ width: `${embeddingProgress}%` }} />
            </div>
          </div>

          <form onSubmit={handleSearch} className="search-panel">
            <label>
              Semantic query
              <input value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <div className="search-controls">
              <label>
                Top-k
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={topK}
                  onChange={(event) => setTopK(Number(event.target.value))}
                />
              </label>
              <label>
                Threshold
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value))}
                />
              </label>
              <label>
                Document filter
                <select value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
                  <option value="">All documents</option>
                  {state.documents.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={busyAction === "search"}>
                {busyAction === "search" ? "Searching..." : "Run search"}
              </button>
            </div>
          </form>

          <div className="results-grid">
            <div>
              <h2>Ranked results</h2>
              <div className="result-list">
                {latestRun?.results.length ? (
                  latestRun.results.map((result) => (
                    <article key={`${latestRun.id}-${result.chunk.id}`} className="result-card">
                      <div className="result-meta">
                        <strong>#{result.rank}</strong>
                        <span className={`score ${scoreLabel(result.similarity)}`}>
                          {formatScore(result.similarity)} similarity
                        </span>
                      </div>
                      <h3>{result.chunk.documentTitle}</h3>
                      <p>{result.chunk.text}</p>
                      <div className="badges">
                        <span>Chunk {result.chunk.chunkIndex}</span>
                        <span>{result.chunk.wordCount} words</span>
                        <span>{result.chunk.sourceLabel}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty">Run a search to inspect ranked matches.</div>
                )}
              </div>
            </div>

            <div>
              <h2>Chunk preview</h2>
              <div className="chunk-list">
                {visibleChunks.slice(0, 10).map((chunk) => (
                  <article key={chunk.id} className="chunk-card">
                    <div className="chunk-top">
                      <strong>Chunk {chunk.chunkIndex}</strong>
                      <span>{chunk.embedding ? "embedded" : "not embedded"}</span>
                    </div>
                    <p>{chunk.text}</p>
                    <div className="badges">
                      <span>{chunk.charCount} chars</span>
                      <span>{chunk.wordCount} words</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="panel insight-panel">
          <div className="panel-heading compact">
            <div>
              <h2>Engineering Dashboard</h2>
              <p>Live retrieval metrics and recent run history.</p>
            </div>
          </div>

          <div className="metrics-grid">
            <Stat label="Documents" value={state.metrics.totalDocuments} />
            <Stat label="Chunks" value={state.metrics.totalChunks} />
            <Stat label="Dimensions" value={state.metrics.embeddingDimensions || "-"} />
            <Stat label="Avg chunk" value={`${state.metrics.averageChunkSize} chars`} />
            <Stat label="Searches" value={state.metrics.searchesRun} />
            <Stat label="Last latency" value={`${state.metrics.lastSearchLatency} ms`} />
            <Stat label="Best score" value={formatScore(state.metrics.highestSimilarity)} />
            <Stat label="Embedded" value={`${embeddingProgress}%`} />
          </div>

          <div className="section-block">
            <h2>Comparison mode</h2>
            <table>
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Top</th>
                  <th>Avg@5</th>
                  <th>Chunks</th>
                </tr>
              </thead>
              <tbody>
                {comparison.length ? (
                  comparison.map((row) => (
                    <tr key={row.strategy}>
                      <td title={row.bestMatchingChunk}>{row.strategy}</td>
                      <td>{formatScore(row.topResultScore)}</td>
                      <td>{formatScore(row.averageTop5Score)}</td>
                      <td>{row.chunkCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>Run a search to compare strategies.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="section-block">
            <h2>Search history</h2>
            <div className="history-list">
              {state.searchRuns.length ? (
                state.searchRuns.map((run) => (
                  <button
                    type="button"
                    key={run.id}
                    className={latestRun?.id === run.id ? "history-row active" : "history-row"}
                    onClick={() => setSelectedRun(run)}
                  >
                    <strong>{run.query}</strong>
                    <span>
                      {formatTime(run.timestamp)} - {run.results.length} hits - {run.latencyMs} ms
                    </span>
                  </button>
                ))
              ) : (
                <div className="empty">No search runs yet.</div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
