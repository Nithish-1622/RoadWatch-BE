from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Any, Dict

from .models import get_sentence_transformer, get_translation_pipeline, get_language_detector
from .inference import infer_text, classify_intent, detect_entities, translate_to_english, transcribe_audio
from .service import analyze as analyze_service

router = APIRouter(prefix='/nlp', tags=['nlp'])


class TextIn(BaseModel):
    text: str


class InferIn(BaseModel):
    text: str
    language: str | None = None


@router.post('/encode')
def encode(payload: TextIn):
    try:
        model = get_sentence_transformer()
        emb = model.encode(payload.text)
        return {'embedding': emb.tolist() if hasattr(emb, 'tolist') else list(emb)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/intent')
def intent(payload: TextIn):
    try:
        lang = None
        try:
            lang = get_language_detector()(payload.text)
        except Exception:
            lang = 'en'
        return {'intent': classify_intent(payload.text, language=lang)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/entities')
def entities(payload: TextIn):
    try:
        return {'entities': detect_entities(payload.text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/translate')
def translate(payload: TextIn):
    try:
        lang = 'en'
        try:
            lang = get_language_detector()(payload.text)
        except Exception:
            pass
        return {'translation': translate_to_english(payload.text, lang)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/lang')
def detect_lang(payload: TextIn):
    try:
        det = get_language_detector()
        code = det(payload.text)
        return {'language': code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/roadwatch')
def roadwatch_analyze(payload: TextIn):
    try:
        return infer_text(payload.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/infer')
async def infer(payload: InferIn):
    try:
        lang = payload.language
        if not lang:
            try:
                lang = get_language_detector()(payload.text)
            except Exception:
                lang = 'en'
        out = infer_text(payload.text)
        out['language'] = lang
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/whisper')
def whisper_audio(file: UploadFile = File(...)):
    try:
        data = file.file.read()
        text = transcribe_audio(data)
        return {'transcript': text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
