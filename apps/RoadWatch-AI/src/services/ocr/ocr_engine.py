import io
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import hashlib
from storage.cache import sync_get, sync_set, make_key

try:
    from paddleocr import PaddleOCR
    _PADDLE_AVAILABLE = True
except Exception:
    PaddleOCR = None
    _PADDLE_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image
    _TESSERACT_AVAILABLE = True
except Exception:
    pytesseract = None
    Image = None
    _TESSERACT_AVAILABLE = False

import fitz  # PyMuPDF for PDF rendering
from PyPDF2 import PdfReader


@dataclass
class OCRResult:
    page_texts: List[str]
    metadata: Dict[str, Any]
    confidences: List[float]


def _paddle_ocr_instance(lang: str = 'en'):
    if not _PADDLE_AVAILABLE:
        return None
    # reuse a CPU model by default
    return PaddleOCR(use_angle_cls=True, lang=lang)


def ocr_image_with_paddle(img: Image.Image, ocr_inst=None) -> Tuple[str, float]:
    if not _PADDLE_AVAILABLE:
        raise RuntimeError('PaddleOCR not available')
    if ocr_inst is None:
        ocr_inst = _paddle_ocr_instance()
    # PaddleOCR returns list of results: [[(box), (text, confidence)], ...]
    res = ocr_inst.ocr(img, cls=True)
    texts = []
    confs = []
    for page in res:
        for line in page:
            txt, conf = line[1]
            texts.append(txt)
            try:
                confs.append(float(conf))
            except Exception:
                confs.append(0.0)
    joined = "\n".join(texts)
    avg_conf = float(sum(confs) / len(confs)) if confs else 0.0
    return joined, avg_conf


def ocr_image_with_tesseract(img: Image.Image) -> Tuple[str, float]:
    if not _TESSERACT_AVAILABLE:
        raise RuntimeError('Tesseract/pytesseract not available')
    # Use pytesseract image_to_data to fetch confidence per word
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    texts = []
    confs = []
    n = len(data.get('text', []))
    for i in range(n):
        txt = data['text'][i]
        conf = data['conf'][i]
        if txt and txt.strip():
            texts.append(txt)
            try:
                conff = float(conf)
            except Exception:
                conff = 0.0
            confs.append(conff)
    joined = " ".join(texts)
    avg_conf = float(sum(confs) / len(confs)) if confs else 0.0
    # pytesseract confidences are 0-100 usually
    if avg_conf > 1.0:
        avg_conf = avg_conf / 100.0
    return joined, avg_conf


def render_pdf_pages(pdf_bytes: bytes, zoom: float = 2.0) -> List[Image.Image]:
    doc = fitz.open(stream=pdf_bytes, filetype='pdf')
    images = []
    for page in doc:
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes('png')
        from PIL import Image as PILImage
        images.append(PILImage.open(io.BytesIO(img_bytes)).convert('RGB'))
    return images


def extract_pdf_metadata(pdf_bytes: bytes) -> Dict[str, Any]:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        info = reader.metadata
        md = {}
        if info is not None:
            for k, v in info.items():
                md[k.replace('/', '')] = v
        # populate common fields
        out = {
            'title': md.get('Title') or md.get('title'),
            'author': md.get('Author') or md.get('author'),
            'producer': md.get('Producer'),
            'creation_date': md.get('CreationDate'),
            'mod_date': md.get('ModDate'),
            'raw': md,
        }
        return out
    except Exception:
        return {}


def detect_document_type(text: str) -> str:
    # naive keyword-based detection for government doc types
    lower = text.lower()
    mapping = [
        ('tender', ['tender', 'eoi', 'notice inviting', 'bid', 'procure']),
        ('rti', ['right to information', 'rti', 'information requested', 'request for information']),
        ('maintenance_record', ['maintenance', 'repair', 'inspected', 'logbook', 'maintenance record']),
        ('contractor_document', ['contractor', 'contract', 'agreement', 'works order', 'work order']),
    ]
    for doc_type, keywords in mapping:
        for kw in keywords:
            if kw in lower:
                return doc_type
    return 'unknown'


def compute_confidence_from_list(confs: List[float]) -> float:
    if not confs:
        return 0.0
    # clamp between 0-1
    avg = sum(confs) / len(confs)
    return max(0.0, min(1.0, float(avg)))


def ocr_bytes(data: bytes, filename: Optional[str] = None) -> OCRResult:
    # compute cache key
    try:
        key_input = (filename or '') + ':' + hashlib.sha256(data).hexdigest()
        cache_key = make_key('ocr:bytes', key_input)
        cached = sync_get(cache_key)
        if cached.get('cache_hit') and isinstance(cached.get('value'), dict):
            v = cached.get('value')
            return OCRResult(page_texts=v.get('page_texts', []), metadata=v.get('metadata', {}), confidences=v.get('confidences', []))
    except Exception:
        cache_key = None

    # determine type by filename or magic
    if filename and filename.lower().endswith('.pdf'):
        images = render_pdf_pages(data)
    else:
        from PIL import Image as PILImage
        images = [PILImage.open(io.BytesIO(data)).convert('RGB')]

    page_texts = []
    page_confs = []
    paddle_inst = None
    if _PADDLE_AVAILABLE:
        paddle_inst = _paddle_ocr_instance()

    for img in images:
        try:
            if paddle_inst:
                txt, conf = ocr_image_with_paddle(img, paddle_inst)
            else:
                txt, conf = ocr_image_with_tesseract(img)
        except Exception:
            # fallback to tesseract
            txt, conf = ocr_image_with_tesseract(img)
        page_texts.append(txt)
        page_confs.append(conf)

    metadata = extract_pdf_metadata(data) if (filename and filename.lower().endswith('.pdf')) else {}
    full_text = "\n---PAGE---\n".join(page_texts)
    doc_type = detect_document_type(full_text)
    if doc_type and 'raw' in metadata:
        metadata['detected_type'] = doc_type
    else:
        metadata.update({'detected_type': doc_type})

    result = OCRResult(page_texts=page_texts, metadata=metadata, confidences=page_confs)
    # cache summary
    try:
        if cache_key:
            sync_set(cache_key, {'page_texts': page_texts, 'metadata': metadata, 'confidences': page_confs}, ttl=int(3600))
    except Exception:
        pass

    return result


def summarize_ocr_result(res: OCRResult) -> Dict[str, Any]:
    text = "\n".join(res.page_texts)
    conf = compute_confidence_from_list(res.confidences)
    return {
        'extracted_text': text,
        'metadata': res.metadata,
        'confidence': conf,
    }
