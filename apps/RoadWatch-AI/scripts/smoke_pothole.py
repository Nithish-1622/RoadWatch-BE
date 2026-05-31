import os
os.environ['RW_USE_MOCK'] = 'true'
from fastapi.testclient import TestClient
from orchestrator.main import app
from PIL import Image, ImageDraw
import io

client = TestClient(app)

img = Image.new('RGB', (320,240), color=(200,200,200))
draw = ImageDraw.Draw(img)
# draw dark circular blob to mimic pothole
draw.ellipse([120,80,200,160], fill=(30,30,30))
buf = io.BytesIO(); img.save(buf, format='PNG'); buf.seek(0)
resp = client.post('/cv/infer', files={'file': ('pothole.png', buf.read(), 'image/png')})
print('status_code', resp.status_code)
print(resp.json())