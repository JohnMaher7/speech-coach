"""Synthetic-audio tests for the acoustic extractor.

DSP code is easy to get subtly wrong — sample-rate mismatches, frame
alignment, bad semitone conversion. These tests pin the maths against
inputs of known properties so a future regression breaks loudly.
"""

import math
import os
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

from app.acoustic import (
    _analyze_array,
    _ensure_fast_decodable,
    _suppress_vocal_fry,
    analyze_audio,
    classify_boundary_tone,
    find_prominent_word,
)
from app.metrics import _volume_range_from_segments
from app.schemas import Segment, Word

SR = 22050


def _sine(freq: float, duration: float, sr: int = SR) -> np.ndarray:
    t = np.arange(0, duration, 1.0 / sr)
    return 0.5 * np.sin(2.0 * math.pi * freq * t)


def _sweep(
    start_freq: float, end_freq: float, duration: float, sr: int = SR
) -> np.ndarray:
    """Linear-frequency sweep (chirp) from start_freq to end_freq."""
    n = int(duration * sr)
    t = np.arange(n) / sr
    inst_freq = np.linspace(start_freq, end_freq, n)
    # Phase = integral of 2π·f(t) dt — cumulative trapezoidal rule keeps it smooth.
    phase = 2.0 * math.pi * np.cumsum(inst_freq) / sr
    return 0.5 * np.sin(phase)


def test_pitch_detector_recovers_known_frequency():
    y = _sine(220.0, duration=2.0)
    features = _analyze_array(y, sr=SR)

    assert features.voiced_mean_hz == pytest.approx(220.0, abs=2.0)
    assert features.pitch_mean_hz == pytest.approx(220.0, abs=2.0)


def test_semitone_conversion_is_octave_aware():
    # Concatenate 220Hz and 440Hz tones — one octave apart, so the semitone
    # delta between their mean pitches should be 12 (within rounding).
    low = _sine(220.0, duration=1.0)
    high = _sine(440.0, duration=1.0)
    y = np.concatenate([low, high])
    features = _analyze_array(y, sr=SR)

    pitch_st = np.asarray(
        [v for v in features.pitch_st_values if v is not None],
        dtype=np.float64,
    )
    frame_times = np.asarray(features.pitch_frame_times, dtype=np.float64)
    assert pitch_st.size > 0

    # Slice the semitone array by which half of the recording the frame sits in.
    low_mask = frame_times < 1.0
    high_mask = frame_times >= 1.0
    low_st = np.asarray(
        [
            v
            for v, m in zip(features.pitch_st_values, low_mask)
            if m and v is not None
        ],
        dtype=np.float64,
    )
    high_st = np.asarray(
        [
            v
            for v, m in zip(features.pitch_st_values, high_mask)
            if m and v is not None
        ],
        dtype=np.float64,
    )
    assert low_st.size > 0 and high_st.size > 0

    delta = float(np.mean(high_st) - np.mean(low_st))
    assert delta == pytest.approx(12.0, abs=0.5)


def test_constant_tone_has_flat_intensity():
    y = _sine(220.0, duration=2.0)
    features = _analyze_array(y, sr=SR)

    intensity = np.asarray(features.intensity_values_db, dtype=np.float64)
    assert intensity.size > 0
    # A pure sine has no envelope variation, so the peak should equal the mean
    # to within a tiny margin (parselmouth's windowing introduces ~0.5 dB tails).
    peak = float(np.max(intensity))
    mean = float(np.mean(intensity))
    assert peak - mean == pytest.approx(0.0, abs=1.0)


def test_classify_boundary_tone_uptalk_rises():
    # Synthetic uptalk: pitch sweeps up over the last 200 ms. The detector
    # should classify the terminal contour as `rising`.
    y = _sweep(180.0, 280.0, duration=0.6)
    features = _analyze_array(y, sr=SR)

    pitch_times = np.asarray(features.pitch_frame_times, dtype=np.float64)
    pitch_st = np.asarray(
        [v if v is not None else np.nan for v in features.pitch_st_values],
        dtype=np.float64,
    )
    tone = classify_boundary_tone(pitch_times, pitch_st, segment_end=0.6)
    assert tone == "rising"


def test_classify_boundary_tone_declarative_falls():
    y = _sweep(280.0, 180.0, duration=0.6)
    features = _analyze_array(y, sr=SR)

    pitch_times = np.asarray(features.pitch_frame_times, dtype=np.float64)
    pitch_st = np.asarray(
        [v if v is not None else np.nan for v in features.pitch_st_values],
        dtype=np.float64,
    )
    tone = classify_boundary_tone(pitch_times, pitch_st, segment_end=0.6)
    assert tone == "falling"


def test_classify_boundary_tone_flat_sine_is_flat():
    y = _sine(220.0, duration=0.6)
    features = _analyze_array(y, sr=SR)

    pitch_times = np.asarray(features.pitch_frame_times, dtype=np.float64)
    pitch_st = np.asarray(
        [v if v is not None else np.nan for v in features.pitch_st_values],
        dtype=np.float64,
    )
    tone = classify_boundary_tone(pitch_times, pitch_st, segment_end=0.6)
    assert tone == "flat"


def test_find_prominent_word_picks_pitch_and_intensity_peak():
    # Three "words" over a sweep: word 1 in the low-pitch region, word 2 in
    # the middle, word 3 at the top. With a rising sweep, word 3 has the
    # highest local pitch peak AND the loudest amplitude — it should win.
    words = [
        Word(text="alpha", start=0.0, end=0.4, confidence=1.0),
        Word(text="beta", start=0.4, end=0.8, confidence=1.0),
        Word(text="gamma", start=0.8, end=1.2, confidence=1.0),
    ]
    y = _sweep(150.0, 350.0, duration=1.2)
    # Amplify the third word so it also dominates on intensity.
    third = int(0.8 * SR)
    y[third:] *= 2.0
    features = _analyze_array(y, sr=SR)

    pitch_times = np.asarray(features.pitch_frame_times, dtype=np.float64)
    pitch_st = np.asarray(
        [v if v is not None else np.nan for v in features.pitch_st_values],
        dtype=np.float64,
    )
    intensity_times = np.asarray(features.intensity_frame_times, dtype=np.float64)
    intensity_db = np.asarray(features.intensity_values_db, dtype=np.float64)

    prom = find_prominent_word(
        words, pitch_times, pitch_st, intensity_times, intensity_db
    )
    assert prom is not None
    assert prom.text == "gamma"
    assert prom.t == pytest.approx(0.8)


def test_find_prominent_word_returns_none_for_empty_words():
    prom = find_prominent_word(
        [],
        np.asarray([0.0, 0.5, 1.0]),
        np.asarray([0.0, 0.1, -0.1]),
        np.asarray([0.0, 0.5, 1.0]),
        np.asarray([60.0, 60.0, 60.0]),
    )
    assert prom is None


def test_analyze_audio_round_trips_from_disk(tmp_path: Path):
    y = _sine(220.0, duration=1.5)
    path = tmp_path / "tone.wav"
    sf.write(str(path), y, SR)

    features = analyze_audio(str(path))
    assert features.duration_sec == pytest.approx(1.5, abs=0.05)
    assert features.voiced_mean_hz == pytest.approx(220.0, abs=2.0)
    assert len(features.pitch_frame_times) == len(features.pitch_st_values)
    assert len(features.intensity_frame_times) == len(features.intensity_values_db)
    # Volume timeline is aligned 1:1 with the pitch timeline.
    assert len(features.volume_timeline) == len(features.pitch_times)


def test_ensure_fast_decodable_passes_wav_through(tmp_path: Path):
    """A WAV is libsndfile-readable, so it must NOT be transcoded — same path,
    is_temp False. This is what keeps the fast path drift-free for WAV uploads."""
    path = tmp_path / "tone.wav"
    sf.write(str(path), _sine(220.0, duration=0.5), SR)

    decode_path, is_temp = _ensure_fast_decodable(str(path))
    assert decode_path == str(path)
    assert is_temp is False


@pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg not installed")
def test_analyze_audio_decodes_non_wav_via_ffmpeg(tmp_path: Path):
    """mp4/m4a is NOT libsndfile-readable, so analyze_audio must transcode it
    through ffmpeg and still measure the tone correctly."""
    wav = tmp_path / "tone.wav"
    sf.write(str(wav), _sine(220.0, duration=1.5), SR)
    m4a = tmp_path / "tone.m4a"
    subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(wav),
         "-c:a", "aac", str(m4a)],
        check=True,
    )

    # libsndfile cannot read it -> the transcode branch fires.
    decode_path, is_temp = _ensure_fast_decodable(str(m4a))
    assert is_temp is True
    if is_temp:
        os.unlink(decode_path)

    features = analyze_audio(str(m4a))
    assert features.voiced_mean_hz == pytest.approx(220.0, abs=3.0)
    assert features.duration_sec == pytest.approx(1.5, abs=0.15)


def _seg(intensity_mean_db: float, start: float = 0.0) -> Segment:
    """Minimal Segment carrying a given per-phrase mean loudness, for the
    section-level volume metric."""
    return Segment(
        start=start,
        end=start + 1.0,
        text="x",
        word_indices=[0],
        pitch_range_st=0.0,
        intensity_mean_db=intensity_mean_db,
        intensity_peak_db=intensity_mean_db + 1.0,
        wpm_local=120.0,
    )


def test_volume_range_is_gain_invariant():
    """Section-to-section loudness *variation* must not depend on recording
    gain. A constant mic-gain offset shifts every phrase's mean dB equally and
    cancels out of a spread, so adding a constant leaves volume_range_db
    unchanged."""
    means = (58.0, 61.0, 64.0, 67.0, 70.0)
    base = [_seg(db) for db in means]
    louder = [_seg(db + 6.0) for db in means]

    r_base = _volume_range_from_segments(base)
    r_louder = _volume_range_from_segments(louder)

    assert r_base is not None and r_base > 3.0  # clear section-to-section spread
    assert r_louder == pytest.approx(r_base, abs=0.01)


def test_volume_range_near_zero_for_flat_amplitude():
    # Every phrase sits at essentially the same loudness -> tiny section spread.
    segs = [_seg(db) for db in (60.0, 60.1, 59.9, 60.0, 60.05)]
    r = _volume_range_from_segments(segs)
    assert r is not None and r < 1.0


def test_volume_range_none_when_too_few_voiced_segments():
    # Fewer than VOLUME_RANGE_MIN_SEGMENTS voiced segments -> not enough to judge.
    assert _volume_range_from_segments([_seg(60.0), _seg(64.0)]) is None
    assert _volume_range_from_segments([]) is None
    # Segments with no measured loudness (0.0 dB) are ignored, not counted as
    # silent phrases — only 2 real segments survive here, below the floor.
    zeros = [_seg(0.0), _seg(0.0), _seg(0.0), _seg(60.0), _seg(64.0)]
    assert _volume_range_from_segments(zeros) is None
    # Three real segments clear the floor.
    assert (
        _volume_range_from_segments([_seg(58.0), _seg(62.0), _seg(66.0)]) is not None
    )


def test_suppress_vocal_fry_zeros_subharmonic_frames():
    """A 55 Hz frame inside a 110 Hz speaker is exactly an octave below
    median — well outside the fry band — and should be zeroed. Normal
    frames around the median are untouched. This is the helper that keeps
    creaky-voice phrase ends out of the pitch metrics and the chart."""
    pitch_hz = np.array([110.0, 112.0, 108.0, 55.0, 110.0, 109.0])
    out = _suppress_vocal_fry(pitch_hz)
    assert out[3] == 0.0
    assert out[0] == 110.0
    assert out[5] == 109.0


def test_suppress_vocal_fry_no_op_when_no_outliers():
    pitch_hz = np.array([108.0, 110.0, 112.0, 109.0])
    out = _suppress_vocal_fry(pitch_hz)
    assert np.array_equal(out, pitch_hz)


def test_two_pass_pitch_clamps_octave_outliers():
    """A 110 Hz monotone tone interrupted by a 440 Hz burst should NOT show
    octave-doubled outliers in the final pitch array. The second pass clamps
    its ceiling to 2× the speaker median (~220 Hz), so 440 Hz cannot survive.

    This is the regression net for the Stage 31 vocal-variety bug: glottal
    fry and breath bursts used to leak through as octave errors and inflate
    pitch_std past every monotone threshold.
    """
    fundamental = _sine(110.0, duration=2.0)
    burst = _sine(440.0, duration=0.1)
    # Splice a 100 ms burst in at the 1.0 s mark.
    splice_at = int(1.0 * SR)
    y = fundamental.copy()
    y[splice_at : splice_at + burst.size] = burst
    features = _analyze_array(y, sr=SR)

    voiced_st = np.asarray(
        [v for v in features.pitch_st_values if v is not None],
        dtype=np.float64,
    )
    assert voiced_st.size > 0
    # No frame should sit anywhere near +12 st (an octave above the median).
    # 6 st gives generous margin for tracker noise.
    assert float(np.max(np.abs(voiced_st))) < 6.0
    # And the headline SD must stay below the monotone-floor threshold (1 st)
    # because the speaker IS monotone — the burst is the only "variation".
    assert features.pitch_std_st < 1.0


def test_pitch_st_timeline_aligns_with_pitch_times():
    # Two-octave sweep — semitones should range roughly across [-12, +12]
    # relative to the geometric-ish mean. The exact mean is the voiced mean,
    # so the contract we pin here is structural: same length as pitch_times,
    # None where Hz is None, finite floats where Hz is finite.
    y = _sweep(150.0, 600.0, duration=2.0)
    features = _analyze_array(y, sr=SR)

    assert len(features.pitch_st_timeline) == len(features.pitch_times)
    for hz, st in zip(features.pitch_values, features.pitch_st_timeline):
        if hz is None:
            assert st is None
        else:
            assert st is not None
            assert math.isfinite(st)
    voiced_st = [v for v in features.pitch_st_timeline if v is not None]
    assert voiced_st  # sweep is fully voiced
    # 4× frequency range = 24 semitones; the 0.5s downsample loses the absolute
    # extremes, and the two-pass tight floor + fry filter (Stage 31) correctly
    # discard the very bottom of the sweep as sub-harmonic. So we only require
    # the span to remain comfortably wide — proves the chart still covers
    # genuinely expressive pitch ranges.
    assert (max(voiced_st) - min(voiced_st)) > 8.0
