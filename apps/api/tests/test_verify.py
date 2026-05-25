"""Tests for `app.verify`. We cover three layers:

1. `normalise` collapses case, punctuation, and whitespace as expected.
2. `find_quote` accepts good and whitespace-mangled quotes and rejects
   wholly invented ones, with the 0.85 ratio threshold honoured.
3. The full `verify(synthesis, transcript)` flow flags the four issue
   kinds from the spec — `quote_not_found`, `timestamp_out_of_range`,
   and `missing_evidence` — and passes a clean synthesis cleanly.

The "missing evidence" case needs `CategoryScore.model_construct` to
bypass the schema-level validator that would otherwise block a sub-5
score with empty evidence at construction time. That's the *point* of
the verification layer: it's defence in depth, not a duplicate of the
schema check, and the test deliberately exercises that path."""

from app.schemas import (
    Beat,
    Categories,
    CategoryScore,
    DeliveryHabits,
    Evidence,
    Priority,
    Synthesis,
    Transcript,
    Walkthrough,
    Word,
)
from app.verify import QUOTE_MATCH_THRESHOLD, find_quote, normalise, verify

_TRANSCRIPT_TEXT = (
    "Today I want to talk about the power of compounding. "
    "Small steady habits beat big bursts every time. "
    "Start now, stay steady, and let time do the work."
)
_DURATION = 30.0


def _transcript() -> Transcript:
    return Transcript(
        text=_TRANSCRIPT_TEXT,
        words=[
            Word(text="Today", start=0.0, end=0.4, confidence=0.99),
            Word(text="now", start=20.0, end=20.3, confidence=0.99),
        ],
        duration_sec=_DURATION,
    )


def _ev(quote: str, t: float) -> Evidence:
    return Evidence(quote=quote, t=t)


def _cat(score, evidence: list[Evidence] | None = None) -> CategoryScore:
    return CategoryScore(
        score=score,
        rationale="rationale",
        evidence=evidence or [],
        applicability_reason=None,
    )


def _bare_beat(t: float) -> Beat:
    return Beat(
        start_t=t,
        end_t=t + 1.0,
        observation="obs",
        praise=None,
        critique=None,
        quote_t=None,
    )


def _synthesis(categories: Categories, priorities: list[Priority]) -> Synthesis:
    return Synthesis(
        headline="A headline.",
        message_sentence="Compound steadily.",
        walkthrough=Walkthrough(
            opening=_bare_beat(0.0), body=[], close=_bare_beat(25.0)
        ),
        categories=categories,
        delivery_habits=DeliveryHabits(
            fillers=None, pauses=None, pace=None, vocal_variety=None, language=None
        ),
        priorities=priorities,
        rewrites=[],
    )


# ---- normalise / find_quote ------------------------------------------------


def test_normalise_lowercases_strips_punctuation_collapses_whitespace():
    assert normalise("The   Power, of\nCompounding!") == "the power of compounding"


def test_find_quote_resolves_clean_substring():
    hit = find_quote("the power of compounding", _TRANSCRIPT_TEXT)
    assert hit is not None
    _, _, ratio = hit
    assert ratio >= QUOTE_MATCH_THRESHOLD


def test_find_quote_resolves_whitespace_and_punctuation_mangled_quote():
    """Mid-quote whitespace + punctuation should not defeat the matcher."""
    mangled = "The   POWER, of\ncompounding!"
    assert find_quote(mangled, _TRANSCRIPT_TEXT) is not None


def test_find_quote_rejects_invented_phrase():
    assert find_quote("supercalifragilistic explosion", _TRANSCRIPT_TEXT) is None


# ---- verify() --------------------------------------------------------------


def _all_five_categories(overrides: dict[str, CategoryScore] | None = None) -> Categories:
    defaults: dict[str, CategoryScore] = {
        name: _cat(5)
        for name in (
            "hook",
            "message_focus",
            "structure",
            "closing",
            "pacing",
            "pauses",
            "vocal_variety",
            "language",
        )
    }
    if overrides:
        defaults.update(overrides)
    return Categories(**defaults)


def _priority(quote: str, t: float) -> Priority:
    return Priority(
        title="Title",
        observation="obs",
        example_quote=quote,
        example_t=t,
        why_it_matters="why",
        drill="drill",
    )


def test_clean_synthesis_verifies():
    categories = _all_five_categories(
        {"message_focus": _cat(4, [_ev("the power of compounding", 5.0)])}
    )
    syn = _synthesis(
        categories,
        priorities=[_priority("Start now, stay steady", 20.0)],
    )

    result = verify(syn, _transcript())
    assert result.passed is True
    assert result.issues == []


def test_verify_flags_invented_quote_out_of_range_t_and_missing_evidence():
    # One good evidence (whitespace-mangled to confirm the matcher tolerates
    # it), one invented quote, one in-range-quote with an out-of-range t.
    good = _cat(4, [_ev("the   power, of\nCompounding!", 5.0)])
    invented = _cat(4, [_ev("a totally invented phrase nobody said", 6.0)])
    bad_t = _cat(4, [_ev("Small steady habits", 999.0)])
    # `model_construct` skips CategoryScore's `mode="after"` validator. Pydantic
    # re-runs that validator when the instance is assigned to a `CategoryScore`
    # field, so we also have to build the surrounding `Categories` with
    # `model_construct` to keep the bad instance intact. That's the whole point
    # — the verify layer needs to catch faults the schema alone would block.
    no_evidence = CategoryScore.model_construct(
        score=3, rationale="empty", evidence=[], applicability_reason=None
    )

    categories = Categories.model_construct(
        hook=_cat(5),
        message_focus=good,
        structure=_cat(5),
        closing=invented,
        pacing=bad_t,
        pauses=no_evidence,
        vocal_variety=_cat(5),
        language=_cat(5),
    )
    syn = _synthesis(
        categories,
        priorities=[_priority("Start now, stay steady", 20.0)],
    )

    result = verify(syn, _transcript())

    assert result.passed is False

    locations_by_kind: dict[str, set[str]] = {}
    for issue in result.issues:
        locations_by_kind.setdefault(issue.kind, set()).add(issue.location)

    assert "categories.closing.evidence[0]" in locations_by_kind["quote_not_found"]
    assert "categories.pacing.evidence[0]" in locations_by_kind["timestamp_out_of_range"]
    assert "categories.pauses" in locations_by_kind["missing_evidence"]

    # The whitespace-mangled good evidence must NOT show up as a failure.
    assert "categories.message_focus.evidence[0]" not in locations_by_kind.get(
        "quote_not_found", set()
    )


def test_verify_flags_priority_quote_and_timestamp():
    categories = _all_five_categories()
    syn = _synthesis(
        categories,
        priorities=[
            _priority("Start now, stay steady", 20.0),
            _priority("nobody ever said this line", 5.0),
            _priority("the power of compounding", 9_999.0),
        ],
    )

    result = verify(syn, _transcript())
    assert result.passed is False

    kinds_at = {(i.kind, i.location) for i in result.issues}
    assert ("quote_not_found", "priorities[1]") in kinds_at
    assert ("timestamp_out_of_range", "priorities[2]") in kinds_at
    # The first priority is clean.
    assert ("quote_not_found", "priorities[0]") not in kinds_at
    assert ("timestamp_out_of_range", "priorities[0]") not in kinds_at
