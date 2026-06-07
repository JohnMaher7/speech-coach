"""Silent pipeline orchestrator.

Mirrors the orchestration in `main.py`'s `/analyze` block, minus SSE events and
the database write. Used by the eval harness in `apps/api/eval/run.py` so it
can run cases through the full pipeline (or just the synthesis tail) without
spinning up an HTTP server.

Note on duplication: roughly thirty lines of orchestration are intentionally
duplicated between this module and `main.py`. Consolidating would mean
restructuring how SSE events thread through the orchestrator — a separate
refactor. If you add a step to the pipeline, add it to both places and keep
this comment honest.
"""

import asyncio
import logging
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from deepgram import AsyncDeepgramClient

from app.acoustic import AcousticFeatures, analyze_audio
from app.config import settings
from app.lexical_fillers import detect_lexical_fillers
from app.metrics import build_acoustic, compute_metrics
from app.r2 import download_to_tempfile
from app.schemas import (
    FillerHit,
    LlmCost,
    Report,
    SpeechType,
    Transcript,
    Utterance,
    Word,
)
from app.scoring import compute_overall
from app.synthesize import synthesize
from app.transcribe import _extract_utterances, transcribe
from app.verify import verify

logger = logging.getLogger(__name__)

_dg = AsyncDeepgramClient(api_key=settings.deepgram_api_key)


async def run_pipeline(
    *,
    audio_key: str | None = None,
    audio_path: Path | None = None,
    speech_type: SpeechType | None = None,
) -> Report:
    """Run the full pipeline and return a Report. No SSE, no DB write.

    Exactly one of `audio_key` (R2 object key) or `audio_path` (local file)
    must be provided. The eval harness uses the local-path mode so the seed
    audio fixture is portable; production traffic goes through `audio_key`
    via `main.py`.
    """

    if (audio_key is None) == (audio_path is None):
        raise ValueError("Exactly one of audio_key, audio_path must be provided")

    if audio_path is not None:
        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {path}")
        transcript = await _transcribe_from_path(path)
        features = await asyncio.to_thread(analyze_audio, str(path))
    else:
        assert audio_key is not None
        transcript = await transcribe(audio_key)
        features = await _run_acoustic_from_key(audio_key)

    try:
        lex_hits, lex_cost = await detect_lexical_fillers(transcript)
    except Exception:
        logger.exception("lexical filler pass failed; continuing without it")
        lex_hits, lex_cost = [], 0.0

    acoustic = build_acoustic(transcript, features)
    metrics = compute_metrics(
        transcript,
        features,
        segments=acoustic.segments,
        lexical_fillers=lex_hits,
    )

    synthesis, synth_cost = await synthesize(
        transcript, acoustic, metrics, speech_type=speech_type
    )
    overall = compute_overall(synthesis.categories, speech_type)
    verification = verify(synthesis, transcript)

    cost = LlmCost(
        total_usd=round(synth_cost + lex_cost, 6),
        synthesis_usd=round(synth_cost, 6),
        lexical_fillers_usd=round(lex_cost, 6),
    )

    return Report(
        report_id=str(uuid4()),
        audio_key=audio_key or f"local://{audio_path}",
        created_at=datetime.now(UTC),
        duration_sec=transcript.duration_sec,
        speech_type=speech_type,
        transcript=transcript,
        acoustic=acoustic,
        metrics=metrics,
        synthesis=synthesis,
        verification=verification,
        overall=overall,
        cost=cost,
    )


async def _transcribe_from_path(path: Path) -> Transcript:
    """Local-file analogue of `transcribe()`. Uses Deepgram's file-upload mode
    so the eval doesn't have to round-trip audio through R2 just to test the
    transcription stage."""

    audio_bytes = await asyncio.to_thread(path.read_bytes)

    response = await _dg.listen.v1.media.transcribe_file(
        request=audio_bytes,
        model="nova-3",
        language="en",
        smart_format=True,
        punctuate=True,
        filler_words=True,
        paragraphs=True,
        utterances=True,
    )

    duration = float(response.metadata.duration)
    alt = response.results.channels[0].alternatives[0]

    words: list[Word] = [
        Word(
            text=(w.punctuated_word or w.word or ""),
            start=float(w.start or 0.0),
            end=float(w.end or 0.0),
            confidence=float(w.confidence or 0.0),
        )
        for w in (alt.words or [])
    ]

    utterances: list[Utterance] = _extract_utterances(response, alt)

    return Transcript(
        text=alt.transcript or "",
        words=words,
        duration_sec=duration,
        utterances=utterances,
    )


async def _run_acoustic_from_key(key: str) -> AcousticFeatures:
    async with download_to_tempfile(key) as audio_path:
        return await asyncio.to_thread(analyze_audio, audio_path)


__all__ = ["run_pipeline"]
