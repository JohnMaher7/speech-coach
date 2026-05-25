from typing import Any

from deepgram import AsyncDeepgramClient

from app.config import settings
from app.r2 import presign_get
from app.schemas import Transcript, Utterance, Word

_dg = AsyncDeepgramClient(api_key=settings.deepgram_api_key)


async def transcribe(audio_key: str) -> Transcript:
    audio_url = presign_get(audio_key)

    response = await _dg.listen.v1.media.transcribe_url(
        url=audio_url,
        model="nova-3",
        language="en",
        smart_format=True,
        punctuate=True,
        filler_words=True,
        # Sentence boundaries for Stage 26's `build_segments`. `paragraphs=True`
        # gives us sentence start/end inside paragraph[].sentences[]; the SDK
        # passes it through as extras on the Pydantic alternative.
        paragraphs=True,
        utterances=True,
    )

    duration = float(response.metadata.duration)
    alt = response.results.channels[0].alternatives[0]

    words = [
        Word(
            text=(w.punctuated_word or w.word or ""),
            start=float(w.start or 0.0),
            end=float(w.end or 0.0),
            confidence=float(w.confidence or 0.0),
        )
        for w in (alt.words or [])
    ]

    utterances = _extract_utterances(response, alt)

    return Transcript(
        text=alt.transcript or "",
        words=words,
        duration_sec=duration,
        utterances=utterances,
    )


def _extract_utterances(response: Any, alt: Any) -> list[Utterance]:
    """Pull sentence-level boundaries out of Deepgram's response. The
    SDK's typed schema does not expose `paragraphs` / `utterances`, but
    they arrive on the underlying model via `extra="allow"` — read both,
    prefer paragraph-sentences (finer-grained), fall back to utterances."""

    sentences = _sentences_from_paragraphs(alt)
    if sentences:
        return sentences

    raw = getattr(response.results, "utterances", None) or getattr(
        response, "utterances", None
    )
    if not raw:
        return []
    out: list[Utterance] = []
    for item in raw:
        start, end, text = _get_span(item)
        if text and end > start:
            out.append(Utterance(start=start, end=end, text=text))
    return out


def _sentences_from_paragraphs(alt: Any) -> list[Utterance]:
    paragraphs = getattr(alt, "paragraphs", None)
    if not paragraphs:
        return []
    paragraph_list = (
        getattr(paragraphs, "paragraphs", None)
        if not isinstance(paragraphs, dict)
        else paragraphs.get("paragraphs")
    )
    if not paragraph_list:
        return []
    out: list[Utterance] = []
    for para in paragraph_list:
        sentences = (
            getattr(para, "sentences", None)
            if not isinstance(para, dict)
            else para.get("sentences")
        ) or []
        for s in sentences:
            start, end, text = _get_span(s)
            if text and end > start:
                out.append(Utterance(start=start, end=end, text=text))
    return out


def _get_span(obj: Any) -> tuple[float, float, str]:
    def _get(key: str) -> Any:
        if isinstance(obj, dict):
            return obj.get(key)
        return getattr(obj, key, None)

    start = float(_get("start") or 0.0)
    end = float(_get("end") or 0.0)
    text = (_get("text") or _get("transcript") or "").strip()
    return start, end, text
