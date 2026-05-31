"""Train an IsolationForest model for analytics and persist it.

This script synthesizes training data for smoke purposes and trains an
IsolationForest model if `scikit-learn` is installed.
"""
import random
from services.analytics.model import train_isolation_forest


def make_dataset(n_normal: int = 500, n_anom: int = 25):
    X = []
    for _ in range(n_normal):
        # normal: quality_score ~ N(4.0, 0.5), budget_spent ~ N(400,50), failure=0
        X.append([random.gauss(4.0, 0.5), max(0.0, random.gauss(400, 50)), 0.0])
    for _ in range(n_anom):
        # anomalies: low quality or very high spend or failure
        X.append([random.choice([random.gauss(1.0, 0.5), random.gauss(4.0, 0.5)]), random.gauss(2000, 300), 1.0])
    return X


def main():
    X = make_dataset()
    ok = train_isolation_forest(X)
    if not ok:
        print("Training skipped — scikit-learn not available.")


if __name__ == "__main__":
    main()
