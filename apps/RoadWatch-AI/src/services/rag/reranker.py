"""Cross-encoder re-ranker using Sentence-Transformers CrossEncoder when available."""
from typing import List, Tuple, Dict, Any

try:
    from sentence_transformers import CrossEncoder
    _HAS_CROSS = True
except Exception:
    CrossEncoder = None
    _HAS_CROSS = False


class ReRanker:
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model = CrossEncoder(model_name) if _HAS_CROSS else None

    def rerank(self, query: str, candidates: List[Tuple[str, float, dict]]) -> List[Tuple[str, float, dict]]:
        """Candidates are list of (id, score, meta). Return re-ranked list with updated scores."""
        if not self.model:
            # fallback: return candidates as-is
            return candidates

        pairs = [(query, (c[2].get('text') or '')) for c in candidates]
        scores = self.model.predict(pairs)
        reranked = []
        for c, s in zip(candidates, scores):
            reranked.append((c[0], float(s), c[2]))
        reranked.sort(key=lambda x: -x[1])
        return reranked
