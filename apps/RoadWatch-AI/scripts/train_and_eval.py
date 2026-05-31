"""Train YOLO on a provided COCO/LabelStudio/Roboflow dataset and evaluate on validation set.

Usage: python scripts/train_and_eval.py --coco path/to/annotations.json --images path/to/images --out models/cv --epochs 5
"""
import argparse
import os
import json
from services.cv import dataset as ds
from services.cv import prepare
from services.cv import train_runner
from services.cv import eval as cv_eval

from ultralytics import YOLO


def load_coco_if_path(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def evaluate_model_on_val(manifest, val_images_dir, coco_val, classes, weights_path):
    model = YOLO(weights_path)
    preds = []
    gts = []
    # build image id -> gt anns
    ann_map = {}
    for a in coco_val.get('annotations', []):
        ann_map.setdefault(a['image_id'], []).append(a)
    images = coco_val.get('images', [])
    names = {c['id']: c['name'] for c in coco_val.get('categories', [])}
    for img in images:
        fname = img['file_name']
        path = os.path.join(val_images_dir, fname)
        if not os.path.isfile(path):
            continue
        results = model.predict(source=path, conf=0.001, verbose=False)
        r = results[0]
        boxes = getattr(r.boxes, 'xyxy', None)
        classes_pred = getattr(r.boxes, 'cls', None)
        scores = getattr(r.boxes, 'conf', None)
        if boxes is None:
            pred_boxes = []
        else:
            try:
                pred_boxes = boxes.tolist()
                cls_list = classes_pred.tolist() if classes_pred is not None else [None]*len(pred_boxes)
                confs = scores.tolist() if scores is not None else [0.0]*len(pred_boxes)
            except Exception:
                pred_boxes = [list(map(float,b)) for b in boxes]
                cls_list = list(classes_pred) if classes_pred is not None else [None]*len(pred_boxes)
                confs = list(scores) if scores is not None else [0.0]*len(pred_boxes)
        # collect preds
        for box, cls, conf in zip(pred_boxes, cls_list, confs):
            label = model.names[int(cls)] if cls is not None and int(cls) in model.names else str(int(cls)) if cls is not None else ''
            preds.append({'label': label, 'bbox': [float(box[0]), float(box[1]), float(box[2]), float(box[3])], 'score': float(conf)})
        # collect gts
        for a in ann_map.get(img['id'], []):
            gts.append({'label': names.get(a['category_id'], ''), 'bbox': a['bbox'] if len(a['bbox'])==4 else a.get('bbox')})

    # compute metrics per IoU thresholds
    iou50 = cv_eval.average_precision_at_iou(gts, preds, iou_thresh=0.5)
    # estimate mAP@50-95 by averaging APs across thresholds 0.5:0.05:0.95
    thresholds = [round(x/100.0, 2) for x in range(50, 100, 5)]
    aps = []
    for t in thresholds:
        ap_t = cv_eval.average_precision_at_iou(gts, preds, iou_thresh=t)
        aps.append(ap_t)
    map_50_95 = sum(aps)/len(aps) if aps else 0.0
    # precision/recall using match at 0.5
    tp, fp, fn, pairs = cv_eval.match_predictions(gts, preds, iou_thresh=0.5)
    prec, rec = cv_eval.precision_recall(tp, fp, fn)
    cm = cv_eval.confusion_matrix(pairs)
    report = {
        'mAP@50': float(iou50),
        'mAP@50-95': float(map_50_95),
        'precision': float(prec),
        'recall': float(rec),
        'confusion_matrix': {f"{k[0]}->{k[1]}": v for k,v in cm.items()},
    }
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--coco', required=True, help='Path to COCO annotations json')
    parser.add_argument('--images', required=True, help='Path to images root')
    parser.add_argument('--out', default='models/cv', help='Output project dir')
    parser.add_argument('--epochs', type=int, default=5)
    parser.add_argument('--classes', help='Comma-separated RoadWatch classes override')
    args = parser.parse_args()

    coco = load_coco_if_path(args.coco)
    classes = args.classes.split(',') if args.classes else [
        'pothole','crack','waterlogging','surface wear','missing road marking','broken signboard']

    # validate classes present
    coco_cat_names = [c['name'] for c in coco.get('categories',[])]
    missing = [c for c in classes if c not in coco_cat_names]
    if missing:
        print('ERROR: dataset missing required classes:', missing)
        return

    dataset_root = os.path.join('data', 'roadwatch_dataset')
    yaml_path = prepare.coco_to_yolo_dataset(coco, args.images, dataset_root, classes)
    print('dataset yaml:', yaml_path)

    manifest = train_runner.train_yolo(yaml_path, epochs=args.epochs, project=args.out)
    print('training manifest:', manifest)
    weights = manifest.get('checkpoint')
    if not weights or not os.path.isfile(weights):
        print('No weights found at', weights)
        return

    # build coco val subset for evaluation (use original coco but only val images chosen earlier)
    # For simplicity, reuse coco and assume prepare split used last N images as val
    n_images = len(coco.get('images',[]))
    val_count = max(1, int(n_images * 0.2))
    val_images = coco.get('images', [])[-val_count:]
    coco_val = {'images': val_images, 'annotations': [a for a in coco.get('annotations',[]) if a['image_id'] in {im['id'] for im in val_images}], 'categories': coco.get('categories',[])}
    val_images_dir = os.path.join(dataset_root, 'images', 'val')
    report = evaluate_model_on_val(manifest, val_images_dir, coco_val, classes, weights)
    out_report = os.path.join(args.out, manifest.get('name','model') + '_eval.json')
    with open(out_report, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    print('evaluation report written to', out_report)


if __name__ == '__main__':
    main()
