from services.cv.utils import compute_phash, is_duplicate
from PIL import Image, ImageDraw
import io

# create two similar images
img1 = Image.new('RGB', (200, 200), color=(0,0,0))
d = ImageDraw.Draw(img1)
d.rectangle([50,50,150,150], fill=(255,255,255))
buf1 = io.BytesIO(); img1.save(buf1, format='PNG'); buf1.seek(0)
img1_bytes = buf1.read()

# create slightly different image
img2 = Image.new('RGB', (200,200), color=(0,0,0))
d2 = ImageDraw.Draw(img2)
d2.rectangle([52,52,152,152], fill=(255,255,255))
buf2 = io.BytesIO(); img2.save(buf2, format='PNG'); buf2.seek(0)
img2_bytes = buf2.read()

h1 = compute_phash(img1_bytes)
h2 = compute_phash(img2_bytes)
print('phash1', h1)
print('phash2', h2)
dup, prob = is_duplicate(h1, h2)
print('is_dup', dup, 'prob', prob)
