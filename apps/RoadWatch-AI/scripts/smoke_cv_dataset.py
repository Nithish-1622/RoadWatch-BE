from services.cv.dataset import validate_coco_dataset, write_dataset_manifest
import os
import json

# create a tiny COCO dataset structure
root = 'tmp_coco'
images_dir = os.path.join(root, 'images')
ios = os
os.makedirs(images_dir, exist_ok=True)
# create an empty image file
img_path = os.path.join(images_dir, 'img1.jpg')
with open(img_path, 'wb') as f:
    f.write(b'')

coco = {
    'images': [{'id': 1, 'file_name': 'img1.jpg', 'height': 480, 'width': 640}],
    'annotations': [],
    'categories': [{'id': 1, 'name': 'pothole'}]
}
json_path = os.path.join(root, 'coco.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(coco, f)

c = validate_coco_dataset(coco, images_dir)
print('validation errors:', c)
manifest_path = write_dataset_manifest(root, {'version': '0.1', 'source': 'smoke'})
print('manifest written:', manifest_path)
