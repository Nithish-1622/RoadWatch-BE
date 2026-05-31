from typing import Dict, Any

from .inference import infer_text, transcribe_audio


def analyze_text(text: str) -> Dict[str, Any]:
    return infer_text(text)

