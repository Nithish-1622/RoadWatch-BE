"""Core Analytics Engine (simplified, self-contained).

Provides feature engineering, trend analysis, lightweight anomaly
detection, predictive heuristics, and governance insight generation.

Designed to be dependency-light and safe for smoke/integration tests.
More advanced algorithms can replace these placeholders later.
"""
from __future__ import annotations

from typing import List, Dict, Any, Tuple
import math
import statistics
import time

try:
    from sklearn.ensemble import IsolationForest  # type: ignore
    SKLEARN_AVAILABLE = True
except Exception:
    SKLEARN_AVAILABLE = False
try:
    from services.analytics import model as af_model
except Exception:
    af_model = None


def _safe_mean(vals: List[float]) -> float:
    return statistics.mean(vals) if vals else 0.0


def feature_engineering(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute features from input records.

    Expected record keys (optional): 'road_id', 'contractor', 'complaint',
    'failure', 'budget_spent', 'budget_allocated', 'quality_score', 'lat', 'lon', 'timestamp'
    """
    features: Dict[str, Any] = {}

    # aggregate counts
    complaints_per_road: Dict[str, int] = {}
    failures_per_road: Dict[str, int] = {}
    contractor_stats: Dict[str, Dict[str, float]] = {}
    budget_usage: List[float] = []
    quality_scores: List[float] = []

    for r in records:
        road = r.get("road_id") or "_unknown_"
        if r.get("complaint"):
            complaints_per_road[road] = complaints_per_road.get(road, 0) + 1
        if r.get("failure"):
            failures_per_road[road] = failures_per_road.get(road, 0) + 1
        c = r.get("contractor")
        if c:
            st = contractor_stats.setdefault(c, {"failures": 0.0, "jobs": 0.0, "spent": 0.0, "allocated": 0.0})
            if r.get("failure"):
                st["failures"] += 1.0
            st["jobs"] += 1.0
            if r.get("budget_spent"):
                st["spent"] += float(r.get("budget_spent", 0.0))
            if r.get("budget_allocated"):
                st["allocated"] += float(r.get("budget_allocated", 0.0))
        if r.get("budget_spent") is not None and r.get("budget_allocated") is not None:
            alloc = float(r.get("budget_allocated", 0.0))
            if alloc > 0:
                budget_usage.append(float(r.get("budget_spent", 0.0)) / alloc)
        if r.get("quality_score") is not None:
            quality_scores.append(float(r.get("quality_score")))

    # contractor metrics
    contractor_perf = {}
    for c, st in contractor_stats.items():
        fail_rate = st["failures"] / st["jobs"] if st["jobs"] > 0 else 0.0
        spent = st["spent"]
        allocated = st["allocated"]
        utilization = spent / allocated if allocated > 0 else 0.0
        contractor_perf[c] = {"failure_rate": fail_rate, "utilization": utilization, "jobs": st["jobs"]}

    features.update(
        {
            "complaints_per_road": complaints_per_road,
            "failures_per_road": failures_per_road,
            "contractor_perf": contractor_perf,
            "budget_utilization": {"mean": _safe_mean(budget_usage), "count": len(budget_usage)},
            "road_quality": {"mean": _safe_mean(quality_scores), "count": len(quality_scores)},
        }
    )

    return features


def monthly_trend(records: List[Dict[str, Any]], key: str) -> Dict[str, int]:
    """Compute a simple monthly count trend for `key` in records using timestamp epoch seconds.

    Returns mapping 'YYYY-MM' -> count
    """
    counts: Dict[str, int] = {}
    for r in records:
        ts = r.get("timestamp")
        if not ts:
            continue
        try:
            tm = time.gmtime(float(ts))
            month = f"{tm.tm_year:04d}-{tm.tm_mon:02d}"
            if r.get(key):
                counts[month] = counts.get(month, 0) + 1
        except Exception:
            continue
    return counts


def trend_analysis(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "monthly_complaints": monthly_trend(records, "complaint"),
        "monthly_failures": monthly_trend(records, "failure"),
        "monthly_spending_events": monthly_trend(records, "budget_spent"),
    }


def _isolation_forest_anomalies(features: List[List[float]], contamination: float = 0.05) -> List[int]:
    # Prefer a persisted model if available
    try:
        if af_model:
            mdl = af_model.load_model()
            if mdl is not None:
                preds = mdl.predict(features)
                return [i for i, p in enumerate(preds) if p == -1]
    except Exception:
        pass

    if SKLEARN_AVAILABLE and features:
        try:
            iso = IsolationForest(contamination=contamination, random_state=42)
            preds = iso.fit_predict(features)
            # sklearn returns -1 for anomalies
            return [i for i, p in enumerate(preds) if p == -1]
        except Exception:
            pass
    # fallback: use z-score on the first dimension
    out = []
    if not features:
        return out
    vals = [f[0] for f in features]
    mean = statistics.mean(vals)
    st = statistics.pstdev(vals) or 1.0
    for i, v in enumerate(vals):
        if abs((v - mean) / st) > 3.0:
            out.append(i)
    return out


def spatial_anomaly_detection(points: List[Tuple[float, float]], radius_km: float = 1.0) -> List[int]:
    """Detect spatial outliers that have few neighbors within radius.

    Very simple approach: compute neighbor counts and flag points with small counts.
    """
    if not points:
        return []

    def haversine_km(a, b):
        lat1, lon1 = a
        lat2, lon2 = b
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        u = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        return 2 * R * math.asin(math.sqrt(u))

    counts = []
    for i, p in enumerate(points):
        c = 0
        for j, q in enumerate(points):
            if i == j:
                continue
            if haversine_km(p, q) <= radius_km:
                c += 1
        counts.append(c)
    # flag those with neighbor counts in bottom 5th percentile
    thresh = max(1, int(max(1, len(points) * 0.05)))
    return [i for i, c in enumerate(counts) if c <= thresh]


def spending_anomalies(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    vals = [float(r.get("budget_spent", 0.0)) for r in records if r.get("budget_spent") is not None]
    out = []
    if not vals:
        return out
    mean = statistics.mean(vals)
    st = statistics.pstdev(vals) or 1.0
    for r in records:
        if r.get("budget_spent") is None:
            continue
        v = float(r.get("budget_spent"))
        if abs((v - mean) / st) > 3.0:
            out.append({"record": r, "zscore": (v - mean) / st})
    return out


def complaint_spike_detection(records: List[Dict[str, Any]], window: int = 7) -> List[Dict[str, Any]]:
    """Detect spikes in complaint counts using rolling window over timestamps (days).

    For smoke purposes, we aggregate by day and compare latest day to rolling mean.
    """
    from collections import defaultdict

    buckets = defaultdict(int)
    for r in records:
        ts = r.get("timestamp")
        if not ts:
            continue
        day = time.strftime("%Y-%m-%d", time.gmtime(float(ts)))
        if r.get("complaint"):
            buckets[day] += 1

    days = sorted(buckets.keys())
    counts = [buckets[d] for d in days]
    out = []
    if len(counts) < window + 1:
        return out
    for i in range(window, len(counts)):
        window_mean = _safe_mean(counts[i - window : i])
        if window_mean == 0 and counts[i] > 0:
            out.append({"day": days[i], "count": counts[i], "reason": "jump from zero"})
        elif window_mean > 0 and counts[i] > window_mean * 3:
            out.append({"day": days[i], "count": counts[i], "reason": "3x spike"})
    return out


def predictive_models(features: Dict[str, Any]) -> Dict[str, Any]:
    """Produce simple heuristic predictions and recommendations.

    - road_failure_prediction: map of road_id -> prob
    - maintenance_recommendations: list of roads with high prob
    - contractor_risk: map contractor -> score
    """
    road_probs: Dict[str, float] = {}
    for road, fcount in features.get("failures_per_road", {}).items():
        # heuristic: base prob = sigmoid(failures / (1 + complaints))
        complaints = features.get("complaints_per_road", {}).get(road, 0)
        x = float(fcount) / (1 + complaints)
        prob = 1 / (1 + math.exp(-x + 1))  # shift
        road_probs[road] = prob

    maintenance = [r for r, p in road_probs.items() if p > 0.6]

    contractor_risk: Dict[str, float] = {}
    for c, st in features.get("contractor_perf", {}).items():
        # risk = failure_rate * (1 + utilization)
        fr = st.get("failure_rate", 0.0)
        util = st.get("utilization", 0.0)
        contractor_risk[c] = min(1.0, fr * (1.0 + util))

    return {"road_failure_prediction": road_probs, "maintenance_recommendations": maintenance, "contractor_risk": contractor_risk}


def governance_insights(features: Dict[str, Any], anomalies: Dict[str, Any], predictions: Dict[str, Any]) -> List[str]:
    insights: List[str] = []
    # high-risk zones
    top_roads = sorted(predictions.get("road_failure_prediction", {}).items(), key=lambda x: -x[1])[:5]
    for r, p in top_roads:
        insights.append(f"Road {r} has predicted failure probability {p:.2f}.")

    # repeat failures
    repeats = [r for r, cnt in features.get("failures_per_road", {}).items() if cnt > 1]
    if repeats:
        insights.append(f"Repeat failure roads: {', '.join(repeats)}")

    # budget mismatches
    bu = features.get("budget_utilization", {})
    if bu.get("mean", 0) > 1.2:
        insights.append("Average budget utilization exceeds 120% — investigate overspend.")

    # anomalies summary
    if any(anomalies.values()):
        insights.append("Detected anomalies across data sources — see anomaly summary.")

    if not insights:
        insights.append("No high-risk items detected in current window.")

    return insights


def process(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    feats = feature_engineering(records)
    trends = trend_analysis(records)

    # prepare simple numeric feature vector per record for IF
    vectors: List[List[float]] = []
    points: List[Tuple[float, float]] = []
    for r in records:
        v1 = float(r.get("quality_score", 0.0))
        v2 = float(r.get("budget_spent", 0.0))
        v3 = 1.0 if r.get("failure") else 0.0
        vectors.append([v1, v2, v3])
        if r.get("lat") is not None and r.get("lon") is not None:
            points.append((float(r.get("lat")), float(r.get("lon"))))

    iso_idx = _isolation_forest_anomalies(vectors)
    spatial_idx = spatial_anomaly_detection(points)
    spending = spending_anomalies(records)
    spikes = complaint_spike_detection(records)

    anomalies = {
        "isolation_indices": iso_idx,
        "spatial_indices": spatial_idx,
        "spending": spending,
        "complaint_spikes": spikes,
    }

    preds = predictive_models(feats)
    insights = governance_insights(feats, anomalies, preds)

    return {"features": feats, "trends": trends, "anomalies": anomalies, "predictions": preds, "insights": insights}
