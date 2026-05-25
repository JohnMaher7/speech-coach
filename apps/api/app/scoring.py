"""Server-side weighted overall score.

Through Stage 30 the report page averaged the four "highlighted" category
cards client-side and called that the overall. With the eight-category
rubric in place that approach is wrong on two counts: it ignores half the
rubric, and it can't react to `"n/a"` categories. This module owns the
real version.

Two design choices worth noting up front:

1. **Content/craft is heavier than delivery (≈60/40).** A speech with a
   sharp message and clear structure can survive flat delivery; the
   reverse — polished delivery wrapped around a muddled point — gets
   forgotten faster.
2. **`"n/a"` redistributes proportionally.** A category that does not apply
   shouldn't bend the score toward 1 or 5 — its weight is shared across
   the remaining applicable categories in the same ratios they already had.

Bump `WEIGHTS_VERSION` whenever the profile dict changes so the eval
harness can attribute a score shift to a weight tweak vs. a prompt or
model change.
"""

from app.schemas import Categories, Overall, SpeechType

WEIGHTS_VERSION = 1

_BASE_WEIGHTS: dict[str, float] = {
    # Content & craft = 0.60
    "message_focus": 0.20,
    "structure": 0.18,
    "hook": 0.12,
    "closing": 0.10,
    # Delivery = 0.40
    "pacing": 0.11,
    "pauses": 0.11,
    "vocal_variety": 0.10,
    "language": 0.08,
}


def _profile_for(speech_type: SpeechType | None) -> dict[str, float]:
    """Return the category→weight dict for the given speech type.

    Impromptu speeches usually run short enough that `closing` is missing
    or vestigial, so we drop it from the profile entirely and redistribute
    its 0.10 across the remaining seven in proportion to their base
    weights. `presentation` and `prepared` use the full default.
    """

    profile = dict(_BASE_WEIGHTS)
    if speech_type == "impromptu":
        dropped = profile.pop("closing")
        remainder = sum(profile.values())
        for k in profile:
            profile[k] += dropped * profile[k] / remainder
    return profile


def compute_overall(
    categories: Categories, speech_type: SpeechType | None
) -> Overall:
    """Reduce the eight-category rubric to one weighted 0-5 score.

    Categories scored `"n/a"` are excluded and their weight redistributed
    proportionally across the surviving categories. If every category is
    `"n/a"` (shouldn't happen in practice) the score collapses to 0.
    """

    profile = _profile_for(speech_type)
    survivors: dict[str, tuple[int, float]] = {}
    for name, weight in profile.items():
        cat = getattr(categories, name)
        if isinstance(cat.score, int):
            survivors[name] = (cat.score, weight)

    if not survivors:
        return Overall(
            score=0.0,
            weights_version=WEIGHTS_VERSION,
            weights={},
            applicable_categories=[],
        )

    survivor_weight_sum = sum(w for _, w in survivors.values())
    normalised: dict[str, float] = {
        name: w / survivor_weight_sum for name, (_, w) in survivors.items()
    }
    score = sum(s * normalised[name] for name, (s, _) in survivors.items())

    return Overall(
        score=round(score, 3),
        weights_version=WEIGHTS_VERSION,
        weights={k: round(v, 4) for k, v in normalised.items()},
        applicable_categories=list(survivors.keys()),
    )
