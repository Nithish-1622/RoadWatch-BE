import asyncio
from storage.redis_client import ping_health
print('redis health:', ping_health())
from services.nlp.service import analyze as nlp_analyze
print('nlp analyze:', asyncio.run(nlp_analyze('There is a pothole on Main St near school')))
from services.rag.service import analyze as rag_analyze
print('rag analyze:', asyncio.run(rag_analyze({'text':'pothole on main st','ocr':{'extracted_text':'Pothole on Main St','metadata':{}, 'confidence':0.9}, 'geo':{'road_type':'tertiary','authority':'city', 'confidence':0.7}})))
from services.geo.engine import lookup
print('geo lookup:', asyncio.run(lookup(12.9716,77.5946)))
