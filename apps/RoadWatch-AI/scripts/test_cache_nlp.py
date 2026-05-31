import asyncio
from services.nlp.service import analyze as nlp_analyze
print(asyncio.run(nlp_analyze('Test cache key 123')))
print(asyncio.run(nlp_analyze('Test cache key 123')))
