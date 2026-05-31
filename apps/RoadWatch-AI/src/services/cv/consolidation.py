"""RoadWatch CV dataset consolidation utilities.

This module consolidates RDD2022, FloodNet, and Mapillary-style source datasets
into a unified RoadWatch YOLO dataset with validation and reporting helpers.
"""

from __future__ import annotations
import xml.etree.ElementTree as ET
import csv
import hashlib
import json
import os
import shutil
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from PIL import Image, UnidentifiedImageError

from .utils import compute_phash, is_duplicate

ROADWATCH_CLASSES = [
    "pothole",
    "crack",
    "surface_wear",
    "waterlogging",
    "missing_road_marking",
    "broken_signboard",
]

CLASS_MAPPING: Dict[str, Dict[str, str]] = {
    "RDD2022": {
    "d00": "crack",
    "d01": "crack",

    "d10": "crack",
    "d11": "crack",

    "d20": "crack",

    "d40": "pothole",

    "d43": "surface_wear",
    "d44": "surface_wear"
},
    "FloodNet": {
        "water": "waterlogging",
        "flood": "waterlogging",
        "flooded": "waterlogging",
        "waterlogging": "waterlogging",
        "standing_water": "waterlogging",
    },
    "Mapillary": {
        "traffic sign": "broken_signboard",
        "traffic_sign": "broken_signboard",
        "sign": "broken_signboard",
        "signboard": "broken_signboard",
        "damaged sign": "broken_signboard",
        "broken signboard": "broken_signboard",
        "missing sign": "broken_signboard",
        "road marking": "missing_road_marking",
        "lane marking": "missing_road_marking",
        "marking": "missing_road_marking",
    },
}


@dataclass
class SourceRecord:
    image_path: str
    annotation_path: Optional[str]
    source_dataset: str
    original_class: str
    split: str = "train"
    source_metadata: Optional[Dict[str, Any]] = None


def _normalize_text(value: Any) -> str:
    return str(value or "").strip().lower().replace("-", "_").replace("/", "_")


def map_to_roadwatch(source_dataset: str, original_class: str) -> str:
    dataset_map = CLASS_MAPPING.get(source_dataset, {})

    key = _normalize_text(original_class)

    print("ORIGINAL:", original_class)
    print("NORMALIZED:", key)
    print("FOUND:", key in dataset_map)

    if key in dataset_map:
        return dataset_map[key]
    for alias, target in dataset_map.items():
        if alias in key or key in alias:
            return target
    return "surface_wear" if source_dataset == "RDD2022" else "broken_signboard" if source_dataset == "Mapillary" else "waterlogging"


def _guess_split(path: str, default: str = "train") -> str:
    lower = path.replace("\\", "/").lower()
    for split in ("train", "val", "valid", "validation", "test"):
        if f"/{split}/" in lower or lower.endswith(f"/{split}"):
            return "val" if split in ("valid", "validation") else split
    return default


def _candidate_images(root: Path) -> List[Path]:
    if not root.exists():
        return []
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    return [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in exts]


def _find_matching_file(stem: str, roots: Sequence[Path], suffixes: Sequence[str]) -> Optional[Path]:
    for root in roots:
        for suffix in suffixes:
            candidate = root / f"{stem}{suffix}"
            if candidate.exists():
                return candidate
        for candidate in root.rglob(f"{stem}.*"):
            if candidate.suffix.lower() in suffixes:
                return candidate
    return None


def _safe_image_size(image_path: str) -> Optional[Tuple[int, int]]:
    try:
        with Image.open(image_path) as im:
            return im.size
    except Exception:
        return None


def _parse_yolo_labels(label_path: Path, class_names: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    boxes: List[Dict[str, Any]] = []
    if not label_path.exists():
        return boxes
    try:
        with label_path.open("r", encoding="utf-8") as fh:
            for line in fh:
                parts = line.strip().split()
                if len(parts) < 5:
                    continue
                cls_idx = int(float(parts[0]))
                x, y, w, h = map(float, parts[1:5])
                if class_names and 0 <= cls_idx < len(class_names):
                    original_class = class_names[cls_idx]
                else:
                    original_class = str(cls_idx)
                boxes.append({
                    "original_class": original_class,
                    "bbox": [x, y, w, h],
                    "bbox_format": "yolo",
                })
    except Exception:
        return boxes
    return boxes


def _parse_coco(coco_path: Path, images_root: Path, source_dataset: str) -> List[SourceRecord]:
    with coco_path.open("r", encoding="utf-8") as fh:
        coco = json.load(fh)
    images = {img["id"]: img for img in coco.get("images", [])}
    categories = {cat["id"]: cat.get("name", "") for cat in coco.get("categories", [])}
    records: List[SourceRecord] = []
    for ann in coco.get("annotations", []):
        img = images.get(ann.get("image_id"))
        if not img:
            continue
        file_name = img.get("file_name")
        if not file_name:
            continue
        image_path = images_root / file_name
        original_class = categories.get(ann.get("category_id"), "")
        records.append(SourceRecord(
            image_path=str(image_path),
            annotation_path=str(coco_path),
            source_dataset=source_dataset,
            original_class=original_class,
            split=_guess_split(str(image_path)),
            source_metadata={
                "bbox": ann.get("bbox"),
                "category_id": ann.get("category_id"),
                "image_id": ann.get("image_id"),
                "image_size": [img.get("width"), img.get("height")],
                "annotation_id": ann.get("id"),
                "score": ann.get("score"),
            },
        ))
    return records


def _parse_mapillary(root: Path) -> List[SourceRecord]:
    records: List[SourceRecord] = []
    for coco_path in root.rglob("*.json"):
        if "annotation" in coco_path.name.lower() or "instances" in coco_path.name.lower() or "coco" in coco_path.name.lower():
            images_root = coco_path.parent
            for candidate in (coco_path.parent / "images", coco_path.parent, root / "images"):
                if candidate.exists():
                    images_root = candidate
                    break
            try:
                records.extend(_parse_coco(coco_path, images_root, "Mapillary"))
            except Exception:
                continue
    return records

def _parse_pascal_xml(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    width = int(root.find("size/width").text)
    height = int(root.find("size/height").text)

    boxes = []

    for obj in root.findall("object"):
        cls = obj.find("name").text
        print("XML CLASS:", cls)
        bbox = obj.find("bndbox")

        xmin = float(bbox.find("xmin").text)
        ymin = float(bbox.find("ymin").text)
        xmax = float(bbox.find("xmax").text)
        ymax = float(bbox.find("ymax").text)

        x_center = ((xmin + xmax) / 2) / width
        y_center = ((ymin + ymax) / 2) / height
        box_width = (xmax - xmin) / width
        box_height = (ymax - ymin) / height

        boxes.append({
            "original_class": cls,
            "bbox": [
                x_center,
                y_center,
                box_width,
                box_height
            ]
        })

    return boxes

def _parse_rdd2022(root: Path) -> List[SourceRecord]:
    records: List[SourceRecord] = []
    image_roots = [root / "images", root / "train", root / "val", root / "test", root]
    label_roots = [root / "labels", root / "annotations", root / "train", root / "val", root / "test", root]
    for image_path in _candidate_images(root):
        stem = image_path.stem
        split = _guess_split(str(image_path))
        if split == "test":
            continue
        ann_path = _find_matching_file(stem, label_roots, [".txt", ".json", ".xml", ".csv"])
        if ann_path and ann_path.suffix.lower() == ".json":
            try:
                records.extend(_parse_coco(ann_path, image_path.parent, "RDD2022"))
                continue
            except Exception:
                pass
        if ann_path and ann_path.suffix.lower() == ".txt":
            class_names = ["pothole", "crack", "surface_wear"]
            for box in _parse_yolo_labels(ann_path, class_names):
                records.append(SourceRecord(
                    image_path=str(image_path),
                    annotation_path=str(ann_path),
                    source_dataset="RDD2022",
                    original_class=box["original_class"],
                    split=split,
                    source_metadata=box,
                ))
            continue

        if ann_path and ann_path.suffix.lower() == ".xml":
            for box in _parse_pascal_xml(ann_path):
                records.append(SourceRecord(
                    image_path=str(image_path),
                    annotation_path=str(ann_path),
                    source_dataset="RDD2022",
                    original_class=box["original_class"],
                    split=split,
                    source_metadata=box,
             ))
            continue

        original_class = image_path.parent.name if image_path.parent.name not in {"images", "train", "val", "test"} else "pothole"
        records.append(SourceRecord(
            image_path=str(image_path),
            annotation_path=str(ann_path) if ann_path else None,
            source_dataset="RDD2022",
            original_class=original_class,
            split=split,
            source_metadata={"note": "best-effort loader"},
        ))
    return records


def _mask_bbox(mask_path: Path) -> Optional[List[int]]:
    try:
        with Image.open(mask_path) as im:
            gray = im.convert("L")
            bbox = gray.point(lambda p: 255 if p > 0 else 0).getbbox()
            if not bbox:
                return None
            x1, y1, x2, y2 = bbox
            return [x1, y1, x2 - x1, y2 - y1]
    except Exception:
        return None


def _parse_floodnet(root: Path) -> List[SourceRecord]:
    records: List[SourceRecord] = []
    mask_roots = [root / "masks", root / "mask", root / "annotations", root]
    for image_path in _candidate_images(root):
        split = _guess_split(str(image_path))
        stem = image_path.stem
        mask_path = _find_matching_file(stem, mask_roots, [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".json", ".txt"])
        if mask_path and mask_path.suffix.lower() in {".png", ".jpg", ".jpeg", ".tif", ".tiff"}:
            bbox = _mask_bbox(mask_path)
            records.append(SourceRecord(
                image_path=str(image_path),
                annotation_path=str(mask_path),
                source_dataset="FloodNet",
                original_class="waterlogging",
                split=split,
                source_metadata={"bbox": bbox, "mask_path": str(mask_path), "mask_type": "segmentation"},
            ))
        else:
            records.append(SourceRecord(
                image_path=str(image_path),
                annotation_path=str(mask_path) if mask_path else None,
                source_dataset="FloodNet",
                original_class="waterlogging",
                split=split,
                source_metadata={"note": "best-effort loader"},
            ))
    return records


def load_rdd2022(root: str) -> List[Dict[str, Any]]:
    return [asdict(r) for r in _parse_rdd2022(Path(root))]


def load_floodnet(root: str) -> List[Dict[str, Any]]:
    return [asdict(r) for r in _parse_floodnet(Path(root))]


def load_mapillary(root: str) -> List[Dict[str, Any]]:
    return [asdict(r) for r in _parse_mapillary(Path(root))]


def collect_source_records(rdd_root: Optional[str] = None, floodnet_root: Optional[str] = None, mapillary_root: Optional[str] = None) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    if rdd_root:
        records.extend(load_rdd2022(rdd_root))
    if floodnet_root:
        records.extend(load_floodnet(floodnet_root))
    if mapillary_root:
        records.extend(load_mapillary(mapillary_root))
    return records


def _validate_bbox(bbox: Any) -> bool:
    if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
        return False
    try:
        x, y, w, h = [float(v) for v in bbox]
    except Exception:
        return False
    return w > 0 and h > 0 and x >= 0 and y >= 0


def _image_is_corrupt(image_path: str) -> bool:
    try:
        with Image.open(image_path) as im:
            im.verify()
        with Image.open(image_path) as im:
            im.load()
        return False
    except (FileNotFoundError, UnidentifiedImageError, OSError):
        return True


def _class_counts(records: List[Dict[str, Any]]) -> Counter:
    counts = Counter()
    for record in records:
        target = map_to_roadwatch(record.get("source_dataset", ""), record.get("original_class", ""))
        counts[target] += 1
    return counts


def _split_records(records: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    grouped = {"train": [], "val": [], "test": []}
    for record in records:
        split = record.get("split") or "train"
        split = "val" if split in {"valid", "validation"} else split
        if split not in grouped:
            split = "train"
        grouped[split].append(record)
    return grouped


def _unique_by_image(records: List[Dict[str, Any]]) -> Dict[Tuple[str, str], List[Dict[str, Any]]]:
    grouped: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
    for record in records:
        key = (record.get("image_path", ""), record.get("split", "train"))
        grouped[key].append(record)
    return grouped


def write_yaml_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def build_class_mapping_yaml(out_path: str) -> str:
    content = [
        "roadwatch_classes:",
    ]
    for cls_name in ROADWATCH_CLASSES:
        content.append(f"  - {cls_name}")
    content.append("class_mapping:")
    for dataset_name, mapping in CLASS_MAPPING.items():
        content.append(f"  {dataset_name}:")
        for source_class, target_class in mapping.items():
            content.append(f"    {source_class}: {target_class}")
    write_yaml_text(Path(out_path), "\n".join(content) + "\n")
    return out_path


def build_dataset_yaml(dataset_root: str) -> str:
    root = Path(dataset_root)
    content = [
        f"path: {root.as_posix()}",
        "train: images/train",
        "val: images/val",
        "test: images/test",
        f"nc: {len(ROADWATCH_CLASSES)}",
        "names:",
    ]
    for cls_name in ROADWATCH_CLASSES:
        content.append(f"  - {cls_name}")
    out_path = root / "dataset.yaml"
    write_yaml_text(out_path, "\n".join(content) + "\n")
    return str(out_path)


def _copy_image(src: str, dst: Path) -> bool:
    try:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        return True
    except Exception:
        return False


def _bbox_to_yolo(bbox, image_size):
    if len(bbox) != 4:
        return None

    x, y, w, h = [float(v) for v in bbox]

    if w <= 0 or h <= 0:
        return None

    if (
        0 <= x <= 1 and
        0 <= y <= 1 and
        0 <= w <= 1 and
        0 <= h <= 1
    ):
        return x, y, w, h

    if image_size[0] <= 0 or image_size[1] <= 0:
        return None

    x_center = (x + w / 2.0) / image_size[0]
    y_center = (y + h / 2.0) / image_size[1]
    nw = w / image_size[0]
    nh = h / image_size[1]

    return x_center, y_center, nw, nh


def validate_records(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    issues = {
        "missing_annotations": [],
        "corrupt_images": [],
        "duplicate_images": [],
        "invalid_bounding_boxes": [],
        "imbalanced_classes": [],
    }

    seen_hashes: Dict[str, str] = {}
    class_counts = _class_counts(records)

    for record in records:
        image_path = record.get("image_path")
        annotation_path = record.get("annotation_path")
        metadata = record.get("source_metadata") or {}

        if not annotation_path:
            issues["missing_annotations"].append(image_path)
        elif not Path(annotation_path).exists():
            issues["missing_annotations"].append(annotation_path)

        if not image_path or not Path(image_path).exists() or _image_is_corrupt(image_path):
            issues["corrupt_images"].append(image_path)
            continue

        try:
            with open(image_path, "rb") as fh:
                digest = hashlib.sha256(fh.read()).hexdigest()
            if digest in seen_hashes and seen_hashes[digest] != image_path:
                issues["duplicate_images"].append({"image_path": image_path, "duplicate_of": seen_hashes[digest]})
            else:
                seen_hashes[digest] = image_path
        except Exception:
            pass

        bbox = metadata.get("bbox")
        if bbox is not None and not _validate_bbox(bbox):
            issues["invalid_bounding_boxes"].append({"image_path": image_path, "bbox": bbox})

    if class_counts:
        max_count = max(class_counts.values())
        for cls_name in ROADWATCH_CLASSES:
            count = class_counts.get(cls_name, 0)
            if count == 0 or count < max(2, int(max_count * 0.05)):
                issues["imbalanced_classes"].append({"class": cls_name, "count": count})

    return issues


def build_dataset_report(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    split_groups = _split_records(records)
    class_distribution = dict(_class_counts(records))
    source_distribution = dict(Counter(record.get("source_dataset", "unknown") for record in records))
    return {
        "total_images": len({record.get("image_path") for record in records if record.get("image_path")}),
        "train_images": len({record.get("image_path") for record in split_groups["train"] if record.get("image_path")}),
        "val_images": len({record.get("image_path") for record in split_groups["val"] if record.get("image_path")}),
        "test_images": len({record.get("image_path") for record in split_groups["test"] if record.get("image_path")}),
        "class_distribution": class_distribution,
        "source_distribution": source_distribution,
    }


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def normalize_to_roadwatch(records: List[Dict[str, Any]], dataset_root: str) -> Dict[str, Any]:
    root = Path(dataset_root)
    images_root = root / "images"
    labels_root = root / "labels"
    for split in ("train", "val", "test"):
        (images_root / split).mkdir(parents=True, exist_ok=True)
        (labels_root / split).mkdir(parents=True, exist_ok=True)

    grouped = _unique_by_image(records)
    class_to_index = {name: idx for idx, name in enumerate(ROADWATCH_CLASSES)}
    copied_images = set()

    for (image_path, split), image_records in grouped.items():
        if not image_path or not Path(image_path).exists():
            continue
        if split == "test":
            target_split = "val"
        elif split == "train":
            target_split = "train"
        else:
            target_split = "train"
        target_image = images_root / target_split / Path(image_path).name
        if image_path not in copied_images:
            _copy_image(image_path, target_image)
            copied_images.add(image_path)

        size = _safe_image_size(image_path)
        if not size:
            continue
        label_lines: List[str] = []
        for record in image_records:
            metadata = record.get("source_metadata") or {}
            bbox = metadata.get("bbox")
            if not bbox:
                continue
            yolo_bbox = _bbox_to_yolo(bbox, size)
            if not yolo_bbox:
                continue
            target_class = map_to_roadwatch(record.get("source_dataset", ""), record.get("original_class", ""))
            cls_idx = class_to_index.get(target_class)
            if cls_idx is None:
                continue
            label_lines.append(f"{cls_idx} {yolo_bbox[0]:.6f} {yolo_bbox[1]:.6f} {yolo_bbox[2]:.6f} {yolo_bbox[3]:.6f}")

        label_path = labels_root / target_split / (Path(image_path).stem + ".txt")
        label_path.write_text("\n".join(label_lines), encoding="utf-8")

    dataset_yaml = build_dataset_yaml(dataset_root)
    quality_report = validate_records(records)
    dataset_report = build_dataset_report(records)
    training_ready = (
        dataset_report["total_images"] > 0
        and len(quality_report["missing_annotations"]) == 0
        and len(quality_report["corrupt_images"]) == 0
        and len(quality_report["invalid_bounding_boxes"]) == 0
        and len(quality_report["imbalanced_classes"]) == 0
    )
    quality_report["training_ready"] = training_ready

    _write_json(root / "quality_report.json", quality_report)
    _write_json(root / "dataset_report.json", dataset_report)

    manifest_path = root / "source_manifest.jsonl"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with manifest_path.open("w", encoding="utf-8") as fh:
        for record in records:
            fh.write(json.dumps(record) + "\n")

    return {
        "dataset_yaml": dataset_yaml,
        "quality_report": str(root / "quality_report.json"),
        "dataset_report": str(root / "dataset_report.json"),
        "training_ready": training_ready,
        "record_count": len(records),
    }


def create_empty_dataset_skeleton(dataset_root: str) -> Dict[str, Any]:
    root = Path(dataset_root)
    for split in ("train", "val", "test"):
        (root / "images" / split).mkdir(parents=True, exist_ok=True)
        (root / "labels" / split).mkdir(parents=True, exist_ok=True)
    build_class_mapping_yaml(str(root / "class_mapping.yaml"))
    dataset_yaml = build_dataset_yaml(dataset_root)
    quality_report = {
        "missing_annotations": [],
        "corrupt_images": [],
        "duplicate_images": [],
        "invalid_bounding_boxes": [],
        "imbalanced_classes": [{"class": cls, "count": 0} for cls in ROADWATCH_CLASSES],
        "training_ready": False,
    }
    dataset_report = {
        "total_images": 0,
        "train_images": 0,
        "val_images": 0,
        "test_images": 0,
        "class_distribution": {cls: 0 for cls in ROADWATCH_CLASSES},
        "source_distribution": {},
    }
    _write_json(root / "quality_report.json", quality_report)
    _write_json(root / "dataset_report.json", dataset_report)
    return {
        "dataset_yaml": dataset_yaml,
        "quality_report": str(root / "quality_report.json"),
        "dataset_report": str(root / "dataset_report.json"),
        "training_ready": False,
        "record_count": 0,
    }
