# Tool 04: Vector Search Playground

A visual engineering playground for understanding embeddings, chunking, and vector retrieval quality underneath RAG systems.

Tech stack: Next.js, React, TypeScript, server-side API routes, local JSON/in-memory vector store, optional OpenAI embeddings.

## Problem it solves

RAG prototypes often jump straight to a chatbot and hide the retrieval layer. This tool isolates the retrieval system so engineers can inspect chunks, scores, thresholds, filters, and search quality directly.

## What it does

Vector Search Playground lets you add text documents, split them into chunks, generate embeddings, and run semantic search over the resulting vectors. It shows ranked chunks, similarity scores, chunk metadata, search history, and comparison results across multiple chunking strategies.

## Features

- Add text documents with title, source label, raw text, and timestamp.
- Chunk by paragraph, sentence, or fixed character length with overlap.
- Preview chunk number, character count, word count, and text.
- Generate server-side embeddings with a swappable provider abstraction.
- Run top-k cosine similarity search with threshold and document filters.
- Compare chunking strategies against the same query.
- Inspect search history, latency, dimensions, and retrieval metrics.

## Why vector search matters

Most RAG failures start before the language model writes an answer. If the retrieval layer misses the right evidence, the answer layer has poor context. This tool focuses on retrieval mechanics directly instead of hiding them behind a chat interface.

## How chunking affects retrieval

Small chunks can improve precision but may lose context. Large chunks preserve context but can dilute the relevant signal. Overlap helps preserve meaning across boundaries while increasing chunk count and embedding cost. The comparison mode runs the same query against small, medium, large, and paragraph-based strategies.

## How embeddings are generated

The app uses a server-side embedding service abstraction:

```ts
embedText(text: string): Promise<number[]>
embedMany(texts: string[]): Promise<number[][]>
```

If `OPENAI_API_KEY` is set, it calls OpenAI embeddings with `text-embedding-3-small` by default. Without a key, it uses a deterministic local hash embedding provider so the demo works immediately.

## How similarity search works

The query is embedded, compared with chunk embeddings using cosine similarity, filtered by the minimum threshold, sorted highest to lowest, and trimmed to the selected top-k.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

```bash
OPENAI_API_KEY=
EMBEDDING_MODEL=text-embedding-3-small
```

The API key is only used by server-side route handlers and is never exposed to the browser.

## API routes

- `GET /api/vector/documents`
- `POST /api/vector/documents`
- `DELETE /api/vector/documents/:id`
- `POST /api/vector/chunk`
- `POST /api/vector/embed`
- `POST /api/vector/search`
- `GET /api/vector/search-runs`

## Future improvements

- Persist vectors in Postgres with pgvector.
- Add JSON and CSV export.
- Add manual relevance labels and precision@k.
- Add query-term highlighting.
- Add document upload.
- Add side-by-side charts for strategy comparison.

## Links

- Repository: https://github.com/hatimshahera/vector-search-playground
