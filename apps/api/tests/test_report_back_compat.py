"""Old `Report` payloads in Postgres carry fields we no longer model
(`evidence`, the multi-field `LlmCost` shape). `Report.model_validate(row.payload)`
must keep working — Pydantic's default config ignores unknown keys, and these
tests pin that property so a future `extra="forbid"` regression breaks loudly.
"""

from app.schemas import Report


def _new_payload() -> dict:
    return {
        "report_id": "test-123",
        "audio_key": "uploads/test.mp3",
        "created_at": "2026-05-11T12:00:00+00:00",
        "duration_sec": 30.0,
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
        },
        "metrics": {
            "wpm": 140.0,
            "fillers": [],
            "filler_per_min": 0.0,
            "long_pauses": 0,
            "monotone_score": 0.4,
        },
        "synthesis": {
            "fillers": {"score": 5, "rationale": "clean"},
            "pacing": {"score": 4, "rationale": "good"},
            "vocal_variety": {"score": 3, "rationale": "ok"},
            "structure": {"score": 4, "rationale": "clear"},
            "top_actions": [
                {"title": "A", "detail": "do a"},
                {"title": "B", "detail": "do b"},
                {"title": "C", "detail": "do c"},
            ],
            "rewrites": [
                {"original": "hello world", "suggested": "hi world", "why": "shorter"},
            ],
            "summary": "ok",
        },
        "cost": {"total_usd": 0.013},
    }


def test_old_payload_with_evidence_and_legacy_cost_still_validates():
    payload = _new_payload()
    # Legacy fields produced by stage-23 two-pass code:
    payload["evidence"] = {
        "opening": "hello world",
        "closing": "hello world",
        "thesis": None,
        "signposts": [],
        "notable_quotes": [],
        "filler_examples": [],
    }
    payload["cost"] = {
        "extract_usd": 0.003,
        "synthesize_usd": 0.014,
        "total_usd": 0.017,
    }

    report = Report.model_validate(payload)

    # Legacy `evidence` key is silently dropped (model no longer has the field).
    assert not hasattr(report, "evidence")
    # The persisted `total_usd` from the legacy cost shape survives.
    assert report.cost is not None
    assert report.cost.total_usd == 0.017


def test_new_payload_validates():
    report = Report.model_validate(_new_payload())
    assert report.cost is not None
    assert report.cost.total_usd == 0.013
    assert len(report.synthesis.rewrites) == 1
    assert report.synthesis.rewrites[0].original == "hello world"
