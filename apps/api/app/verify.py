"""Post-synthesis grounding check.

Sonnet returns evidence quotes anchored to timestamps. The schema validator
enforces shape (every sub-5 score has evidence, every `"n/a"` has a reason)
but it cannot tell whether a quote was actually said or whether a timestamp
falls inside the recording. That is what this module does:

- every `Evidence.quote` (and every `Priority.example_quote`) must match the
  transcript text with a normalised Levenshtein ratio ≥ 0.85;
- every timestamp must sit inside `[0, transcript.duration_sec]`;
- every sub-5 category must carry at least one piece of evidence (belt and
  braces — the schema validator already enforces this at construction time,
  but a `Synthesis` built via `model_construct` would bypass it).

The result is attached to `Report.verification`. Failures are **non-blocking**
on purpose: a single mismatched quote is not worth losing the whole report
for, and the Stage 33 eval harness needs the pass-rate to be observable over
time rather than a 500 in production.
"""

from collections.abc import Iterable
from string import punctuation

from rapidfuzz import fuzz

from app.schemas import (
    Synthesis,
    Transcript,
    Verification,
    VerificationIssue,
)

QUOTE_MATCH_THRESHOLD = 0.85

_CATEGORY_NAMES = (
    "hook",
    "message_focus",
    "structure",
    "closing",
    "pacing",
    "pauses",
    "vocal_variety",
    "language",
)
_PUNCT_TABLE = str.maketrans({c: " " for c in punctuation})


def normalise(s: str) -> str:
    """Lowercase, replace punctuation with spaces, collapse whitespace.

    Punctuation is *replaced* with a space rather than stripped so a quote
    like `"world.Hello"` does not collapse into `"worldhello"` and overshoot
    a transcript that reads `"world hello"`."""

    return " ".join(s.lower().translate(_PUNCT_TABLE).split())


def find_quote(quote: str, transcript_text: str) -> tuple[int, int, float] | None:
    """Locate `quote` inside `transcript_text` after normalisation.

    Returns `(start_idx, end_idx, ratio)` where the indices point into the
    *normalised* transcript and `ratio` is in `[0, 1]`. Returns `None` when
    the best alignment scores below `QUOTE_MATCH_THRESHOLD`.

    Uses `rapidfuzz.fuzz.partial_ratio_alignment`, which slides the shorter
    string across the longer one and returns the Levenshtein ratio of the
    best-aligned window — exactly what we want for "is this short quote a
    near-substring of a longer transcript?"."""

    norm_quote = normalise(quote)
    norm_haystack = normalise(transcript_text)
    if not norm_quote or not norm_haystack:
        return None

    alignment = fuzz.partial_ratio_alignment(norm_quote, norm_haystack)
    if alignment is None:
        return None
    ratio = alignment.score / 100.0
    if ratio < QUOTE_MATCH_THRESHOLD:
        return None
    return alignment.dest_start, alignment.dest_end, ratio


def _iter_categories(synthesis: Synthesis):
    for name in _CATEGORY_NAMES:
        yield name, getattr(synthesis.categories, name)


def _iter_quote_anchors(synthesis: Synthesis) -> Iterable[tuple[str, str, float]]:
    """Yield `(location, quote, t)` for every quote+timestamp pair we verify."""

    for name, cat in _iter_categories(synthesis):
        for i, ev in enumerate(cat.evidence):
            yield f"categories.{name}.evidence[{i}]", ev.quote, ev.t

    for i, p in enumerate(synthesis.priorities):
        yield f"priorities[{i}]", p.example_quote, p.example_t


def verify(synthesis: Synthesis, transcript: Transcript) -> Verification:
    """Run every grounding check and bundle the findings."""

    issues: list[VerificationIssue] = []
    duration = transcript.duration_sec
    text = transcript.text

    for location, quote, t in _iter_quote_anchors(synthesis):
        if find_quote(quote, text) is None:
            issues.append(
                VerificationIssue(
                    kind="quote_not_found",
                    location=location,
                    detail=f"quote did not match transcript at ratio>={QUOTE_MATCH_THRESHOLD}: {quote!r}",
                )
            )
        if not 0.0 <= t <= duration:
            issues.append(
                VerificationIssue(
                    kind="timestamp_out_of_range",
                    location=location,
                    detail=f"t={t} outside [0, {duration}]",
                )
            )

    for name, cat in _iter_categories(synthesis):
        if isinstance(cat.score, int) and cat.score < 5 and not cat.evidence:
            issues.append(
                VerificationIssue(
                    kind="missing_evidence",
                    location=f"categories.{name}",
                    detail=f"score={cat.score} requires at least one Evidence quote",
                )
            )

    return Verification(passed=not issues, issues=issues)
