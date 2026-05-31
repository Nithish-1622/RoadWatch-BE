from services.cv import dataset
import json

m = json.load(open('tmp_coco/dataset_manifest.json'))
# m likely contains paths; but we created manifest minimal earlier.
# For test, construct a minimal coco dict
coco = {'images': [{'id':1,'file_name':'tmp.png'},{'id':2,'file_name':'tmp2.png'}], 'categories':[{'id':1,'name':'pothole'},{'id':2,'name':'crack'}]}
path = dataset.generate_yolo_dataset_yaml(coco, 'tmp_coco')
print('yaml written:', path)
print(open(path).read())
