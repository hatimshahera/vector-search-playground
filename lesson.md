# Lesson

Vector search quality is not just about picking an embedding model. Retrieval behavior changes when chunk size, overlap, query wording, thresholds, document filters, and ranking rules change.

This tool makes those hidden mechanics visible. The user can inspect chunks before embedding them, generate vectors through a swappable provider interface, run cosine similarity search, and compare chunking strategies against the same query.

The important engineering lesson is that a RAG system should be tested as a retrieval system before it becomes a chatbot. If the retriever brings back weak chunks, the final answer will be weak no matter how capable the generation model is.
