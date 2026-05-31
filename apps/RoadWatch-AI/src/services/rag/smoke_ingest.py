"""Smoke test for the RAG ingestion pipeline using the in-memory store."""
from services.rag.ingest import ingest_documents, InMemoryVectorStore
from services.rag.retriever import Retriever


def main():
    docs = [
        {"id": "doc1", "text": "Pothole reported on Main St near the 3rd traffic light. It's large and dangerous.", "meta": {"source": "user_report"}},
        {"id": "doc2", "text": "Graffiti observed on the north wall of 5th avenue underpass.", "meta": {"source": "camera"}},
        {"id": "doc3", "text": "Fallen tree blocking the bicycle lane on River Road after the bridge.", "meta": {"source": "sensor"}},
    ]

    store = ingest_documents(docs)
    retriever = Retriever(store)

    query = "large pothole on Main Street"
    results = retriever.retrieve(query, top_k=3)
    print("Query:", query)
    print("Results:")
    for _id, score, meta in results:
        print(f"  {_id} (score={score:.3f}) meta={meta}")


if __name__ == "__main__":
    main()
