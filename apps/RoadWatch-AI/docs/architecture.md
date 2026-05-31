# RoadWatch AI Platform Architecture

This document describes the AI-first, cloud-native, Kubernetes-native AI microservice platform for RoadWatch. It focuses on the AI Orchestrator and the AI services (CV, NLP, Geo, OCR, RAG, Analytics).

## Overview
- AI Gateway -> FastAPI Orchestrator -> Microservices (CV, NLP, Geo, OCR, RAG, Analytics) -> Response Aggregator
- Event-driven async orchestration; services communicate over HTTP/gRPC/async message bus.

## Service responsibilities (summary)
- CV: Road damage detection, severity scoring, duplicate detection
- NLP: Intent, entities, urgency, STT
- Geo: Reverse geocoding, authority identification
- OCR: Document extraction and metadata
- RAG: Retrieval from documents, embeddings, attribution
- Analytics: Aggregation and predictive insights

## Model & Serving Notes
- Real-time via FastAPI + GPU-backed model servers (TorchServe / Triton)
- Batch pipelines for training and offline inference
- Model registry + Canary and A/B deployments

Refer to in-repo `docs/` for detailed per-service plans.
