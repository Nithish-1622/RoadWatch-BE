from typing import List, Dict, Tuple
import numpy as np


def iou(boxA, boxB) -> float:
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    interW = max(0, xB - xA)
    interH = max(0, yB - yA)
    inter = interW * interH
    areaA = max(0, (boxA[2]-boxA[0])*(boxA[3]-boxA[1]))
    areaB = max(0, (boxB[2]-boxB[0])*(boxB[3]-boxB[1]))
    union = areaA + areaB - inter
    return inter / union if union > 0 else 0.0


def match_predictions(gt: List[Dict], preds: List[Dict], iou_thresh: float = 0.5) -> Tuple[int,int,int,List[Tuple[str,str]]]:
    """Return TP, FP, FN and list of (gt_label,pred_label) pairs for confusion matrix."""
    gt_used = [False]*len(gt)
    tp = 0
    fp = 0
    pairs = []
    for p in preds:
        best_i = -1
        best_iou = 0.0
        for i, g in enumerate(gt):
            if gt_used[i]:
                continue
            iou_v = iou(p['bbox'], g['bbox'])
            if iou_v > best_iou:
                best_i = i
                best_iou = iou_v
        if best_i >= 0 and best_iou >= iou_thresh:
            tp += 1
            gt_used[best_i] = True
            pairs.append((gt[best_i].get('label',''), p.get('label','')))
        else:
            fp += 1
            pairs.append(('', p.get('label','')))
    fn = sum(1 for used in gt_used if not used)
    return tp, fp, fn, pairs


def precision_recall(tp: int, fp: int, fn: int) -> Tuple[float,float]:
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    return prec, rec


def confusion_matrix(pairs: List[Tuple[str,str]]) -> Dict[Tuple[str,str], int]:
    cm = {}
    for gt, pred in pairs:
        cm[(gt, pred)] = cm.get((gt, pred), 0) + 1
    return cm


def average_precision_at_iou(gt: List[Dict], preds: List[Dict], iou_thresh: float = 0.5) -> float:
    """Compute a simple AP by thresholding preds by descending score and computing precision at each step."""
    preds_sorted = sorted(preds, key=lambda x: x.get('score', 0.0), reverse=True)
    tps = 0
    fps = 0
    precisions = []
    gt_count = len(gt)
    matched = set()
    for p in preds_sorted:
        hit = False
        for i, g in enumerate(gt):
            if i in matched:
                continue
            if iou(p['bbox'], g['bbox']) >= iou_thresh and p.get('label','') == g.get('label',''):
                hit = True
                matched.add(i)
                break
        if hit:
            tps += 1
        else:
            fps += 1
        prec = tps / (tps + fps) if (tps + fps) > 0 else 0.0
        precisions.append(prec)
    if not precisions:
        return 0.0
    return float(np.mean(precisions))
