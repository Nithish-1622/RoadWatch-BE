import io
from typing import List, Dict, Optional

from PIL import Image

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except Exception:
    ULTRALYTICS_AVAILABLE = False


class YOLODetector:
    def __init__(self, weights: Optional[str] = None):
        if not ULTRALYTICS_AVAILABLE:
            raise RuntimeError("ultralytics package is required for YOLODetector")
        self.weights = weights or "yolov8n.pt"
        # Model will download weights if not present
        self.model = YOLO(self.weights)

    def infer_bytes(self, image_bytes: bytes, conf: float = 0.25) -> List[Dict]:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        # ultralytics accepts PIL.Image
        results = self.model.predict(source=img, conf=conf, verbose=False)
        if not results:
            return []
        r = results[0]
        detections = []
        # r.boxes has .xyxy, .cls, .conf, but types vary; handle generically
        boxes = getattr(r.boxes, "xyxy", None)
        classes = getattr(r.boxes, "cls", None)
        scores = getattr(r.boxes, "conf", None)
        if boxes is None:
            return []
        try:
            xyxy = boxes.tolist()
            cls_list = classes.tolist() if classes is not None else [None] * len(xyxy)
            confs = scores.tolist() if scores is not None else [None] * len(xyxy)
        except Exception:
            # Fallback to iterating
            xyxy = [list(map(float, b)) for b in boxes]
            cls_list = list(classes) if classes is not None else [None] * len(xyxy)
            confs = list(scores) if scores is not None else [None] * len(xyxy)

        names = getattr(self.model, "names", {}) or {}
        for box, cls, conf in zip(xyxy, cls_list, confs):
            label = names[int(cls)] if cls is not None and int(cls) in names else str(int(cls)) if cls is not None else "unknown"
            detections.append({
                "label": label,
                "bbox": [float(box[0]), float(box[1]), float(box[2]), float(box[3])],
                "score": float(conf) if conf is not None else None,
            })
        return detections


class MockDetector:
    """Simple rule-based detector for smoke tests and development when weights are unavailable.
    Detects three visual cues:
      - dark circular/irregular blobs -> pothole
      - thin dark lines -> crack
      - blue/reflective rectangles -> waterlogging
    """
    def __init__(self):
        pass

    def infer_bytes(self, image_bytes: bytes, conf: float = 0.25) -> List[Dict]:
        import numpy as np
        import cv2
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        arr = np.array(img)
        h, w = arr.shape[:2]
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        blurred = cv2.GaussianBlur(gray, (7,7), 0)
        # detect contours
        _, th = cv2.threshold(blurred, 127, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections = []
        for c in contours:
            area = cv2.contourArea(c)
            if area < 50:
                continue
            x,y,ww,hh = cv2.boundingRect(c)
            # crop region to analyze color
            crop = arr[y:y+hh, x:x+ww]
            mean = crop.mean(axis=(0,1)) if crop.size else np.array([0,0,0])
            label = 'pothole'
            # blue dominant -> waterlogging
            if mean[2] > mean[0] and mean[2] > mean[1] and mean[2] > 100:
                label = 'waterlogging'
            # thin long -> crack
            elif hh < 0.2*ww or ww < 0.2*hh:
                label = 'crack'
            # else if area big and low variance -> surface wear
            elif area > (w*h)*0.05:
                label = 'surface wear'
            detections.append({
                'label': label,
                'bbox': [float(x), float(y), float(x+ww), float(y+hh)],
                'score': float(min(0.99, 0.5 + area/(w*h)))
            })
        # also a simple check for missing road marking: detect long white lines with gaps
        # Hough line detection for white lines
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=30, maxLineGap=40)
        if lines is not None:
            # if fewer long lines than expected -> missing road marking
            if len(lines) < 1:
                pass
            # detect broken lines by counting gaps (heuristic)
            # if many short segments -> broken marking
            short_segments = sum(1 for l in lines if abs(l[0][2]-l[0][0]) < w*0.5)
            if short_segments > 2:
                detections.append({'label': 'missing road marking', 'bbox': [0.0,0.0,float(w),float(h)], 'score': 0.4})

        # remove duplicates by IoU heuristic
        final = []
        for d in detections:
            keep = True
            for f in final:
                # IoU
                x1 = max(d['bbox'][0], f['bbox'][0])
                y1 = max(d['bbox'][1], f['bbox'][1])
                x2 = min(d['bbox'][2], f['bbox'][2])
                y2 = min(d['bbox'][3], f['bbox'][3])
                iw = max(0, x2 - x1)
                ih = max(0, y2 - y1)
                inter = iw * ih
                area_d = (d['bbox'][2]-d['bbox'][0])*(d['bbox'][3]-d['bbox'][1])
                area_f = (f['bbox'][2]-f['bbox'][0])*(f['bbox'][3]-f['bbox'][1])
                union = area_d + area_f - inter
                iou = inter/union if union>0 else 0
                if iou > 0.6:
                    keep = False
                    break
            if keep:
                final.append(d)
        return final
