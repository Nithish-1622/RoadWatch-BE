# RAG Ingestion & Embedding Pipeline (scaffold)

This scaffold provides a developer-friendly starting point for ingesting documents,
chunking text, embedding with `sentence-transformers` (if available), and storing
vectors in an in-memory vector store for local smoke tests. It is intentionally
lightweight so teams can iterate before wiring a production vector DB (Postgres
with `pgvector`, Pinecone, Weaviate, etc.).

Files added:

- `src/services/rag/ingest.py` — chunking, embedding (ST fallback), and `InMemoryVectorStore`.
- `src/services/rag/retriever.py` — simple retriever using embedding similarity.
- `src/services/rag/smoke_ingest.py` — small script to ingest sample docs and query.

Quickstart (from repo root):

```powershell
cmd /C "set PYTHONPATH=src&& .\venv\Scripts\python.exe src/services/rag/smoke_ingest.py"
```

Next steps to productionize:

- Replace `InMemoryVectorStore` with `pgvector` upsert SQL or integrate with an external vector DB.
- Use a robust embedding service or GPU-backed model (E5/BGE) and batching.
- Add document preprocessing (PDF parsing, OCR, HTML cleaning) and metadata extraction.
- Add re-ranking (cross-encoder) and QA prompt templates for RAG responses.
- Implement ingestion monitoring, retries, and idempotency for incremental updates.
