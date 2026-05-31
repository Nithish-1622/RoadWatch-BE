from fastapi.testclient import TestClient
from orchestrator.main import app

client = TestClient(app)

samples = [
    'There is a large pothole on Main Street near 5th ward, please fix asap. Contractor: ABC Constructions',
    'பாதை சீரமைப்பு தொடர்பாக உதவி வேண்டும்',
    'सड़क पर पानी भरा है, जलभराव देखा गया 12.9716,77.5946',
    'What is the budget for project RW-1234?'
]

for s in samples:
    resp = client.post('/nlp/roadwatch', json={'text': s})
    print('TEXT:', s)
    print(resp.status_code, resp.json())
    print('---')
