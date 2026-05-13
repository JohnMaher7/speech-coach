import logging

import pytest

from app.synthesize import synthesize

from tests.fixtures import CLEAN_PACED, FILLERY_FAST, MONOTONE_STRUCTURED, GoldenCase

pytestmark = pytest.mark.eval

logger = logging.getLogger(__name__)


async def _run(case: GoldenCase):
    result, _ = await synthesize(case.transcript, case.metrics)
    return result


def _norm(s: str) -> str:
    """Collapse whitespace so a rewrite that re-spaces a quote still matches."""
    return " ".join(s.split())


def _assert_rewrites_quote_the_transcript(result, transcript_text: str) -> None:
    """Every rewrite's `original` must be a (whitespace-normalised) slice of the transcript."""
    assert len(result.rewrites) >= 2, (
        f"expected >= 2 rewrites, got {len(result.rewrites)}: {result.rewrites}"
    )
    haystack = _norm(transcript_text)
    for rw in result.rewrites:
        assert _norm(rw.original) in haystack, (
            f"rewrite `original` not verbatim in transcript: {rw.original!r}"
        )
        assert rw.suggested and rw.why, f"rewrite missing suggested/why: {rw}"


async def test_fillery_fast_speech_scores_low_on_fillers_and_pacing():
    result = await _run(FILLERY_FAST)

    assert result.fillers.score <= 2, (
        f"fillers.score={result.fillers.score}: {result.fillers.rationale}"
    )
    assert result.pacing.score <= 3, (
        f"pacing.score={result.pacing.score}: {result.pacing.rationale}"
    )
    assert len(result.top_actions) == 3
    rationale = result.fillers.rationale.lower()
    assert any(kw in rationale for kw in ("um", "uh", "like", "filler"))
    _assert_rewrites_quote_the_transcript(result, FILLERY_FAST.transcript.text)


async def test_clean_paced_speech_scores_high_on_fillers_and_pacing():
    result = await _run(CLEAN_PACED)

    assert result.fillers.score >= 4, (
        f"fillers.score={result.fillers.score}: {result.fillers.rationale}"
    )
    assert result.pacing.score >= 4, (
        f"pacing.score={result.pacing.score}: {result.pacing.rationale}"
    )
    assert len(result.top_actions) == 3
    _assert_rewrites_quote_the_transcript(result, CLEAN_PACED.transcript.text)


async def test_monotone_structured_speech_calls_out_pitch():
    result = await _run(MONOTONE_STRUCTURED)

    assert result.vocal_variety.score <= 2, (
        f"vocal_variety.score={result.vocal_variety.score}: {result.vocal_variety.rationale}"
    )
    # Structure is clear (signposts, three-point list) — should score well.
    assert result.structure.score >= 4, (
        f"structure.score={result.structure.score}: {result.structure.rationale}"
    )
    rationale = result.vocal_variety.rationale.lower()
    assert any(kw in rationale for kw in ("pitch", "monoton", "flat", "narrow")), (
        f"vocal_variety rationale must reference pitch/monotone: {result.vocal_variety.rationale}"
    )
    _assert_rewrites_quote_the_transcript(result, MONOTONE_STRUCTURED.transcript.text)
