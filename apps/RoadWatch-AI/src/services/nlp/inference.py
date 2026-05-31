import io
import math
import os
import tempfile
from functools import lru_cache
from typing import Any, Dict, List, Tuple

import torch

from .models import (
    get_distilbert_encoder,
    get_indicbert_encoder,
    get_sentence_transformer,
    get_translation_pipeline,
    get_language_detector,
    get_ner_pipeline,
    get_whisper_pipeline,
)


INTENT_PROTOTYPES: Dict[str, str] = {
    "report_pothole": "report a pothole, road hole, broken surface or sinkhole on a road",
    "report_crack": "report a crack, fissure or damaged road surface",
    "report_waterlogging": "report standing water, flooding, waterlogging or puddles on the road",
    "road_information_request": "ask for road information, directions, route guidance or nearby roads",
    "contractor_complaint": "complain about a contractor, road work contractor or construction issue",
    "budget_information_request": "ask for project budget, cost, estimate or funding information",
    "status_tracking": "ask for status, progress update, completion or task tracking",
    "authority_lookup": "ask which authority, department or officer is responsible",
    "general_query": "general civic or road-related inquiry",
}


def _mean_pool(last_hidden_state: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
    mask = attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).float()
    summed = torch.sum(last_hidden_state * mask, dim=1)
    denom = torch.clamp(mask.sum(dim=1), min=1e-9)
    return summed / denom


def _cosine(a: torch.Tensor, b: torch.Tensor) -> float:
    return float(torch.nn.functional.cosine_similarity(a, b, dim=0).item())


def _encode_with_transformer(text: str, encoder: Dict[str, Any]) -> torch.Tensor:
    tokenizer = encoder["tokenizer"]
    model = encoder["model"]
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
    return _mean_pool(outputs.last_hidden_state, inputs["attention_mask"])[0]


@lru_cache(maxsize=1)
def _prototype_vectors(model_key: str) -> Dict[str, torch.Tensor]:
    if model_key == "distil":
        encoder = get_distilbert_encoder()
        vectors = {label: _encode_with_transformer(text, encoder) for label, text in INTENT_PROTOTYPES.items()}
        return vectors
    if model_key == "indic":
        encoder = get_indicbert_encoder()
        vectors = {label: _encode_with_transformer(text, encoder) for label, text in INTENT_PROTOTYPES.items()}
        return vectors
    sentence_model = get_sentence_transformer()
    vectors = sentence_model.encode(list(INTENT_PROTOTYPES.values()), normalize_embeddings=True)
    if hasattr(vectors, "tolist"):
        vectors = vectors.tolist()
    if vectors and isinstance(vectors[0], (float, int)):
        vectors = [vectors for _ in INTENT_PROTOTYPES]
    return {label: torch.tensor(vec) for label, vec in zip(INTENT_PROTOTYPES.keys(), vectors)}


def _choose_model_key(language: str, text: str) -> str:
    if language and language != "en":
        return "indic"
    try:
        detector = get_language_detector()
        detected = detector(text)
        if detected and detected != "en":
            return "indic"
    except Exception:
        pass
    return "distil"


def _safe_vectors(model_key: str) -> Dict[str, torch.Tensor]:
    try:
        return _prototype_vectors(model_key)
    except Exception:
        if model_key == "indic":
            return _prototype_vectors("distil")
        raise


def _softmax_scores(scores: List[float]) -> List[float]:
    if not scores:
        return []
    m = max(scores)
    exps = [math.exp(s - m) for s in scores]
    total = sum(exps) or 1.0
    return [e / total for e in exps]


def calibrate_confidence(raw_score: float, second_score: float, language: str) -> float:
    margin = max(0.0, raw_score - second_score)
    language_boost = 0.05 if language == "en" else 0.08
    calibrated = 1.0 / (1.0 + math.exp(-(4.0 * raw_score + 2.0 * margin - 1.2)))
    return max(0.0, min(0.99, calibrated + language_boost))


def classify_intent(text: str, language: str = "en") -> Dict[str, Any]:
    model_key = _choose_model_key(language, text)
    distil_vectors = _safe_vectors("distil")
    indic_vectors = _safe_vectors("indic")
    sentence_vectors = _safe_vectors("sentence")

    if model_key == "indic":
        query_vec = _encode_with_transformer(text, get_indicbert_encoder())
        model_vectors = indic_vectors
        other_vectors = distil_vectors
    else:
        query_vec = _encode_with_transformer(text, get_distilbert_encoder())
        model_vectors = distil_vectors
        other_vectors = indic_vectors

    sentence_model = get_sentence_transformer()
    sentence_query = torch.tensor(sentence_model.encode(text, normalize_embeddings=True))

    scores: List[Tuple[str, float, float, float]] = []
    for label in INTENT_PROTOTYPES:
        model_score = _cosine(query_vec, model_vectors[label])
        alt_score = _cosine(query_vec, other_vectors[label])
        sent_score = _cosine(sentence_query, sentence_vectors[label])
        fused = (0.45 * model_score) + (0.2 * alt_score) + (0.35 * sent_score)
        scores.append((label, model_score, sent_score, fused))

    ranked = sorted(scores, key=lambda item: item[3], reverse=True)
    best = ranked[0]
    second = ranked[1] if len(ranked) > 1 else ranked[0]
    confidence = calibrate_confidence(best[3], second[3], language)

    return {
        "intent": best[0],
        "confidence": confidence,
        "model": model_key,
        "alternatives": [{"label": label, "score": round(score, 4)} for label, _, _, score in ranked[:3]],
    }


def detect_entities(text: str) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    try:
        ner = get_ner_pipeline()
        ents = ner(text)
        normalized = []
        for ent in ents:
            if not isinstance(ent, dict):
                continue
            normalized.append({"label": ent.get("entity_group") or ent.get("entity"), "text": ent.get("word"), "score": float(ent.get("score", 0.0) or 0.0)})
        if normalized:
            out["ner"] = normalized
    except Exception:
        pass

    # coordinate and domain-specific post-processing
    import re

    coord = re.search(r"(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)", text)
    if coord:
        out["location"] = {"lat": float(coord.group(1)), "lon": float(coord.group(2))}

    road = re.search(r"(?:on|near|at)\s+([A-Za-z0-9\s\.\-]+(?:road|rd|street|st|avenue|ave|highway)?)", text, re.IGNORECASE)
    if road:
        out["road_name"] = road.group(1).strip()

    contractor = re.search(r"contractor[:\-\s]+([A-Za-z0-9 &]+)", text, re.IGNORECASE)
    if contractor:
        out["contractor"] = contractor.group(1).strip()

    project_id = re.search(r"([A-Za-z]{2,6}[-_]\d{1,6})", text)
    if project_id:
        out["project_id"] = project_id.group(1)

    return out


def predict_urgency(text: str, intent: str) -> str:
    urgency_model = {
        "report_waterlogging": "high",
        "report_pothole": "high",
        "report_crack": "medium",
        "authority_lookup": "low",
        "road_information_request": "low",
        "status_tracking": "low",
        "contractor_complaint": "medium",
        "budget_information_request": "low",
    }
    if any(token in text.lower() for token in ["asap", "urgent", "emergency", "immediately", "now"]):
        return "critical"
    return urgency_model.get(intent, "low")


def translate_to_english(text: str, language: str) -> str:
    if language == "en":
        return text
    try:
        model_map = {
            "ta": "Helsinki-NLP/opus-mt-tam-en",
            "hi": "Helsinki-NLP/opus-mt-hi-en",
            "en": "Helsinki-NLP/opus-mt-en-ROMANCE",
        }
        model_name = model_map.get(language)
        if not model_name:
            return text
        translator = get_translation_pipeline(model_name)
        out = translator(text)
        if isinstance(out, list) and out:
            return out[0].get("translation_text", text)
    except Exception:
        pass
    return text


def transcribe_audio(file_bytes: bytes) -> str:
    try:
        whisper = get_whisper_pipeline()
    except Exception:
        return ""

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        result = whisper(tmp_path)
        if isinstance(result, dict):
            return result.get("text", "")
        return ""
    except Exception:
        return ""
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def infer_text(text: str) -> Dict[str, Any]:
    language = "en"
    try:
        detector = get_language_detector()
        language = detector(text)
    except Exception:
        pass

    translated_text = translate_to_english(text, language)
    intent_result = classify_intent(translated_text, language=language)
    entities = detect_entities(text)
    urgency = predict_urgency(text, intent_result["intent"])

    sentence_model = get_sentence_transformer()
    embedding = sentence_model.encode(translated_text, normalize_embeddings=True)
    if hasattr(embedding, "tolist"):
        embedding = embedding.tolist()

    return {
        "service": "nlp",
        "intent": intent_result["intent"],
        "confidence": intent_result["confidence"],
        "language": language,
        "translated_text": translated_text,
        "entities": entities,
        "urgency": urgency,
        "embeddings": embedding,
        "model": intent_result["model"],
        "alternatives": intent_result["alternatives"],
    }
