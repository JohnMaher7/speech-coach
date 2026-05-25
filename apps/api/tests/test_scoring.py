"""Unit tests for the weighted overall score introduced in Stage 31.

Three things matter:

- the default weight profile sums to 1.0 (so `score` lands on the 1-5 scale);
- an `"n/a"` category drops out cleanly and its weight is redistributed
  proportionally across the survivors;
- the impromptu profile excludes `closing` entirely.
"""

from typing import Literal

import pytest

from app.schemas import CategoryScore, CategoryScoreValue
from app.scoring import WEIGHTS_VERSION, _BASE_WEIGHTS, _profile_for, compute_overall


CategoryKey = Literal[
    "hook",
    "message_focus",
    "structure",
    "closing",
    "pacing",
    "pauses",
    "vocal_variety",
    "language",
]


def _cat(score: CategoryScoreValue) -> CategoryScore:
    """Build a CategoryScore with the minimum fields each branch of the
    validator requires."""

    if score == "n/a":
        return CategoryScore.model_construct(
            score=score,
            rationale="",
            evidence=[],
            applicability_reason="not applicable",
        )
    if isinstance(score, int) and score < 5:
        return CategoryScore.model_construct(
            score=score,
            rationale="",
            evidence=[],
            applicability_reason=None,
        )
    return CategoryScore.model_construct(
        score=score,
        rationale="",
        evidence=[],
        applicability_reason=None,
    )


def _categories(**overrides: CategoryScoreValue):
    """Build a `Categories` with score-only inputs; everything else stub.
    `model_construct` bypasses validators so we can mix `"n/a"` freely."""

    from app.schemas import Categories

    base: dict[str, CategoryScoreValue] = {
        "hook": 3,
        "message_focus": 3,
        "structure": 3,
        "closing": 3,
        "pacing": 3,
        "pauses": 3,
        "vocal_variety": 3,
        "language": 3,
    }
    base.update(overrides)
    return Categories.model_construct(**{k: _cat(v) for k, v in base.items()})


def test_default_weights_sum_to_one():
    assert sum(_BASE_WEIGHTS.values()) == pytest.approx(1.0, abs=1e-9)


@pytest.mark.parametrize("speech_type", ["prepared", "presentation", None])
def test_prepared_and_presentation_use_full_eight_category_profile(speech_type):
    profile = _profile_for(speech_type)
    assert set(profile.keys()) == set(_BASE_WEIGHTS.keys())
    assert sum(profile.values()) == pytest.approx(1.0, abs=1e-9)


def test_impromptu_profile_drops_closing_and_renormalises():
    profile = _profile_for("impromptu")
    assert "closing" not in profile
    assert sum(profile.values()) == pytest.approx(1.0, abs=1e-9)


def test_all_threes_gives_score_three():
    overall = compute_overall(_categories(), "prepared")
    assert overall.score == pytest.approx(3.0, abs=1e-6)
    assert overall.weights_version == WEIGHTS_VERSION
    assert set(overall.applicable_categories) == set(_BASE_WEIGHTS.keys())
    assert sum(overall.weights.values()) == pytest.approx(1.0, abs=1e-3)


def test_all_fives_gives_score_five():
    cats = _categories(
        hook=5,
        message_focus=5,
        structure=5,
        closing=5,
        pacing=5,
        pauses=5,
        vocal_variety=5,
        language=5,
    )
    overall = compute_overall(cats, "prepared")
    assert overall.score == pytest.approx(5.0, abs=1e-6)


def test_na_category_is_excluded_and_weight_redistributed():
    # Score every applicable category at 4, mark `closing` as n/a.
    # Result must be 4.0 — the n/a weight redistributes proportionally
    # so the score does not slide toward 3 or 5.
    cats = _categories(
        hook=4,
        message_focus=4,
        structure=4,
        closing="n/a",
        pacing=4,
        pauses=4,
        vocal_variety=4,
        language=4,
    )
    overall = compute_overall(cats, "prepared")
    assert overall.score == pytest.approx(4.0, abs=1e-6)
    assert "closing" not in overall.applicable_categories
    assert sum(overall.weights.values()) == pytest.approx(1.0, abs=1e-3)


def test_impromptu_with_na_closing_matches_explicit_impromptu_profile():
    # On an impromptu speech the score should be identical whether the
    # model returned `closing: "n/a"` or the closing category was scored.
    # Setting closing to a value that would skew the prepared profile,
    # then verifying impromptu ignores it.
    cats = _categories(
        hook=4,
        message_focus=4,
        structure=4,
        closing=1,  # would drag a prepared score down hard
        pacing=4,
        pauses=4,
        vocal_variety=4,
        language=4,
    )
    prepared = compute_overall(cats, "prepared")
    impromptu = compute_overall(cats, "impromptu")
    assert prepared.score < impromptu.score
    assert impromptu.score == pytest.approx(4.0, abs=1e-6)
    assert "closing" not in impromptu.applicable_categories


def test_none_speech_type_behaves_like_prepared():
    cats = _categories()
    assert compute_overall(cats, None).score == compute_overall(cats, "prepared").score


def test_all_na_collapses_to_zero():
    cats = _categories(
        hook="n/a",
        message_focus="n/a",
        structure="n/a",
        closing="n/a",
        pacing="n/a",
        pauses="n/a",
        vocal_variety="n/a",
        language="n/a",
    )
    overall = compute_overall(cats, "prepared")
    assert overall.score == 0.0
    assert overall.applicable_categories == []
    assert overall.weights == {}
