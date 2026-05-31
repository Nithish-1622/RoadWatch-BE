"""RoadWatch CV dataset acquisition helper.

This script does not download copyrighted datasets automatically. It creates the
expected folder layout and prints the exact placement requirements for extracted
RDD2022, FloodNet, and Mapillary data.
"""

from __future__ import annotations

import argparse
from pathlib import Path


EXPECTED_LAYOUT = {
    "RDD2022": [
        "images/train, images/val, images/test",
        "labels/train, labels/val, labels/test or a COCO annotations JSON under annotations/",
    ],
    "FloodNet": [
        "images/train, images/val, images/test",
        "masks/train, masks/val, masks/test or annotation masks under annotations/",
    ],
    "Mapillary": [
        "images/",
        "annotations/ with a COCO-style instances JSON or equivalent export",
    ],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare RoadWatch CV dataset acquisition folders")
    parser.add_argument("--roadwatch-root", default="datasets/roadwatch", help="RoadWatch output root")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(args.roadwatch_root)
    for split in ("train", "val", "test"):
        (root / "images" / split).mkdir(parents=True, exist_ok=True)
        (root / "labels" / split).mkdir(parents=True, exist_ok=True)

    print(f"RoadWatch output root prepared at: {root.resolve()}")
    print("Expected source dataset placements:")
    for dataset_name, paths in EXPECTED_LAYOUT.items():
        print(f"- {dataset_name}")
        for path in paths:
            print(f"  - {path}")


if __name__ == "__main__":
    main()