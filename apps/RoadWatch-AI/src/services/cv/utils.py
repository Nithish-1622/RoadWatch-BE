import io
import os
from typing import Tuple

from PIL import Image, ImageStat
import imagehash
import numpy as np
import cv2


def compute_phash(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    return str(imagehash.phash(img))


def phash_similarity(hash1: str, hash2: str) -> int:
    # Hamming distance between hex strings
    h1 = imagehash.hex_to_hash(hash1)
    h2 = imagehash.hex_to_hash(hash2)
    return h1 - h2


def is_duplicate(hash1: str, hash2: str, threshold: int = 8) -> Tuple[bool, float]:
    """Return (is_duplicate, duplicate_probability) where smaller distance -> higher probability."""
    dist = phash_similarity(hash1, hash2)
    prob = max(0.0, 1.0 - dist / 64.0)
    return (dist <= threshold, prob)


def detect_blur(image_bytes: bytes, threshold: float = 100.0) -> Tuple[bool, float]:
    # variance of Laplacian
    arr = np.asarray(Image.open(io.BytesIO(image_bytes)).convert('L'))
    lap = cv2.Laplacian(arr, cv2.CV_64F)
    var = float(lap.var())
    return (var < threshold, var)


def fake_image_checks(image_bytes: bytes) -> Tuple[float, dict]:
    """Return fake probability (0-1) and reasons dict."""
    reasons = {}
    # check EXIF metadata
    img = Image.open(io.BytesIO(image_bytes))
    exif = img.info.get('exif')
    reasons['has_exif'] = bool(exif)
    # blur
    is_blur, blur_score = detect_blur(image_bytes)
    reasons['blur'] = blur_score
    # simple heuristic: no exif and high blurriness -> suspicious
    prob = 0.0
    if not reasons['has_exif']:
        prob += 0.3
    if is_blur:
        prob += 0.4
    # clamp
    prob = min(1.0, prob)
    return prob, reasons


def severity_from_bbox(bbox: Tuple[float, float, float, float], image_size: Tuple[int, int]) -> str:
    # bbox = [x1,y1,x2,y2]
    x1, y1, x2, y2 = bbox
    w = max(0.0, x2 - x1)
    h = max(0.0, y2 - y1)
    area = w * h
    img_area = image_size[0] * image_size[1]
    if img_area <= 0:
        return 'low'
    ratio = area / img_area
    if ratio < 0.001:
        return 'low'
    if ratio < 0.005:
        return 'medium'
    if ratio < 0.02:
        return 'high'
    return 'critical'


def aggregate_confidence(yolo_score: float, fake_prob: float, duplicate_prob: float) -> float:
    # weight: yolo 0.7, (1 - fake)*0.2, (1 - duplicate)*0.1
    return max(0.0, min(1.0, 0.7 * yolo_score + 0.2 * (1.0 - fake_prob) + 0.1 * (1.0 - duplicate_prob)))


def calibrate_confidence(conf: float, fake_prob: float, duplicate_prob: float) -> float:
    """Apply a small calibration multiplier to confidence based on fake/duplicate signals.
    Reduces confidence when fake_prob or duplicate_prob are high.
    """
    penalty = 1.0 - (0.4 * fake_prob + 0.2 * duplicate_prob)
    calibrated = conf * penalty
    return max(0.0, min(1.0, calibrated))


def compute_road_risk_score(detections: list) -> float:
    """Aggregate detections into a single road risk score between 0-1.
    Uses severity mapping and class-specific multipliers.
    """
    if not detections:
        return 0.0
    severity_map = {'low': 0.2, 'medium': 0.5, 'high': 0.8, 'critical': 1.0}
    class_multiplier = {
        'pothole': 1.0,
        'crack': 0.8,
        'waterlogging': 0.9,
        'surface wear': 0.6,
        'missing road marking': 0.7,
        'broken signboard': 0.7,
    }
    score = 0.0
    for d in detections:
        sev = d.get('severity', 'low')
        conf = d.get('confidence', 0.0)
        lbl = d.get('label', '').lower()
        sev_val = severity_map.get(sev, 0.2)
        mult = class_multiplier.get(lbl, 0.5)
        score += sev_val * conf * mult
    # normalize by number of detections and clamp
    score = score / max(1.0, len(detections))
    return max(0.0, min(1.0, score))
