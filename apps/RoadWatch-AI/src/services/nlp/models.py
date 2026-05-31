from typing import Optional, Any, Dict
try:
    from transformers import pipeline, AutoTokenizer, AutoModel, AutoModelForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
except Exception:
    TRANSFORMERS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except Exception:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

NER_PIPE = None
INTENT_PIPE = None
EMBED_MODEL = None
DISTIL_ENCODER = None
INDIC_ENCODER = None
WHISPER_PIPE = None


def _load_encoder(model_names: list[str]) -> Dict[str, Any]:
    if not TRANSFORMERS_AVAILABLE:
        raise RuntimeError('transformers not installed')
    last_exc = None
    for model_name in model_names:
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModel.from_pretrained(model_name)
            return {'tokenizer': tokenizer, 'model': model, 'model_name': model_name}
        except Exception as exc:
            last_exc = exc
            continue
    raise RuntimeError(f'failed to load encoder models: {last_exc}')


def get_intent_pipeline(model_name: str = 'distilbert-base-uncased-finetuned-sst-2-english'):
    global INTENT_PIPE
    if INTENT_PIPE is None:
        if not TRANSFORMERS_AVAILABLE:
            raise RuntimeError('transformers not installed')
        INTENT_PIPE = pipeline('text-classification', model=model_name)
    return INTENT_PIPE


def get_ner_pipeline(model_name: str = 'dbmdz/bert-large-cased-finetuned-conll03-english'):
    global NER_PIPE
    if NER_PIPE is None:
        if not TRANSFORMERS_AVAILABLE:
            raise RuntimeError('transformers not installed')
        NER_PIPE = pipeline('ner', model=model_name, aggregation_strategy='simple')
    return NER_PIPE


def get_sentence_transformer(model_name: str = 'sentence-transformers/all-MiniLM-L6-v2'):
    global EMBED_MODEL
    if EMBED_MODEL is None:
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise RuntimeError('sentence-transformers not installed')
        EMBED_MODEL = SentenceTransformer(model_name)
    return EMBED_MODEL


def get_distilbert_encoder(model_name: str = 'distilbert-base-uncased'):
    global DISTIL_ENCODER
    if DISTIL_ENCODER is None:
        DISTIL_ENCODER = _load_encoder([model_name, 'prajjwal1/bert-tiny', 'bert-base-uncased'])
    return DISTIL_ENCODER


def get_indicbert_encoder(model_name: str = 'ai4bharat/indic-bert'):
    global INDIC_ENCODER
    if INDIC_ENCODER is None:
        INDIC_ENCODER = _load_encoder([
            model_name,
            'bert-base-multilingual-cased',
            'xlm-roberta-base',
            'distilbert-base-multilingual-cased',
        ])
    return INDIC_ENCODER


def get_whisper_pipeline(model_name: str = 'openai/whisper-small'):
    global WHISPER_PIPE
    if WHISPER_PIPE is None:
        if not TRANSFORMERS_AVAILABLE:
            raise RuntimeError('transformers not installed')
        WHISPER_PIPE = pipeline('automatic-speech-recognition', model=model_name)
    return WHISPER_PIPE


def get_translation_pipeline(model_name: str = 'Helsinki-NLP/opus-mt-en-ROMANCE'):
    if not TRANSFORMERS_AVAILABLE:
        raise RuntimeError('transformers not installed')
    return pipeline('translation', model=model_name)


def get_language_detector():
    try:
        from langdetect import detect
        return detect
    except Exception:
        raise RuntimeError('langdetect not available')
