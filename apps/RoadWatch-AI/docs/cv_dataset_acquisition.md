# RoadWatch CV Dataset Acquisition

This phase consolidates three public road-scene datasets into the RoadWatch taxonomy.

## Source datasets

### RDD2022
- Use the extracted dataset root containing images and annotations.
- Expected layout:
  - `images/train`, `images/val`, `images/test`
  - `labels/train`, `labels/val`, `labels/test` or `annotations/*.json`

### FloodNet
- Use the extracted dataset root containing flood-scene imagery and masks.
- Expected layout:
  - `images/train`, `images/val`, `images/test`
  - `masks/train`, `masks/val`, `masks/test` or `annotations/`

### Mapillary Traffic Sign Dataset
- Use the extracted dataset root containing traffic-sign images and a COCO-style export.
- Expected layout:
  - `images/`
  - `annotations/` with a COCO-style instances JSON or equivalent export

## Consolidated output

Generated under `datasets/roadwatch/`:
- `class_mapping.yaml`
- `dataset.yaml`
- `quality_report.json`
- `dataset_report.json`
- `source_manifest.jsonl`
- `images/train`, `images/val`, `images/test`
- `labels/train`, `labels/val`, `labels/test`

## RoadWatch target classes
- `pothole`
- `crack`
- `surface_wear`
- `waterlogging`
- `missing_road_marking`
- `broken_signboard`
