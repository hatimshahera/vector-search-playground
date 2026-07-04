import { DocumentRecord } from "./types";

export const demoDocuments: DocumentRecord[] = [
  {
    id: "doc_gateway_notes",
    title: "AI API Gateway Notes",
    sourceLabel: "tool-03",
    createdAt: new Date("2026-07-01T09:00:00.000Z").toISOString(),
    rawText:
      "An AI API gateway gives product teams one controlled endpoint for model calls. It can route requests across providers, retry transient failures, and fall back to a cheaper or more reliable model when the preferred model is unavailable.\n\nRate limiting protects the upstream model provider and keeps one user from exhausting the budget. A gateway can cache repeated prompts, log latency and token usage, and attach request IDs so production incidents can be traced quickly.\n\nThe most useful gateway dashboards show provider health, cache hit rate, total cost, failure rate, and the exact model used for each request. This makes AI infrastructure observable instead of opaque.",
  },
  {
    id: "doc_eval_notes",
    title: "Model Evaluation Notes",
    sourceLabel: "eval-lab",
    createdAt: new Date("2026-07-01T09:05:00.000Z").toISOString(),
    rawText:
      "A model evaluation harness compares models with repeatable prompts and stable scoring rules. Latency, cost, correctness, refusal behavior, and formatting reliability should be measured separately.\n\nHuman preference can be useful, but structured test cases catch regressions faster. A small benchmark suite should include easy cases, adversarial cases, and realistic user prompts copied from the product domain.\n\nGood evaluations record the model version, temperature, prompt template, timestamp, and scoring rubric. Without that metadata, a benchmark result cannot be debugged or reproduced.",
  },
  {
    id: "doc_rag_notes",
    title: "RAG Retrieval Notes",
    sourceLabel: "rag-design",
    createdAt: new Date("2026-07-01T09:10:00.000Z").toISOString(),
    rawText:
      "Retrieval quality depends heavily on chunking. Chunks that are too small lose context, while chunks that are too large dilute the relevant facts and reduce precision. Overlap helps preserve meaning across boundaries but increases storage cost.\n\nEmbedding models map text into vectors where semantic neighbors are close together. Search systems compare query vectors with chunk vectors using cosine similarity or another distance metric, then return the top ranked matches.\n\nA retrieval system should expose similarity thresholds, top-k settings, document filters, and examples of missed results. Before building a chatbot, engineers should inspect which chunks are retrieved and why.",
  },
  {
    id: "doc_benchmark_notes",
    title: "Inference Benchmarking Notes",
    sourceLabel: "tool-02",
    createdAt: new Date("2026-07-01T09:15:00.000Z").toISOString(),
    rawText:
      "Inference benchmarks should separate time to first token, total latency, output tokens per second, and estimated cost. A model that feels fast in streaming mode may still be expensive or inconsistent under load.\n\nBenchmark dashboards are most useful when they preserve every run with its prompt, model, temperature, token count, and provider response time. Aggregates are helpful, but raw runs explain anomalies.\n\nProvider comparisons need guardrails. Different models have different strengths, context windows, pricing, and rate limits, so the benchmark should make those tradeoffs visible.",
  },
];
