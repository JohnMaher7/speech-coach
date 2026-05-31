"""Golden-snapshot tests for the annotated-transcript builder.

The fixture is a tiny two-segment speech rigged to exercise the four
inline-syntax cases the Stage 29 prompt will rely on:

- `inline-syntax`   — a single segment renders text + prominent + pause
- `pace-shift`      — a second segment 25%+ faster triggers [pace N wpm]
- `fillers-inline`  — `um` between segments wraps as <um>
- `uptalk-marked`   — segment 2's terminal `time?` is `rising` in the table

Pure-function tests; no audio, no LLM.
"""

from app.annotate import (
    PACE_SHIFT_RATIO,
    AnnotatedTranscript,
    build_annotated_transcript,
)
from app.schemas import (
    Acoustic,
    FillerHit,
    Metrics,
    Pause,
    ProminentWord,
    Segment,
    Transcript,
    Word,
)


def _fixture() -> tuple[Transcript, Acoustic, Metrics]:
    words = [
        Word(text="So", start=0.0, end=0.3, confidence=0.99),
        Word(text="um", start=0.4, end=0.6, confidence=0.95),
        Word(text="today", start=0.7, end=1.1, confidence=0.99),
        Word(text="we", start=1.2, end=1.4, confidence=0.99),
        Word(text="discuss", start=1.5, end=1.9, confidence=0.99),
        Word(text="clarity.", start=2.0, end=2.5, confidence=0.99),
        # 1.5s silence here.
        Word(text="Clarity", start=4.0, end=4.3, confidence=0.99),
        Word(text="wins", start=4.4, end=4.7, confidence=0.99),
        Word(text="every", start=4.8, end=5.0, confidence=0.99),
        Word(text="time?", start=5.1, end=5.4, confidence=0.99),
    ]
    transcript = Transcript(
        text="So um today we discuss clarity. Clarity wins every time?",
        words=words,
        duration_sec=6.0,
    )
    segments = [
        Segment(
            start=0.0,
            end=2.5,
            text="So um today we discuss clarity.",
            word_indices=[0, 1, 2, 3, 4, 5],
            pitch_mean_st=0.0,
            pitch_range_st=3.0,
            intensity_mean_db=62.0,
            intensity_peak_db=68.0,
            wpm_local=120.0,
            boundary_tone="falling",
            prominent_word=ProminentWord(text="clarity.", t=2.0),
        ),
        Segment(
            start=4.0,
            end=5.4,
            text="Clarity wins every time?",
            word_indices=[6, 7, 8, 9],
            pitch_mean_st=1.0,
            pitch_range_st=5.0,
            intensity_mean_db=65.0,
            intensity_peak_db=72.0,
            wpm_local=171.4,  # (171.4 - 120) / 120 = 42.8% > 25% → pace marker fires.
            boundary_tone="rising",
            prominent_word=ProminentWord(text="Clarity", t=4.0),
        ),
    ]
    pauses = [
        Pause(start=2.5, end=4.0, prev_word="clarity.", next_word="Clarity"),
    ]
    acoustic = Acoustic(
        timeline=[],
        pauses=pauses,
        pitch_mean_hz=120.0,
        pitch_std_hz=20.0,
        pitch_std_st=2.25,
        segments=segments,
    )
    metrics = Metrics(
        wpm=100.0,
        fillers=[FillerHit(word="um", t=0.4, category="interjection")],
        filler_per_min=10.0,
        long_pauses=1,
        pauses_over_0_6=2,
        pauses_over_2=0,
        total_pause_sec=2.6,
        monotone_score=0.5,
    )
    return transcript, acoustic, metrics


GOLDEN_TEXT = (
    "So <um> today we discuss *clarity.* "
    "[pause 1.5s] [pace 171 wpm] "
    "*Clarity* wins every time?"
)


def test_full_annotation_matches_golden_snapshot():
    transcript, acoustic, metrics = _fixture()
    result = build_annotated_transcript(transcript, acoustic, metrics)
    assert isinstance(result, AnnotatedTranscript)
    assert result.text == GOLDEN_TEXT


def test_filler_marker_wraps_um_inline():
    transcript, acoustic, metrics = _fixture()
    result = build_annotated_transcript(transcript, acoustic, metrics)
    assert "<um>" in result.text
    # The raw "um" must not also appear unmarked outside its angle-bracket wrap.
    assert " um " not in f" {result.text} "


def test_prominent_word_wrapped_with_asterisks():
    transcript, acoustic, metrics = _fixture()
    result = build_annotated_transcript(transcript, acoustic, metrics)
    assert "*clarity.*" in result.text
    assert "*Clarity*" in result.text


def test_pause_marker_lands_between_segments():
    transcript, acoustic, metrics = _fixture()
    result = build_annotated_transcript(transcript, acoustic, metrics)
    # Pause is between segment 1's closing word and segment 2's opening word.
    before, _, after = result.text.partition("[pause 1.5s]")
    assert "*clarity.*" in before
    assert "*Clarity*" in after


def test_pace_marker_fires_above_threshold():
    transcript, acoustic, metrics = _fixture()
    result = build_annotated_transcript(transcript, acoustic, metrics)
    assert "[pace 171 wpm]" in result.text


def test_pace_marker_skipped_when_change_under_threshold():
    transcript, acoustic, metrics = _fixture()
    # Bump segment 2 from 171.4 → 140 (≈17% change, under PACE_SHIFT_RATIO=0.25).
    new_seg = acoustic.segments[1].model_copy(update={"wpm_local": 140.0})
    acoustic.segments[1] = new_seg
    result = build_annotated_transcript(transcript, acoustic, metrics)
    assert "[pace" not in result.text
    # Sanity: the threshold constant is still the one the assertion assumes.
    assert PACE_SHIFT_RATIO == 0.25


def test_segment_table_carries_tone_and_prominent_word():
    transcript, acoustic, metrics = _fixture()
    result = build_annotated_transcript(transcript, acoustic, metrics)
    assert len(result.segment_table) == 2

    row0 = result.segment_table[0]
    assert row0.t == 0.0
    assert row0.dur == 2.5
    assert row0.wpm == 120.0
    assert row0.tone == "falling"
    assert row0.prominent == "clarity."

    # Uptalk case — the second segment closes with rising tone.
    row1 = result.segment_table[1]
    assert row1.tone == "rising"
    assert row1.prominent == "Clarity"


def test_empty_segments_returns_raw_text():
    transcript = Transcript(text="hello world", words=[], duration_sec=1.0)
    acoustic = Acoustic(
        timeline=[],
        pauses=[],
        pitch_mean_hz=0.0,
        pitch_std_hz=0.0,
        pitch_std_st=0.0,
        segments=[],
    )
    metrics = Metrics(
        wpm=0.0,
        fillers=[],
        filler_per_min=0.0,
        long_pauses=0,
        pauses_over_0_6=0,
        pauses_over_2=0,
        total_pause_sec=0.0,
        monotone_score=0.0,
    )
    result = build_annotated_transcript(transcript, acoustic, metrics)
    assert result.text == "hello world"
    assert result.segment_table == []
