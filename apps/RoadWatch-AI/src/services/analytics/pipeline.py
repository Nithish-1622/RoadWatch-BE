from typing import List

def rolling_window(data: List[float], window: int = 5) -> List[float]:
    """Simple rolling-average smoothing.

    Returns a list of the same length where each element is the average
    of the previous `window` values (including current).
    """
    out: List[float] = []
    for i in range(len(data)):
        start = max(0, i - window + 1)
        chunk = data[start : i + 1]
        out.append(sum(chunk) / len(chunk))
    return out
