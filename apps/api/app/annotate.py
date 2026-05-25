"""Pure transcript annotator.

Stage 28 — turns the enriched Layer 1 signals (segments, prosody,
boundary tone, prominent word, pauses, fillers) into a single
prompt-ready string. Pure function: no I/O, no LLM calls. Behaviour is
pinned by golden-snapshot tests in `tests/test_annotate.py`.

Inline annotation syntax — committed here so Stage 29's prompt can
describe it verbatim to the model:

    *clarity*       — prominent word inside its segment
    <um>            — filler hit (interjection / hedge / verbal_pause / tic)
    [pause 1.4s]    — silence inline at its real position
    [pace 175 wpm]  — between segments where local WPM swings >= 25%
                      from the previous segment

Boundary tone (rising / falling / flat) and per-segment prosody numbers
sit in `segment_table` alongside, not inline — they describe the segment
as a whole, not a single word.
"""

from pydantic import BaseModel

from app.schemas import (
    Acoustic,
    BoundaryTone,
    FillerHit,
    Metrics,
    Pause,
    Segment,
    Transcript,
    Word,
)


# Token-pass fillers store `t = round(word.start, 3)`, so an exact match
# would work — but Haiku-pass hits round less precisely, so allow a small
# window when deciding "is this word a filler hit".
FILLER_MATCH_WINDOW_SEC = 0.1
PROMINENT_MATCH_WINDOW_SEC = 0.005
PACE_SHIFT_RATIO = 0.25
_PUNCT = ".,!?;:\"')]}"


class SegmentTableRow(BaseModel):
    t: float
    dur: float
    wpm: float
    pitch_range_st: float
    intensity_db: float
    tone: BoundaryTone | None
    prominent: str | None


class AnnotatedTranscript(BaseModel):
    text: str
    segment_table: list[SegmentTableRow]


def build_annotated_transcript(
    transcript: Transcript, acoustic: Acoustic, metrics: Metrics
) -> AnnotatedTranscript:
    segments = list(acoustic.segments)
    if not segments:
        return AnnotatedTranscript(text=transcript.text, segment_table=[])

    words = transcript.words
    pauses = sorted(acoustic.pauses, key=lambda p: p.start)
    fillers = list(metrics.fillers)

    tokens: list[str] = []
    pause_idx = 0
    prev_wpm: float | None = None

    for seg_idx, seg in enumerate(segments):
        # Pauses that happen before this segment starts — catches both
        # initial silence and between-segment silence.
        while pause_idx < len(pauses) and pauses[pause_idx].start < seg.start:
            tokens.append(_pause_marker(pauses[pause_idx]))
            pause_idx += 1

        if (
            seg_idx > 0
            and prev_wpm is not None
            and prev_wpm > 0
            and seg.wpm_local > 0
        ):
            ratio = abs(seg.wpm_local - prev_wpm) / prev_wpm
            if ratio >= PACE_SHIFT_RATIO:
                tokens.append(f"[pace {int(round(seg.wpm_local))} wpm]")

        seg_words = [words[i] for i in seg.word_indices]
        for i, w in enumerate(seg_words):
            tokens.append(_render_word(w, seg, fillers))
            next_boundary = (
                seg_words[i + 1].start if i + 1 < len(seg_words) else seg.end
            )
            while pause_idx < len(pauses) and pauses[pause_idx].start < next_boundary:
                tokens.append(_pause_marker(pauses[pause_idx]))
                pause_idx += 1

        prev_wpm = seg.wpm_local

    while pause_idx < len(pauses):
        tokens.append(_pause_marker(pauses[pause_idx]))
        pause_idx += 1

    return AnnotatedTranscript(
        text=" ".join(tokens),
        segment_table=[_table_row(seg) for seg in segments],
    )


def _render_word(word: Word, seg: Segment, fillers: list[FillerHit]) -> str:
    bare = _bare(word.text)

    if any(
        f.word.lower() == bare and abs(f.t - word.start) <= FILLER_MATCH_WINDOW_SEC
        for f in fillers
    ):
        return f"<{bare}>"

    prom = seg.prominent_word
    if (
        prom is not None
        and abs(word.start - prom.t) <= PROMINENT_MATCH_WINDOW_SEC
        and _bare(prom.text) == bare
    ):
        return f"*{word.text}*"
    return word.text


def _pause_marker(pause: Pause) -> str:
    return f"[pause {pause.duration_sec:.1f}s]"


def _bare(text: str) -> str:
    return text.strip().lower().strip(_PUNCT)


def _table_row(seg: Segment) -> SegmentTableRow:
    return SegmentTableRow(
        t=round(seg.start, 2),
        dur=round(seg.end - seg.start, 2),
        wpm=seg.wpm_local,
        pitch_range_st=seg.pitch_range_st,
        intensity_db=seg.intensity_mean_db,
        tone=seg.boundary_tone,
        prominent=seg.prominent_word.text if seg.prominent_word else None,
    )
