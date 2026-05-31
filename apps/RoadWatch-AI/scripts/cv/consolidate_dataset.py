"""RoadWatch CV dataset consolidation CLI.

Usage examples:
  python scripts/cv/consolidate_dataset.py
  python scripts/cv/consolidate_dataset.py --rdd2022 D:/data/RDD2022 --floodnet D:/data/FloodNet --mapillary D:/data/Mapillary --out datasets/roadwatch
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from services.cv.consolidation import (
    collect_source_records,
    create_empty_dataset_skeleton,
    build_class_mapping_yaml,
    normalize_to_roadwatch,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Consolidate RDD2022, FloodNet, and Mapillary into RoadWatch YOLO data")
    parser.add_argument("--rdd2022", default="", help="Root folder containing extracted RDD2022 data")
    parser.add_argument("--floodnet", default="", help="Root folder containing extracted FloodNet data")
    parser.add_argument("--mapillary", default="", help="Root folder containing extracted Mapillary data")
    parser.add_argument("--out", default="datasets/roadwatch", help="Output RoadWatch dataset root")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    out_root = Path(args.out)
    build_class_mapping_yaml(str(out_root / "class_mapping.yaml"))

    records = collect_source_records(
        rdd_root=args.rdd2022 or None,
        floodnet_root=args.floodnet or None,
        mapillary_root=args.mapillary or None,
    )

    if not records:
        result = create_empty_dataset_skeleton(str(out_root))
    else:
        result = normalize_to_roadwatch(records, str(out_root))

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()