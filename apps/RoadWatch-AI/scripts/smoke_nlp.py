from fastapi.testclient import TestClient
from orchestrator.main import app

client = TestClient(app)

resp = client.post('/nlp/intent', json={'text':'There is a big pothole on the main road, vehicle damaged'})
print('intent', resp.status_code, resp.json())
resp = client.post('/nlp/entities', json={'text':'Pothole near 5th street, coordinates 12.34, 56.78'})
print('entities', resp.status_code, resp.json())
resp = client.post('/nlp/lang', json={'text':'यह एक सड़क का गड्ढा है'})
print('lang', resp.status_code, resp.json())
