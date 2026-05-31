from typing import List, Dict
import statistics

def detect_anomalies_zscore(data: List[float], threshold: float = 3.0) -> List[Dict]:
    """Detect anomalies using a simple z-score threshold.

    Returns list of dicts: {index, value, zscore} for points exceeding threshold.
    """
    if not data:
        return []

    mean = statistics.mean(data)
    # population stdev to be robust on small samples
    stdev = statistics.pstdev(data)
    if stdev == 0:
        return []

    out: List[Dict] = []
    for i, v in enumerate(data):
        z = (v - mean) / stdev
        if abs(z) > threshold:
            out.append({"index": i, "value": v, "zscore": z})
    return out
