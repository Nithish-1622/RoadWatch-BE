import os
import shutil
from typing import Dict, Any, List, Tuple
import math

from PIL import Image


def _ensure_dirs(root: str):
    os.makedirs(os.path.join(root, 'images', 'train'), exist_ok=True)
    os.makedirs(os.path.join(root, 'images', 'val'), exist_ok=True)
    os.makedirs(os.path.join(root, 'labels', 'train'), exist_ok=True)
    os.makedirs(os.path.join(root, 'labels', 'val'), exist_ok=True)


def coco_to_yolo_dataset(coco: Dict[str, Any], images_root: str, out_root: str, classes: List[str], val_split: float = 0.2) -> str:
    """Convert COCO dict into YOLO-style dataset under out_root.
    images_root: directory where COCO 'file_name's are located.
    classes: ordered list of class names for mapping -> indices.
    Returns path to dataset yaml file.
    """
    _ensure_dirs(out_root)
    images = coco.get('images', [])
    anns = coco.get('annotations', [])
    # map image id -> anns
    ann_map = {}
    for a in anns:
        ann_map.setdefault(a['image_id'], []).append(a)

    # deterministic split by filename hash
    images_sorted = sorted(images, key=lambda x: x.get('file_name',''))
    n = len(images_sorted)
    val_count = max(1, int(n * val_split))
    val_set = set(img['file_name'] for img in images_sorted[-val_count:])

    cat_name_map = {c['id']: c['name'] for c in coco.get('categories', [])}
    class_to_idx = {name: i for i, name in enumerate(classes)}

    for img in images_sorted:
        fname = img.get('file_name')
        src = os.path.join(images_root, fname)
        if not os.path.isfile(src):
            continue
        target_split = 'val' if fname in val_set else 'train'
        dst_img = os.path.join(out_root, 'images', target_split, fname)
        shutil.copy2(src, dst_img)
        # prepare label file
        w = img.get('width') or Image.open(src).size[0]
        h = img.get('height') or Image.open(src).size[1]
        lines = []
        for a in ann_map.get(img['id'], []):
            cat_name = cat_name_map.get(a.get('category_id'))
            if cat_name not in class_to_idx:
                # skip unknown classes
                continue
            cls_idx = class_to_idx[cat_name]
            # COCO bbox: [x,y,w,h]
            bx, by, bw, bh = a.get('bbox', [0,0,0,0])
            x_center = (bx + bw/2.0) / w
            y_center = (by + bh/2.0) / h
            nw = bw / w
            nh = bh / h
            lines.append(f"{cls_idx} {x_center:.6f} {y_center:.6f} {nw:.6f} {nh:.6f}")
        label_path = os.path.join(out_root, 'labels', target_split, os.path.splitext(fname)[0] + '.txt')
        with open(label_path, 'w', encoding='utf-8') as lf:
            lf.write('\n'.join(lines))

    # generate dataset yaml
    yaml_path = os.path.join(out_root, 'dataset.yaml')
    names = classes
    data = {
        'path': out_root,
        'train': 'images/train',
        'val': 'images/val',
        'nc': len(names),
        'names': names,
    }
    try:
        import yaml
        with open(yaml_path, 'w', encoding='utf-8') as yf:
            yaml.safe_dump(data, yf)
    except Exception:
        # fallback simple writer
        with open(yaml_path, 'w', encoding='utf-8') as yf:
            yf.write(f"path: {out_root}\ntrain: images/train\nval: images/val\nnc: {len(names)}\nnames: {names}\n")
    return yaml_path
