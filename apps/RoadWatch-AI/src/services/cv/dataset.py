import json
import os
from typing import Dict, Any, List


def load_coco(coco_json_path: str) -> Dict[str, Any]:
    with open(coco_json_path, 'r', encoding='utf-8') as f:
        coco = json.load(f)
    return coco


def load_labelstudio(ls_export_path: str) -> List[Dict[str, Any]]:
    # Label Studio JSONL or JSON export
    if ls_export_path.endswith('.jsonl'):
        items = []
        with open(ls_export_path, 'r', encoding='utf-8') as f:
            for line in f:
                items.append(json.loads(line))
        return items
    else:
        with open(ls_export_path, 'r', encoding='utf-8') as f:
            return json.load(f)


def validate_coco_dataset(coco: Dict[str, Any], images_root: str, required_classes: List[str] = None) -> List[str]:
    """Validate that images referenced in COCO exist and annotations are consistent.
    Also checks that required_classes (if provided) are present in the categories.
    Returns list of validation error messages (empty if valid).
    """
    errors = []
    images = {img['id']: img for img in coco.get('images', [])}
    anns = coco.get('annotations', [])
    categories = {c['id']: c for c in coco.get('categories', [])}
    cat_names = {c['name'] for c in coco.get('categories', [])}

    # check image files exist
    for img in images.values():
        img_path = os.path.join(images_root, img.get('file_name', ''))
        if not os.path.isfile(img_path):
            errors.append(f"missing image file: {img_path}")

    # check annotations reference known images and categories
    for a in anns:
        if a.get('image_id') not in images:
            errors.append(f"annotation references unknown image id: {a.get('image_id')}")
        if a.get('category_id') not in categories:
            errors.append(f"annotation references unknown category id: {a.get('category_id')}")
        # bbox sanity
        bbox = a.get('bbox')
        if not bbox or len(bbox) != 4:
            errors.append(f"annotation has invalid bbox: {a}")

    # required classes check
    if required_classes:
        missing = [c for c in required_classes if c not in cat_names]
        if missing:
            errors.append(f"missing required classes: {missing}")

    return errors


def write_dataset_manifest(dataset_root: str, manifest: Dict[str, Any]):
    os.makedirs(dataset_root, exist_ok=True)
    manifest_path = os.path.join(dataset_root, 'dataset_manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    return manifest_path


def labelstudio_to_coco(items: List[Dict[str, Any]], images_root: str, categories: List[str] = None) -> Dict[str, Any]:
    """Convert a Label Studio export (list of task dicts) into a minimal COCO dict.
    Expects each item to contain 'data': {'image': <path_or_url>} and 'annotations' list with 'result' entries.
    This is a best-effort mapper for common Label Studio image annotation exports.
    """
    coco = {'images': [], 'annotations': [], 'categories': []}
    cat_map = {}
    if categories:
        for i, name in enumerate(categories, start=1):
            coco['categories'].append({'id': i, 'name': name})
            cat_map[name] = i

    img_id = 1
    ann_id = 1
    for it in items:
        data = it.get('data', {})
        img_path = data.get('image') or data.get('image_url') or data.get('file')
        if not img_path:
            continue
        # assume filename only
        fname = os.path.basename(img_path)
        coco['images'].append({'id': img_id, 'file_name': fname})

        # parse results
        for res in it.get('annotations', []) or it.get('result', []) or []:
            for r in (res.get('result') if isinstance(res, dict) and 'result' in res else [res]):
                typ = r.get('type') or r.get('_type')
                if typ in ('rectanglelabels', 'labels', 'label'):
                    # label with bounding box
                    bbox_rel = r.get('value', {}).get('x'), r.get('value', {}).get('y'), r.get('value', {}).get('width'), r.get('value', {}).get('height')
                    if None in bbox_rel:
                        continue
                    x, y, w, h = bbox_rel
                    # convert percent -> absolute if needed (Label Studio often uses percent)
                    # try to find image size from disk
                    img_file = os.path.join(images_root, fname)
                    if os.path.isfile(img_file):
                        from PIL import Image
                        with Image.open(img_file) as im:
                            iw, ih = im.size
                        # if values look like percentages (<=100)
                        if w <= 100 and h <= 100:
                            x = x * iw / 100.0
                            y = y * ih / 100.0
                            w = w * iw / 100.0
                            h = h * ih / 100.0
                    category_name = None
                    labels = r.get('value', {}).get('rectanglelabels') or r.get('value', {}).get('labels') or r.get('value', {}).get('label')
                    if isinstance(labels, list):
                        category_name = labels[0] if labels else None
                    else:
                        category_name = labels
                    if category_name and category_name not in cat_map:
                        cid = len(cat_map) + 1
                        cat_map[category_name] = cid
                        coco['categories'].append({'id': cid, 'name': category_name})
                    cid = cat_map.get(category_name, 1)
                    coco['annotations'].append({'id': ann_id, 'image_id': img_id, 'category_id': cid, 'bbox': [x, y, w, h]})
                    ann_id += 1
        img_id += 1
    return coco


def load_roboflow(roboflow_export_path: str) -> Dict[str, Any]:
    """Best-effort loader for Roboflow exports. If the export contains a data.json or train/_annotations.coco.json,
    try to read the COCO-style annotations.
    """
    # If path is a directory, look for common files
    if os.path.isdir(roboflow_export_path):
        possible = ['data.json', 'train/_annotations.coco.json', 'annotations.json']
        for p in possible:
            fp = os.path.join(roboflow_export_path, p)
            if os.path.isfile(fp):
                with open(fp, 'r', encoding='utf-8') as f:
                    return json.load(f)
    # if it's a zip, try to extract to temp dir
    if roboflow_export_path.endswith('.zip') and os.path.isfile(roboflow_export_path):
        import zipfile, tempfile
        td = tempfile.mkdtemp(prefix='rf_')
        with zipfile.ZipFile(roboflow_export_path, 'r') as z:
            z.extractall(td)
        return load_roboflow(td)
    raise FileNotFoundError('Roboflow export not found or unsupported format')


def generate_yolo_dataset_yaml(coco: Dict[str, Any], dataset_root: str, out_path: str = None) -> str:
    """Generate a YOLO/Ultralytics dataset yaml file from a COCO dict.
    Copies or expects images under dataset_root/images/<train|val> and returns the yaml file path.
    """
    # simple split by image index
    imgs = coco.get('images', [])
    n = len(imgs)
    train_cut = int(n * 0.8)
    train_imgs = imgs[:train_cut]
    val_imgs = imgs[train_cut:]

    names = [c.get('name') for c in coco.get('categories', [])]
    nc = len(names)

    data = {
        'path': dataset_root,
        'train': 'images/train',
        'val': 'images/val',
        'nc': nc,
        'names': names,
    }
    out_path = out_path or os.path.join(dataset_root, 'dataset.yaml')
    with open(out_path, 'w', encoding='utf-8') as f:
        import yaml
        yaml.safe_dump(data, f)
    return out_path
