"""Tests for the Haiku lexical-filler pass.

We mock the Anthropic client to keep these tests offline. The interesting
behaviour to pin down is the merge with token-matched fillers — specifically
that the same word used as a filler and as content (e.g. "like" twice in
"we were like ready to go, and she flew like a bird") only gets flagged on
the filler use, and that lexical hits dedupe against token hits when they
land within 50 ms of each other.
"""

import json
from dataclasses import dataclass

import pytest

from app import lexical_fillers
from app.metrics import _merge_fillers
from app.schemas import FillerHit, Transcript, Word


@dataclass
class _StubBlock:
    type: str
    text: str


@dataclass
class _StubUsage:
    input_tokens: int
    output_tokens: int
    cache_creation_input_tokens: int | None
    cache_read_input_tokens: int | None


@dataclass
class _StubResponse:
    content: list[_StubBlock]
    usage: _StubUsage
    stop_reason: str = "end_turn"


def _stub_messages_create(payload: dict):
    text = json.dumps(payload)

    async def _create(**_kwargs):
        return _StubResponse(
            content=[_StubBlock(type="text", text=text)],
            usage=_StubUsage(
                input_tokens=100,
                output_tokens=20,
                cache_creation_input_tokens=0,
                cache_read_input_tokens=0,
            ),
        )

    return _create


async def test_lexical_filler_only_flags_filler_use_of_like(monkeypatch):
    # "We were like ready to go" — `like` is a verbal pause filler.
    # "she flew like a bird" — `like` is a comparison, not a filler.
    transcript = Transcript(
        text="we were like ready to go and she flew like a bird",
        words=[
            Word(text="we", start=0.0, end=0.2, confidence=0.99),
            Word(text="were", start=0.3, end=0.5, confidence=0.99),
            Word(text="like", start=0.6, end=0.8, confidence=0.95),
            Word(text="ready", start=0.9, end=1.2, confidence=0.99),
            Word(text="to", start=1.3, end=1.4, confidence=0.99),
            Word(text="go", start=1.5, end=1.7, confidence=0.99),
            Word(text="and", start=1.9, end=2.0, confidence=0.99),
            Word(text="she", start=2.1, end=2.3, confidence=0.99),
            Word(text="flew", start=2.4, end=2.7, confidence=0.99),
            Word(text="like", start=2.8, end=3.0, confidence=0.99),
            Word(text="a", start=3.1, end=3.2, confidence=0.99),
            Word(text="bird", start=3.3, end=3.7, confidence=0.99),
        ],
        duration_sec=4.0,
    )

    # Pretend the model picked only the first `like`.
    monkeypatch.setattr(
        lexical_fillers._client.messages,
        "create",
        _stub_messages_create(
            {
                "fillers": [
                    {"word": "like", "t": 0.6, "category": "verbal_pause"},
                ]
            }
        ),
    )

    hits, cost = await lexical_fillers.detect_lexical_fillers(transcript)
    assert cost > 0.0
    assert len(hits) == 1
    assert hits[0].word == "like"
    assert hits[0].t == pytest.approx(0.6)
    assert hits[0].category == "verbal_pause"


def test_merge_fillers_prefers_token_hit_when_within_dedupe_window():
    # Token pass already caught the "um" at t=0.50; the lexical pass returns
    # a near-identical timestamp (0.53 — within 50 ms). The token hit wins
    # so the category stays "interjection", not "verbal_pause".
    token_hits = [FillerHit(word="um", t=0.50, category="interjection")]
    lexical_hits = [FillerHit(word="um", t=0.53, category="verbal_pause")]

    merged = _merge_fillers(token_hits, lexical_hits)
    assert len(merged) == 1
    assert merged[0].category == "interjection"


def test_merge_fillers_keeps_lexical_hit_outside_dedupe_window():
    token_hits = [FillerHit(word="um", t=0.50, category="interjection")]
    # Different timestamp, far outside the 50 ms window → both kept.
    lexical_hits = [FillerHit(word="um", t=2.00, category="verbal_pause")]

    merged = _merge_fillers(token_hits, lexical_hits)
    assert [h.t for h in merged] == [0.5, 2.0]
    assert [h.category for h in merged] == ["interjection", "verbal_pause"]


def test_merge_fillers_sorts_by_time():
    token_hits = [FillerHit(word="uh", t=5.0, category="interjection")]
    lexical_hits = [
        FillerHit(word="like", t=2.0, category="verbal_pause"),
        FillerHit(word="kind of", t=8.0, category="hedge"),
    ]
    merged = _merge_fillers(token_hits, lexical_hits)
    assert [h.t for h in merged] == [2.0, 5.0, 8.0]


async def test_detect_lexical_fillers_empty_transcript_returns_empty():
    transcript = Transcript(text="", words=[], duration_sec=0.0)
    hits, cost = await lexical_fillers.detect_lexical_fillers(transcript)
    assert hits == []
    assert cost == 0.0
