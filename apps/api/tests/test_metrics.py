from app.acoustic import AcousticFeatures
from app.metrics import (
    _detect_fillers,
    _monotone_from_std,
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
    assert _monotone_from_std(5.0) == 1.0


def test_monotone_high_std_floors_at_0():
    assert _monotone_from_std(80.0) == 0.0


def test_monotone_mid_range_is_linear():
    # span = 50 - 10 = 40; std=30 → (50 - 30) / 40 = 0.5
    assert _monotone_from_std(30.0) == 0.5


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
    # std_hz=30, span=40, (50-30)/40 = 0.5
    assert metrics.monotone_score == 0.5


def test_compute_metrics_clamps_monotone_score():
    # Force a high pitch_std to push the raw score below 0; should clamp at 0.
    transcript = Transcript(text="hi", words=[Word(text="hi", start=0.0, end=0.5, confidence=1.0)], duration_sec=60.0)
    acoustic = AcousticFeatures(
        duration_sec=60.0,
        pitch_times=[],
        pitch_values=[],
        pauses=[],
        pitch_mean_hz=120.0,
        pitch_std_hz=200.0,
    )
    assert compute_metrics(transcript, acoustic).monotone_score == 0.0


def test_long_pauses_threshold_is_exclusive_below_1_second():
    transcript = Transcript(text="hi", words=[Word(text="hi", start=0.0, end=0.5, confidence=1.0)], duration_sec=60.0)
    acoustic = AcousticFeatures(
        duration_sec=60.0,
        pitch_times=[],
        pitch_values=[],
        pauses=[
            Pause(start=0.0, end=0.99),  # 0.99s — below threshold
            Pause(start=2.0, end=3.0),   # 1.0s exactly — counts
        ],
        pitch_mean_hz=120.0,
        pitch_std_hz=30.0,
    )
    assert compute_metrics(transcript, acoustic).long_pauses == 1
