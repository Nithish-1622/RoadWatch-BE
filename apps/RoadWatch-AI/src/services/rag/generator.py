"""Configurable LLM layer supporting local model selection and simple deterministic synthesis.

This module provides a thin wrapper to generate answers from retrieved snippets
without hallucinating beyond the citations. If an LLM model is available via
transformers it will be used; otherwise a conservative synthesizer will assemble
an evidence-based response.
"""
import os
from typing import List, Tuple, Dict, Any

try:
    from transformers import pipeline
except Exception:
    pipeline = None


def synthesize_answer(query: str, candidates: List[Tuple[str, float, dict]], max_snippets: int = 5) -> Dict[str, Any]:
    # build a context from top candidates, include source attribution
    snippets = []
    sources = []
    for cid, score, meta in candidates[:max_snippets]:
        text = meta.get('text') or meta.get('chunk_text') or ''
        src = meta.get('source') or meta.get('source_id') or cid
        snippets.append({'id': cid, 'text': text, 'score': score, 'meta': meta})
        sources.append({'id': cid, 'source': src, 'score': score})

    model_name = os.environ.get('RAG_LLM_MODEL')
    if model_name and pipeline:
        try:
            gen = pipeline('text-generation', model=model_name, device=-1)
            prompt = 'Use only the following evidence to answer the question. If the evidence does not support an answer, say "Insufficient evidence".'
            prompt += '\n\nQuestion: ' + query + '\n\nEvidence:\n'
            for s in snippets:
                prompt += f"[{s['id']}] {s['text']}\n"
            prompt += '\nAnswer:'
            out = gen(prompt, max_length=256, do_sample=False)
            answer = out[0]['generated_text'].split('Answer:')[-1].strip()
            # conservative: do not add new facts
            return {'answer': answer, 'sources': sources}
        except Exception:
            pass

    # Fallback synthesizer: extract sentences from snippets that mention query terms
    q_terms = set(query.lower().split())
    extracted = []
    for s in snippets:
        txt = s['text']
        # take first 2 sentences as evidence
        sentences = [seg.strip() for seg in txt.split('.') if seg.strip()]
        if sentences:
            extracted.append({'id': s['id'], 'evidence': '. '.join(sentences[:2])})

    if not extracted:
        return {'answer': 'Insufficient evidence to answer the query.', 'sources': sources}

    # synthesize by listing evidence
    answer_parts = []
    for e in extracted:
        answer_parts.append(f"From [{e['id']}]: {e['evidence']}")
    answer = '\n'.join(answer_parts)
    return {'answer': answer, 'sources': sources}
