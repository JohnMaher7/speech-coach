"""Stage 29 bumped the persisted report schema to v2; Stage 31 bumped to v3
(robust pitch) then v4 (intensity dynamics dropped — phonetic variation and
uncalibrated recording levels made the metric unreliable). The `/reports/{id}`
endpoint returns 410 Gone for anything not at the current `schema_version`.

These tests pin two things:

1. A canonical current-version payload validates cleanly.
2. The structured-output rules baked into the new `CategoryScore` validator
   actually fire — sub-5 scores need evidence, `"n/a"` needs a reason.
"""

import pytest
from pydantic import ValidationError

from app.schemas import CategoryScore, Report


def _v4_payload() -> dict:
    return {
        "report_id": "test-123",
        "audio_key": "uploads/test.mp3",
        "created_at": "2026-05-17T12:00:00+00:00",
        "duration_sec": 30.0,
        "schema_version": 4,
        "transcript": {
            "text": "hello world",
            "words": [
                {"text": "hello", "start": 0.0, "end": 0.4, "confidence": 0.99},
                {"text": "world", "start": 0.5, "end": 0.9, "confidence": 0.99},
            ],
            "duration_sec": 30.0,
        },
        "acoustic": {
            "timeline": [],
            "pauses": [],
            "pitch_mean_hz": 120.0,
            "pitch_std_hz": 25.0,
            "pitch_std_st": 2.5,
            "segments": [],
        },
        "metrics": {
            "wpm": 140.0,
            "fillers": [],
            "filler_per_min": 0.0,
            "long_pauses": 0,
            "monotone_score": 0.4,
        },
        "synthesis": {
            "headline": "Solid speech overall.",
            "message_sentence": "Hello world.",
            "walkthrough": {
                "opening": {
                    "start_t": 0.0,
                    "end_t": 5.0,
                    "observation": "Opens with hello world.",
                    "praise": None,
                    "critique": None,
                    "quote_t": None,
                },
                "body": [],
                "close": {
                    "start_t": 25.0,
                    "end_t": 30.0,
                    "observation": "Closes cleanly.",
                    "praise": None,
                    "critique": None,
                    "quote_t": None,
                },
            },
            "categories": {
                "hook": {
                    "score": 5,
                    "rationale": "Clean opening hook.",
                    "evidence": [],
                    "applicability_reason": None,
                },
                "message_focus": {
                    "score": 4,
                    "rationale": "Clear single idea.",
                    "evidence": [{"quote": "hello world", "t": 0.0}],
                    "applicability_reason": None,
                },
                "structure": {
                    "score": 5,
                    "rationale": "Three-act arc.",
                    "evidence": [],
                    "applicability_reason": None,
                },
                "closing": {
                    "score": "n/a",
                    "rationale": "Snippet too short to evaluate.",
                    "evidence": [],
                    "applicability_reason": "Recording is only 30 seconds with no concluding section.",
                },
                "pacing": {
                    "score": 5,
                    "rationale": "Lands in the ideal band.",
                    "evidence": [],
                    "applicability_reason": None,
                },
                "pauses": {
                    "score": 5,
                    "rationale": "Deliberate pauses on key words.",
                    "evidence": [],
                    "applicability_reason": None,
                },
                "vocal_variety": {
                    "score": 3,
                    "rationale": "Moderate pitch range.",
                    "evidence": [{"quote": "hello world", "t": 0.0}],
                    "applicability_reason": None,
                },
                "language": {
                    "score": 5,
                    "rationale": "Clean phrasing throughout.",
                    "evidence": [],
                    "applicability_reason": None,
                },
            },
            "delivery_habits": {
                "fillers": None,
                "pauses": None,
                "pace": None,
                "vocal_variety": {
                    "score": 3,
                    "summary": "Pitch range could be wider.",
                    "examples": [{"quote": "hello world", "t": 0.0}],
                    "counts": [],
                },
                "language": None,
            },
            "priorities": [
                {
                    "title": "Lift pitch on key words",
                    "observation": "Pitch range is narrow.",
                    "example_quote": "hello world",
                    "example_t": 0.0,
                    "why_it_matters": "Listeners track emphasis through pitch.",
                    "drill": "Rehearse the opening with a clear lift on 'hello'.",
                },
                {
                    "title": "Add a stronger close",
                    "observation": "Closing fades.",
                    "example_quote": "hello world",
                    "example_t": 0.5,
                    "why_it_matters": "The last sentence is what the audience remembers.",
                    "drill": "Write three alternative closing lines and try each aloud.",
                },
            ],
            "rewrites": [
                {"original": "hello world", "suggested": "Hello, world.", "why": "Punctuation gives the line rhythm."},
            ],
        },
        "verification": {"passed": True, "issues": []},
        "overall": {
            "score": 4.2,
            "weights_version": 1,
            "weights": {
                "message_focus": 0.18,
                "structure": 0.15,
                "hook": 0.10,
                "closing": 0.10,
                "pacing": 0.10,
                "pauses": 0.10,
                "vocal_variety": 0.10,
                "language": 0.07,
            },
            "applicable_categories": [
                "hook",
                "message_focus",
                "structure",
                "pacing",
                "pauses",
                "vocal_variety",
                "language",
            ],
        },
        "cost": {"total_usd": 0.013},
    }


def test_v4_payload_validates_and_round_trips():
    report = Report.model_validate(_v4_payload())
    assert report.schema_version == 4
    assert report.cost is not None
    assert report.cost.total_usd == 0.013
    assert report.synthesis.categories.closing.score == "n/a"
    assert report.synthesis.categories.closing.applicability_reason is not None
    assert len(report.synthesis.priorities) == 2
    assert report.synthesis.delivery_habits.fillers is None
    assert report.synthesis.delivery_habits.vocal_variety is not None
    assert report.verification.passed is True
    assert report.verification.issues == []


def test_sub_five_score_without_evidence_is_rejected():
    with pytest.raises(ValidationError):
        CategoryScore.model_validate(
            {
                "score": 3,
                "rationale": "Decent.",
                "evidence": [],
                "applicability_reason": None,
            }
        )


def test_na_without_applicability_reason_is_rejected():
    with pytest.raises(ValidationError):
        CategoryScore.model_validate(
            {
                "score": "n/a",
                "rationale": "Inapplicable.",
                "evidence": [],
                "applicability_reason": None,
            }
        )


def test_five_score_with_empty_evidence_is_fine():
    cat = CategoryScore.model_validate(
        {
            "score": 5,
            "rationale": "Excellent.",
            "evidence": [],
            "applicability_reason": None,
        }
    )
    assert cat.score == 5
