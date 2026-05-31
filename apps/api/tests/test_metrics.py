from app.acoustic import AcousticFeatures
from app.metrics import (
    _detect_fillers,
    _monotone_from_std_st,
    build_acoustic,
    compute_metrics,
    compute_wpm_timeline,
)
from app.schemas import Pause, Transcript, Word


def test_detect_fillers_lowercases_and_strips_punctuation():
    words = [
        Word(text="Um.", start=0.0, end=0.2, confidence=0.9),
        Word(text="UH,", start=0.3, end=0.5, confidence=0.9),
        Word(text="hello", start=0.6, end=1.0, confidence=0.9),
    ]
    hits = _detect_fillers(words)
    assert [h.word for h in hits] == ["um", "uh"]
    assert hits[0].t == 0.0


def test_detect_fillers_ignores_non_fillers():
    words = [
        Word(text="the", start=0.0, end=0.2, confidence=1.0),
        Word(text="actually", start=0.3, end=0.7, confidence=1.0),
    ]
    assert _detect_fillers(words) == []


def test_monotone_low_std_caps_at_1():
    # 0.5 st SD is below the MONOTONE_LOW_ST=1.0 floor → fully monotone.
    assert _monotone_from_std_st(0.5) == 1.0


def test_monotone_high_std_floors_at_0():
    # 5.0 st SD is above MONOTONE_HIGH_ST=3.5 → fully animated.
    assert _monotone_from_std_st(5.0) == 0.0


def test_monotone_mid_range_is_linear():
    # span = 3.5 - 1.0 = 2.5; midpoint std=2.25 → (3.5 - 2.25) / 2.5 = 0.5
    assert _monotone_from_std_st(2.25) == 0.5


def test_wpm_timeline_normalises_at_edges():
    # 5 words at t=0..4, full duration 60s. With window=10s the t=0 tick
    # clips its window to [0, 5], not [-5, 5], so the rate is 5 words / 5s
    # = 60 WPM, not 30. This is the bug-bait the metrics module guards.
    words = [Word(text=str(i), start=float(i), end=float(i) + 0.2, confidence=1.0) for i in range(5)]
    wpms = compute_wpm_timeline(words, tick_times=[0.0], duration=60.0, window_sec=10.0)
    assert wpms == [60.0]


def test_wpm_timeline_empty_words_returns_zeros():
    wpms = compute_wpm_timeline([], tick_times=[0.0, 5.0, 10.0], duration=60.0)
    assert wpms == [0.0, 0.0, 0.0]


def test_compute_metrics_aggregates(short_transcript: Transcript, short_acoustic: AcousticFeatures):
    metrics = compute_metrics(short_transcript, short_acoustic)
    # 7 words in 60 seconds = 7 WPM
    assert metrics.wpm == 7.0
    # 2 fillers in 60 seconds = 2 per minute
    assert metrics.filler_per_min == 2.0
    # Only one pause is >= 1.0s threshold (the 2.5→4.0 one)
    assert metrics.long_pauses == 1
    # Both pauses (1.5s and 0.6s) clear the 0.6s floor; neither clears 2.0s.
    assert metrics.pauses_over_0_6 == 2
    assert metrics.pauses_over_2 == 0
    # Total meaningful silence = 1.5 + 0.6 = 2.1s.
    assert metrics.total_pause_sec == 2.1
    # pitch_std_st=2.25, span=2.5, (3.5-2.25)/2.5 = 0.5
    assert metrics.monotone_score == 0.5


def _empty_features(**overrides) -> AcousticFeatures:
    defaults = dict(
        duration_sec=60.0,
        pitch_times=[],
        pitch_values=[],
        pitch_st_timeline=[],
        pitch_frame_times=[],
        pitch_st_values=[],
        intensity_frame_times=[],
        intensity_values_db=[],
        voiced_mean_hz=120.0,
        pauses=[],
        pitch_mean_hz=120.0,
        pitch_std_hz=30.0,
        pitch_std_st=2.25,
    )
    defaults.update(overrides)
    return AcousticFeatures(**defaults)


def test_compute_metrics_clamps_monotone_score():
    # Force a high pitch_std_st well above the upper threshold; should clamp at 0.
    transcript = Transcript(text="hi", words=[Word(text="hi", start=0.0, end=0.5, confidence=1.0)], duration_sec=60.0)
    acoustic = _empty_features(pitch_std_st=10.0)
    assert compute_metrics(transcript, acoustic).monotone_score == 0.0


def test_build_acoustic_populates_pitch_st_on_timeline(
    short_transcript: Transcript, short_acoustic: AcousticFeatures
):
    acoustic = build_acoustic(short_transcript, short_acoustic)
    assert len(acoustic.timeline) == len(short_acoustic.pitch_times)
    # Voiced ticks (Hz present) should also have a finite pitch_st;
    # unvoiced ticks (Hz None) should have pitch_st None.
    for point, hz in zip(acoustic.timeline, short_acoustic.pitch_values):
        if hz is None:
            assert point.pitch_st is None
        else:
            assert point.pitch_st is not None


def test_timeline_point_pitch_st_defaults_to_none_for_back_compat():
    # Old persisted reports predate the pitch_st field — Pydantic should
    # validate them with pitch_st defaulting to None.
    from app.schemas import TimelinePoint

    point = TimelinePoint.model_validate({"t": 1.0, "pitch_hz": 120.0, "wpm_local": 140.0})
    assert point.pitch_st is None


def test_segment_pitch_range_st_is_percentile_based():
    """A segment with mostly tight pitch and a handful of outlier frames
    should NOT report a 20-semitone range. P95−P5 trims the top/bottom 5%,
    so a small number of octave-error frames cannot inflate the range. Pin
    this with 100 frames (one second at PITCH_TIME_STEP_SEC = 0.01) which
    mirrors the production frame density.
    """
    from app.metrics import build_segments

    # One word spanning the whole 1.0s segment.
    transcript = Transcript(
        text="hello",
        words=[Word(text="hello", start=0.0, end=1.0, confidence=1.0)],
        duration_sec=1.0,
    )
    # 96 tight frames around 0.5 st, 4 outliers at +20 st. P95 sits inside
    # the tight cluster, so the range stays bounded.
    pitch_frame_times = [0.01 * i for i in range(100)]
    pitch_st_values: list[float | None] = [0.5] * 96 + [20.0] * 4
    features = _empty_features(
        duration_sec=1.0,
        pitch_frame_times=pitch_frame_times,
        pitch_st_values=pitch_st_values,
        intensity_frame_times=[0.5],
        intensity_values_db=[60.0],
    )

    segments = build_segments(transcript, features)
    assert len(segments) == 1
    # Range should reflect the bulk (≈0 st), not the outlier-driven 19.5.
    # Old max-min code would have produced ≈19.5 here.
    assert segments[0].pitch_range_st < 1.0


def test_long_pauses_threshold_is_exclusive_below_1_second():
    transcript = Transcript(text="hi", words=[Word(text="hi", start=0.0, end=0.5, confidence=1.0)], duration_sec=60.0)
    acoustic = _empty_features(
        pauses=[
            Pause(start=0.0, end=0.99),  # 0.99s — below threshold
            Pause(start=2.0, end=3.0),   # 1.0s exactly — counts
        ],
    )
    assert compute_metrics(transcript, acoustic).long_pauses == 1
