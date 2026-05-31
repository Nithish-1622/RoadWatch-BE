from fastapi.testclient import TestClient
from orchestrator.main import app
from PIL import Image, ImageDraw
import io

client = TestClient(app)

# create two images
imgs = []
for offset in [0, 5]:
    img = Image.new('RGB', (320, 240), color=(0,0,0))
    d = ImageDraw.Draw(img)
    d.rectangle([50+offset,50+offset,200+offset,150+offset], fill=(255,255,255))
    buf = io.BytesIO(); img.save(buf, format='PNG'); buf.seek(0)
    imgs.append(('files', ('img.png', buf.read(), 'image/png')))

resp = client.post('/cv/batch_infer', files=imgs, params={'conf':0.25, 'store_phash': 'true'})
print('status', resp.status_code)
print(resp.json())
