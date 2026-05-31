import os
os.environ['RW_USE_MOCK']='true'
from fastapi.testclient import TestClient
from orchestrator.main import app
from PIL import Image, ImageDraw
import io
from services.cv import eval as cv_eval

client = TestClient(app)

# create synthetic ground truth and image
img = Image.new('RGB', (320,240), color=(200,200,200))
d = ImageDraw.Draw(img)
d.ellipse([120,80,200,160], fill=(30,30,30))  # pothole
buf = io.BytesIO(); img.save(buf, format='PNG'); buf.seek(0)
resp = client.post('/cv/infer', files={'file': ('test.png', buf.read(), 'image/png')})
print('infer status', resp.status_code)
res = resp.json()
print('infer result', res)

# create GT matching MockDetector output
gt = [{'label': 'pothole', 'bbox': [120,80,200,160]}]
preds = []
for d in res.get('detections', []):
    preds.append({'label': d['label'], 'bbox': d['bbox'], 'score': d.get('confidence', d.get('score',0.0))})

tp, fp, fn, pairs = cv_eval.match_predictions(gt, preds, iou_thresh=0.3)
prec, rec = cv_eval.precision_recall(tp, fp, fn)
ap = cv_eval.average_precision_at_iou(gt, preds, iou_thresh=0.3)
cm = cv_eval.confusion_matrix(pairs)
print('tp,fp,fn', tp,fp,fn)
print('precision,recall,ap', prec, rec, ap)
print('confusion matrix', cm)
