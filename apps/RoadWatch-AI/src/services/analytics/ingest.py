from typing import List
import random

def generate_time_series(n: int = 100, seed: int = 0) -> List[float]:
    """Generate a synthetic time series with a couple of injected anomalies.

    Lightweight, dependency-free generator for smoke tests.
    """
    random.seed(seed)
    import math

    series: List[float] = []
    for i in range(n):
        base = math.sin(i / 10.0) + random.normalvariate(0, 0.1)
        series.append(base)

    # Inject clear anomalies at deterministic locations
    if n > 20:
        series[20] += 5.0
    if n > 70:
        series[70] -= 6.0

    return series
