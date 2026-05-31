from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from .infer import YOLODetector, ULTRALYTICS_AVAILABLE, MockDetector
from .utils import compute_phash, is_duplicate, fake_image_checks, severity_from_bbox, aggregate_confidence, calibrate_confidence, compute_road_risk_score
from .utils import compute_phash, is_duplicate, fake_image_checks, severity_from_bbox, aggregate_confidence
from typing import List
import io
from PIL import Image
from fastapi import BackgroundTasks
from .train_runner import train_yolo
import tempfile
import yaml
import os
from . import duplicate_store

router = APIRouter(prefix="/cv", tags=["cv"])

# instantiate lazily to avoid heavy imports at module import time
_detector = None

def get_detector():
    global _detector
    if _detector is None:
        # allow mock detector via env var for smoke tests
        use_mock = os.getenv('RW_USE_MOCK', 'false').lower() in ('1', 'true', 'yes')
        if use_mock:
            _detector = MockDetector()
        else:
            if not ULTRALYTICS_AVAILABLE:
                raise RuntimeError("ultralytics not available; install requirements or set RW_USE_MOCK=true")
            _detector = YOLODetector()
    return _detector


@router.post("/infer")
async def infer(file: UploadFile = File(...), conf: float = Query(0.25, gt=0.0, lt=1.0)):
    data = await file.read()
    try:
        detector = get_detector()
        dets = detector.infer_bytes(data, conf=conf)
        # compute phash and fake checks
        ph = compute_phash(data)
        fake_prob, reasons = fake_image_checks(data)
        # annotate detections with severity/confidence
        img = Image.open(io.BytesIO(data)).convert('RGB')
        img_size = img.size  # (w,h)
        enriched = []
        for d in dets:
            bbox = d.get('bbox', [0, 0, 0, 0])
            severity = severity_from_bbox(bbox, (img_size[0], img_size[1]))
            # no duplicate info available for single image - set 0.0
            dup_prob = 0.0
            conf_raw = aggregate_confidence(d.get('score', 0.0), fake_prob, dup_prob)
            conf = calibrate_confidence(conf_raw, fake_prob, dup_prob)
            enriched.append({**d, 'severity': severity, 'confidence': conf, 'duplicate_probability': dup_prob})
        image_confidence = max((e.get('confidence', 0.0) for e in enriched), default=0.0)
        road_risk = compute_road_risk_score(enriched)
        return {"detections": enriched, "fake_probability": fake_prob, "fake_reasons": reasons, "confidence": image_confidence, "road_risk_score": road_risk}
    except RuntimeError as re:
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"inference failed: {e}")


@router.post('/batch_infer')
async def batch_infer(files: List[UploadFile] = File(...), conf: float = Query(0.25, gt=0.0, lt=1.0), store_phash: bool = Query(False)):
    results = []
    detector = None
    try:
        detector = get_detector()
    except RuntimeError as re:
        raise HTTPException(status_code=500, detail=str(re))
    # compute phashes to detect duplicates in batch
    phashes = []
    images = []
    for f in files:
        data = await f.read()
        images.append((f.filename, data))
        phashes.append(compute_phash(data))

    for i, (fname, data) in enumerate(images):
        # optionally store phash persistently
        if store_phash:
            try:
                duplicate_store.init_db()
                duplicate_store.add_phash(phashes[i], image_id=fname)
            except Exception:
                pass
            dets = detector.infer_bytes(data, conf=conf)
            fake_prob, reasons = fake_image_checks(data)
            img = Image.open(io.BytesIO(data)).convert('RGB')
            img_size = img.size
            enriched = []
            for d in dets:
                bbox = d.get('bbox', [0, 0, 0, 0])
                severity = severity_from_bbox(bbox, (img_size[0], img_size[1]))
                # find duplicate probability vs other images
                dup_probs = []
                for j, ph in enumerate(phashes):
                    if i == j:
                        continue
                    is_dup, p = is_duplicate(phashes[i], ph)
                    dup_probs.append(p)
                dup_prob = max(dup_probs) if dup_probs else 0.0
                conf_raw = aggregate_confidence(d.get('score', 0.0), fake_prob, dup_prob)
                conf = calibrate_confidence(conf_raw, fake_prob, dup_prob)
                enriched.append({**d, 'severity': severity, 'confidence': conf, 'duplicate_probability': dup_prob})
            image_confidence = max((e.get('confidence', 0.0) for e in enriched), default=0.0)
            road_risk = compute_road_risk_score(enriched)
            results.append({"file": fname, "detections": enriched, "fake_probability": fake_prob, "fake_reasons": reasons, "confidence": image_confidence, "road_risk_score": road_risk})
    return {"results": results}


@router.post('/train')
async def train(dataset_yaml: UploadFile = File(...), epochs: int = Query(5, ge=1), background: BackgroundTasks = None):
    # Accept a dataset yaml file (ultralytics format) and kick off training in background
    data = await dataset_yaml.read()
    # write temp yaml
    tmpdir = tempfile.mkdtemp(prefix='rw_cv_')
    yaml_path = os.path.join(tmpdir, 'dataset.yaml')
    with open(yaml_path, 'wb') as f:
        f.write(data)
    def _train():
        try:
            manifest = train_yolo(yaml_path, epochs=epochs, project='models/cv')
            # manifest written to models/cv/<name>/model_manifest.json
        except Exception as e:
            # log to file
            with open(os.path.join(tmpdir, 'train_error.txt'), 'w', encoding='utf-8') as ef:
                ef.write(str(e))

    if background is not None:
        background.add_task(_train)
        return {"status": "training_started", "tmpdir": tmpdir}
    else:
        _train()
        return {"status": "training_completed", "tmpdir": tmpdir}
