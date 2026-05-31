import os
import time
from typing import Optional, Dict

try:
    from ultralytics import YOLO
except Exception:
    YOLO = None


def train_yolo(dataset_yaml: str, epochs: int = 10, project: str = 'models/cv', name: Optional[str] = None) -> Dict[str, str]:
    """Run ultralytics YOLO train. Expects dataset yaml (train/val paths).
    Returns a manifest with checkpoint path and metadata.
    """
    if YOLO is None:
        raise RuntimeError('ultralytics not available')
    ts = int(time.time())
    name = name or f'yolo_roadwatch_{ts}'
    os.makedirs(project, exist_ok=True)
    model = YOLO('yolov8n.pt')
    # call train
    model.train(data=dataset_yaml, epochs=epochs, project=project, name=name)
    # ultralytics writes weights under project/name/weights/
    weights_dir = os.path.join(project, name, 'weights')
    ckpt_last = os.path.join(weights_dir, 'last.pt')
    ckpt_best = os.path.join(weights_dir, 'best.pt')
    # prefer best.pt if it exists
    if os.path.isfile(ckpt_best):
        ckpt = ckpt_best
    else:
        ckpt = ckpt_last
    manifest = {
        'checkpoint': ckpt,
        'project': project,
        'name': name,
        'epochs': str(epochs),
    }
    # write manifest next to checkpoint
    manifest_path = os.path.join(project, name, 'model_manifest.json')
    try:
        import json
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)
    except Exception:
        pass
    return manifest
