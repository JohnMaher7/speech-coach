from deepgram import AsyncDeepgramClient

from app.config import settings
from app.r2 import presign_get
from app.schemas import Transcript, Word

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
    )

    duration = float(response.metadata.duration)
    alt = response.results.channels[0].alternatives[0]

    words = [
        Word(
            text=w.word or "",
            start=float(w.start or 0.0),
            end=float(w.end or 0.0),
            confidence=float(w.confidence or 0.0),
        )
        for w in (alt.words or [])
    ]

    return Transcript(
        text=alt.transcript or "",
        words=words,
        duration_sec=duration,
    )
