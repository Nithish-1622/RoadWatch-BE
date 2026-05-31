"""Smoke test for the analytics service.

Run locally with `PYTHONPATH=src` to validate the lightweight analytics utilities.
"""
from services.analytics.ingest import generate_time_series
from services.analytics.pipeline import rolling_window
from services.analytics.anomaly import detect_anomalies_zscore


def main() -> None:
    data = generate_time_series(n=100, seed=42)
    smoothed = rolling_window(data, window=5)
    anomalies = detect_anomalies_zscore(smoothed, threshold=3.0)

    print("Generated series length:", len(data))
    print("First 8 values:", [round(x, 3) for x in data[:8]])
    print("Smoothed sample:", [round(x, 3) for x in smoothed[:8]])
    print("Detected anomalies:")
    for a in anomalies:
        print(a)


if __name__ == "__main__":
    main()
