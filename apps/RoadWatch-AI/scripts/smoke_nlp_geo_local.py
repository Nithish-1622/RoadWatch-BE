import asyncio
import torch

from services.nlp import inference as nlp_inf
from services.geo import engine as geo_eng


class DummyTokenizer:
    def __call__(self, text, return_tensors='pt', truncation=True, max_length=128, padding=True):
        ids = torch.tensor([[1, 2, 3]])
        mask = torch.ones_like(ids)
        return {'input_ids': ids, 'attention_mask': mask}


class DummyModel:
    def __call__(self, **inputs):
        class Out:
            pass

        out = Out()
        out.last_hidden_state = torch.ones((1, 3, 4), dtype=torch.float32)
        return out


class DummySentenceTransformer:
    def encode(self, text, normalize_embeddings=True):
        return [0.1, 0.2, 0.3]


nlp_inf.get_language_detector = lambda: (lambda text: 'en')
nlp_inf.get_distilbert_encoder = lambda: {'tokenizer': DummyTokenizer(), 'model': DummyModel()}
nlp_inf.get_indicbert_encoder = lambda: {'tokenizer': DummyTokenizer(), 'model': DummyModel()}
nlp_inf.get_sentence_transformer = lambda: DummySentenceTransformer()
nlp_inf.get_translation_pipeline = lambda model_name=None: (lambda text: [{'translation_text': text}])
nlp_inf.get_ner_pipeline = lambda: (lambda text: [{'entity_group': 'LOC', 'word': 'Main Street', 'score': 0.99}])
nlp_inf.get_whisper_pipeline = lambda: (lambda path: {'text': 'transcribed text'})

print('NLP:', nlp_inf.infer_text('There is a pothole on Main Street near school'))

geo_eng.POSTGIS_DSN = None
geo_eng.asyncpg = None
geo_eng.aiohttp = None
print('GEO:', asyncio.run(geo_eng.lookup(12.9716, 77.5946)))
