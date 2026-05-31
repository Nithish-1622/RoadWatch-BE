import os
os.environ['RW_USE_MOCK'] = 'true'
from fastapi.testclient import TestClient
from orchestrator.main import app
from PIL import Image, ImageDraw
import io

client = TestClient(app)

img = Image.new('RGB', (320,240), color=(200,200,200))
draw = ImageDraw.Draw(img)
# draw thin dark line to mimic crack
draw.line([10,120,310,123], fill=(10,10,10), width=2)
buf = io.BytesIO(); img.save(buf, format='PNG'); buf.seek(0)
resp = client.post('/cv/infer', files={'file': ('crack.png', buf.read(), 'image/png')})
print('status_code', resp.status_code)
print(resp.json())