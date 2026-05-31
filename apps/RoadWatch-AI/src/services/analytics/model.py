"""Model training and persistence utilities for analytics.

Provides simple train/load helpers for an IsolationForest model used by the
analytics engine. Uses `joblib` for persistence when `scikit-learn` is
available; otherwise functions are no-ops and report their status.
"""
from pathlib import Path
from typing import List
import os

MODEL_PATH = Path("models/if_model.pkl")

try:
    from sklearn.ensemble import IsolationForest  # type: ignore
    import joblib
    SKLEARN = True
except Exception:
    SKLEARN = False


def train_isolation_forest(X: List[List[float]], save_path: str | None = None) -> bool:
    if not SKLEARN:
        print("scikit-learn not available; skipping training")
        return False
    clf = IsolationForest(contamination=0.05, random_state=42)
    clf.fit(X)
    out = save_path or str(MODEL_PATH)
    Path(os.path.dirname(out) or ".").mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, out)
    print("Saved IsolationForest model to", out)
    return True


def load_model(path: str | None = None):
    if not SKLEARN:
        return None
    p = Path(path or MODEL_PATH)
    if not p.exists():
        return None
    try:
        import joblib

        return joblib.load(p)
    except Exception:
        return None
