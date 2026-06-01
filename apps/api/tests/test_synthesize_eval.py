"""Eval-set tests for `synthesize`. These hit the real Claude API and are
gated behind `pytest -m eval`.

Stage 29 rewrote the synthesis schema. The assertions here target the v2
shape (`result.categories.<key>`, `result.priorities`, `result.headline`)
and verify the evidence rule holds end-to-end: any sub-5 category score
comes back with at least one `Evidence` quote attached.
"""

import logging

import pytest

from app.schemas import Acoustic
from app.synthesize import synthesize

from tests.fixtures import CLEAN_PACED, FILLERY_FAST, MONOTONE_STRUCTURED, GoldenCase

pytestmark = pytest.mark.eval

logger = logging.getLogger(__name__)


# Empty Acoustic is fine here — `build_annotated_transcript` falls back to the
# raw transcript when no segments are supplied. The eval still exercises the
# new prompt and validates the structured output; it just won't carry rich
# prosody markers. The full pipeline supplies real segments.
_EMPTY_ACOUSTIC = Acoustic(
    timeline=[],
    pauses=[],
    pitch_mean_hz=0.0,
    pitch_std_hz=0.0,
    pitch_std_st=0.0,
)


async def _run(case: GoldenCase):
    result, _ = await synthesize(case.transcript, _EMPTY_ACOUSTIC, case.metrics)
    return result


def _norm(s: str) -> str:
    """Collapse whitespace so a rewrite that re-spaces a quote still matches."""
    return " ".join(s.split())


def _assert_rewrites_quote_the_transcript(result, transcript_text: str) -> None:
    """Every rewrite's `original` must be a (whitespace-normalised) slice of the transcript."""
    haystack = _norm(transcript_text)
    for rw in result.rewrites:
        assert _norm(rw.original) in haystack, (
            f"rewrite `original` not verbatim in transcript: {rw.original!r}"
        )
        assert rw.suggested and rw.why, f"rewrite missing suggested/why: {rw}"


def _assert_evidence_rule(result) -> None:
    """Every sub-5 integer score must carry at least one Evidence quote.
    The CategoryScore validator enforces this, but asserting in the eval
    catches a regression where the prompt drifts the model into producing
    payloads that bypass validation (e.g. score == 5 to avoid evidence)."""
    for name, cat in result.categories.model_dump().items():
        score = cat["score"]
        if isinstance(score, int) and score < 5:
            assert len(cat["evidence"]) >= 1, (
                f"category {name!r} scored {score} but has no evidence"
            )


async def test_fillery_fast_speech_scores_low_on_language_and_pacing():
    result = await _run(FILLERY_FAST)

    # `language` is the new home for filler-driven scoring.
    assert result.categories.language.score in {1, 2}, (
        f"language.score={result.categories.language.score}: {result.categories.language.rationale}"
    )
    pacing = result.categories.pacing.score
    assert pacing in {1, 2, 3}, (
        f"pacing.score={pacing}: {result.categories.pacing.rationale}"
    )
    assert 2 <= len(result.priorities) <= 3
    rationale = result.categories.language.rationale.lower()
    assert any(kw in rationale for kw in ("um", "uh", "like", "filler", "hedge"))
    _assert_rewrites_quote_the_transcript(result, FILLERY_FAST.transcript.text)
    _assert_evidence_rule(result)


async def test_clean_paced_speech_scores_high_on_language_and_pacing():
    result = await _run(CLEAN_PACED)

    assert result.categories.language.score in {4, 5}, (
        f"language.score={result.categories.language.score}: {result.categories.language.rationale}"
    )
    assert result.categories.pacing.score in {4, 5}, (
        f"pacing.score={result.categories.pacing.score}: {result.categories.pacing.rationale}"
    )
    assert 2 <= len(result.priorities) <= 3
    _assert_rewrites_quote_the_transcript(result, CLEAN_PACED.transcript.text)
    _assert_evidence_rule(result)


async def test_monotone_structured_speech_calls_out_pitch():
    result = await _run(MONOTONE_STRUCTURED)

    # Flat in BOTH channels (monotone_score 0.82, volume_range_db 3.0 — under
    # the flat-< 4 cutoff). The volume number must NOT rescue the flat pitch.
    vv = result.categories.vocal_variety.score
    assert isinstance(vv, int) and vv <= 2, (
        f"vocal_variety.score={vv}: {result.categories.vocal_variety.rationale}"
    )
    # Structure is clear (signposts, three-point list) — should score well.
    assert result.categories.structure.score in {4, 5}, (
        f"structure.score={result.categories.structure.score}: {result.categories.structure.rationale}"
    )
    rationale = result.categories.vocal_variety.rationale.lower()
    assert any(
        kw in rationale
        for kw in ("pitch", "monoton", "flat", "narrow", "volume", "energy")
    ), (
        f"vocal_variety rationale must reference the flat delivery: {result.categories.vocal_variety.rationale}"
    )
    _assert_rewrites_quote_the_transcript(result, MONOTONE_STRUCTURED.transcript.text)
    _assert_evidence_rule(result)
