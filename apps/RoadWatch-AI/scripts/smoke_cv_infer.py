from fastapi.testclient import TestClient
from orchestrator.main import app
from PIL import Image, ImageDraw
import io

client = TestClient(app)

# create a simple synthetic image with a white rectangle on black background
img = Image.new('RGB', (640, 480), color=(0, 0, 0))
d = ImageDraw.Draw(img)
d.rectangle([150, 100, 500, 350], outline=(255, 255, 255), fill=(200, 200, 200))
buf = io.BytesIO()
img.save(buf, format='PNG')
buf.seek(0)

files = {'file': ('test.png', buf.read(), 'image/png')}
resp = client.post('/cv/infer', files=files, params={'conf': 0.25})
print('status_code:', resp.status_code)
try:
    print('json:', resp.json())
except Exception:
    print('text:', resp.text)
