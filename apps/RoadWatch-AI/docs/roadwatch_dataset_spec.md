RoadWatch Dataset Specification

Overview
- Purpose: collect street-level images with annotations for road defects relevant to RoadWatch.
- Target image types: dashcam, helmet-cam, smartphone, roadside CCTV. Prefer high-resolution RGB images (>=640x480).

Classes (required)
- pothole
- crack
- waterlogging
- surface wear
- missing road marking
- broken signboard

Directory layout (YOLO/Ultralytics compatible)
- dataset_root/
  - images/
    - train/
    - val/
    - test/ (optional)
  - labels/
    - train/
    - val/
    - test/
  - dataset.yaml

Annotation format
- Use COCO or YOLO txt formats. COCO is preferred for richer metadata.
- Each annotation must include: image_id, category_id, bbox [x,y,w,h], area, iscrowd=0.

Metadata
- capture_device, capture_time (ISO8601), gps_lat, gps_lon (optional), weather (clear/rain/snow/fog), road_type (urban/highway/secondary).

Splits and versioning
- Release a dataset manifest that includes version, creation date, and splits used.
- Recommended split: train 80%, val 10%, test 10%.

Quality requirements
- Bounding boxes should tightly fit defects.
- For cracks: annotate each contiguous crack segment as a bbox; long lines may be split into overlapping boxes.
- For missing road marking: annotate the road area where markings should exist (polygon or bbox acceptable).

Provenance/Privacy
- Blur faces and license plates unless consent/provide opt-out.
