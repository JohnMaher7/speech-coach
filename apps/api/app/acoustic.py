"""Acoustic feature extraction.

One audio load, one pitch pass, one intensity pass. Everything else (the
chart timeline, per-segment prosody) is computed by slicing the in-memory
arrays — never by re-opening the file. This keeps the pipeline cheap when
segments arrive in Stage 26.
"""

from dataclasses import dataclass

import librosa
import numpy as np
import parselmouth

from app.schemas import BoundaryTone, Pause, ProminentWord, Word


PITCH_TIME_STEP_SEC = 0.01
TIMELINE_STEP_SEC = 0.5
SILENCE_TOP_DB = 30.0
MIN_PAUSE_SEC = 0.3
# Window at the segment tail used to classify boundary tone, in seconds.
BOUNDARY_TAIL_SEC = 0.2
# Slope threshold (semitones per second) for rising/falling classification.
# Synthetic uptalk over 0.2 s typically rises 4–8 st → 20–40 st/s; declaratives
# fall similarly. Anything inside ±BOUNDARY_SLOPE_THRESHOLD_ST_PER_SEC reads as flat.
BOUNDARY_SLOPE_THRESHOLD_ST_PER_SEC = 5.0
# Minimum voiced frames in the tail window before we attempt to classify.
BOUNDARY_MIN_FRAMES = 3
# First-pass pitch bounds — wide enough to fit any adult voice; only used
# to find the speaker's median so the second pass can clamp octave errors.
WIDE_PITCH_FLOOR_HZ = 60.0
WIDE_PITCH_CEILING_HZ = 600.0
# Second-pass clamps: cap floor/ceiling at half / twice the speaker's median.
# Boersma's recommendation for octave-error suppression in Praat.
TIGHT_FLOOR_RATIO = 0.5
TIGHT_CEILING_RATIO = 2.0
# Hard absolute floor — sub-50Hz reads are almost always glottal fry artefacts.
PITCH_HARD_FLOOR_HZ = 50.0
PITCH_HARD_CEILING_HZ = 600.0
# Vocal-fry / sub-harmonic suppression: drop pitch frames that fall more than
# this many semitones below the speaker's voiced median. Sub-harmonic detection
# reads exactly an octave (12 st) below; real intonation moves in continuous
# speech rarely exceed 6-8 st down. The 8 st cut catches sub-harmonics
# comfortably while leaving genuine downward emphasis intact. Tighter than the
# second-pass floor (which has to stay wide enough for the tracker to work).
FRY_BAND_SEMITONES = 8.0


@dataclass
class AcousticFeatures:
    duration_sec: float
    # Down-sampled timeline for the chart (Hz and semitones, aligned 1:1).
    pitch_times: list[float]
    pitch_values: list[float | None]
    pitch_st_timeline: list[float | None]
    # Full-resolution per-frame arrays for per-segment slicing.
    # `pitch_st_values[i]` is None when frame i is unvoiced.
    pitch_frame_times: list[float]
    pitch_st_values: list[float | None]
    intensity_frame_times: list[float]
    intensity_values_db: list[float]
    voiced_mean_hz: float  # reference for semitone conversion
    pauses: list[Pause]
    pitch_mean_hz: float
    pitch_std_hz: float
    # Semitone SD is speaker-uniform (a 12-st octave reads the same at 100 Hz
    # and 200 Hz). Drives Metrics.monotone_score.
    pitch_std_st: float


def analyze_audio(path: str) -> AcousticFeatures:
    y, sr = librosa.load(path, sr=None, mono=True)
    return _analyze_array(y, sr)


def _analyze_array(y: np.ndarray, sr: int) -> AcousticFeatures:
    duration = float(librosa.get_duration(y=y, sr=sr))

    intervals = librosa.effects.split(y, top_db=SILENCE_TOP_DB)
    pauses = _intervals_to_pauses(intervals, sr=sr, duration=duration)

    sound = parselmouth.Sound(values=y.astype(np.float64), sampling_frequency=sr)

    pitch_times, pitch_hz = _extract_robust_pitch(sound)
    pitch_hz = _suppress_vocal_fry(pitch_hz)
    voiced_mask = pitch_hz > 0
    voiced = pitch_hz[voiced_mask]
    voiced_mean_hz = float(np.mean(voiced)) if voiced.size else 0.0
    pitch_std_hz = float(np.std(voiced)) if voiced.size else 0.0

    pitch_st_values = _hz_array_to_semitones(pitch_hz, voiced_mean_hz)
    voiced_st = np.asarray(
        [v for v in pitch_st_values if v is not None], dtype=np.float64
    )
    pitch_std_st = float(np.std(voiced_st)) if voiced_st.size else 0.0

    # Down-sample to the timeline grid that powers the existing Recharts plot.
    timeline_times, timeline_pitch = _downsample_pitch(
        pitch_times, pitch_hz, TIMELINE_STEP_SEC
    )
    timeline_pitch_st = _hz_array_to_semitones(
        np.asarray([v if v is not None else 0.0 for v in timeline_pitch], dtype=np.float64),
        voiced_mean_hz,
    )

    # Intensity (dB) — parselmouth returns a (1, N) array; flatten to (N,).
    # Kept at the per-frame level for segment-mean / segment-peak intensity
    # in `find_prominent_word`. Aggregate "did the speaker modulate volume"
    # metrics were tried in earlier Stage 31 iterations and dropped: phonetic
    # variation (vowels are 8-12 dB louder than nasals) and uncalibrated
    # recording levels made any whole-speech dB range unreliable.
    intensity = sound.to_intensity()
    intensity_times = np.asarray(intensity.xs(), dtype=np.float64)
    intensity_db = np.asarray(intensity.values, dtype=np.float64).reshape(-1)

    return AcousticFeatures(
        duration_sec=duration,
        pitch_times=timeline_times,
        pitch_values=timeline_pitch,
        pitch_st_timeline=timeline_pitch_st,
        pitch_frame_times=pitch_times.tolist(),
        pitch_st_values=pitch_st_values,
        intensity_frame_times=intensity_times.tolist(),
        intensity_values_db=intensity_db.tolist(),
        voiced_mean_hz=voiced_mean_hz,
        pauses=pauses,
        pitch_mean_hz=voiced_mean_hz,
        pitch_std_hz=pitch_std_hz,
        pitch_std_st=pitch_std_st,
    )


def _suppress_vocal_fry(pitch_hz: np.ndarray) -> np.ndarray:
    """Zero out voiced frames more than FRY_BAND_SEMITONES below the median.

    Creaky voice at phrase ends gets tracked as a sub-harmonic (around half
    the speaker's true f0). Those frames are real audio events but they
    aren't "intonation" — they shouldn't influence pitch SD or appear on the
    timeline chart as dramatic downward stabs. The second-pass floor at
    `median * 0.5` has to stay wide enough for Praat's tracker; this is a
    tighter post-filter applied AFTER extraction.
    """
    if pitch_hz.size == 0:
        return pitch_hz
    voiced = pitch_hz[pitch_hz > 0]
    if voiced.size == 0:
        return pitch_hz
    median_hz = float(np.median(voiced))
    if median_hz <= 0:
        return pitch_hz
    fry_floor_hz = median_hz * (2.0 ** (-FRY_BAND_SEMITONES / 12.0))
    out = pitch_hz.copy()
    fry_mask = (out > 0) & (out < fry_floor_hz)
    out[fry_mask] = 0.0
    return out




def _extract_robust_pitch(
    sound: parselmouth.Sound,
) -> tuple[np.ndarray, np.ndarray]:
    """Two-pass pitch extraction with octave-error suppression.

    Pass 1 uses parselmouth's defaults (75–600 Hz) just to find the speaker's
    voiced median. Pass 2 re-runs with floor/ceiling clamped to half and
    twice the median — bounds tight enough that Praat's dynamic-programming
    tracker cannot return an octave-doubled candidate. Without this step a
    monotone speaker around 110 Hz can return 220 Hz outliers from glottal
    fry or breath, blowing pitch SD past every monotone threshold.
    """

    first = sound.to_pitch_ac(
        time_step=PITCH_TIME_STEP_SEC,
        pitch_floor=WIDE_PITCH_FLOOR_HZ,
        pitch_ceiling=WIDE_PITCH_CEILING_HZ,
    )
    first_hz = np.asarray(first.selected_array["frequency"], dtype=np.float64)
    first_voiced = first_hz[first_hz > 0]
    if first_voiced.size == 0:
        # No voiced frames at all — silent recording. Return empty arrays.
        return np.asarray(first.xs(), dtype=np.float64), first_hz

    median_hz = float(np.median(first_voiced))
    tight_floor = max(PITCH_HARD_FLOOR_HZ, median_hz * TIGHT_FLOOR_RATIO)
    tight_ceiling = min(PITCH_HARD_CEILING_HZ, median_hz * TIGHT_CEILING_RATIO)
    if tight_ceiling <= tight_floor * 1.5:
        # Median is degenerate (DC offset, very low pitch tracker confidence);
        # fall back to the wide-pass result rather than starve the second pass.
        return np.asarray(first.xs(), dtype=np.float64), first_hz

    second = sound.to_pitch_ac(
        time_step=PITCH_TIME_STEP_SEC,
        pitch_floor=tight_floor,
        pitch_ceiling=tight_ceiling,
    )
    return (
        np.asarray(second.xs(), dtype=np.float64),
        np.asarray(second.selected_array["frequency"], dtype=np.float64),
    )


def _hz_array_to_semitones(
    hz: np.ndarray, reference_hz: float
) -> list[float | None]:
    """Convert per-frame Hz to semitones relative to `reference_hz`. Unvoiced
    frames (hz==0) become None. If the reference is zero (silent recording),
    returns all-None."""

    if reference_hz <= 0.0:
        return [None] * int(hz.size)
    out: list[float | None] = []
    for v in hz:
        if v <= 0.0:
            out.append(None)
        else:
            out.append(float(12.0 * np.log2(v / reference_hz)))
    return out


def find_prominent_word(
    words: list[Word],
    pitch_times: np.ndarray,
    pitch_st: np.ndarray,
    intensity_times: np.ndarray,
    intensity_db: np.ndarray,
) -> ProminentWord | None:
    """Pick the most-emphasised word in a segment.

    For each word: take its peak pitch (semitones, relative to the recording's
    voiced mean) and peak intensity (dB). Convert both to z-scores within the
    segment, sum them, and return the highest scorer if its score is positive
    (i.e. it stands out from the segment baseline). Returns None when the
    segment has no voiced frames, no intensity samples, or no word peaks
    above the mean.

    `pitch_st` is a float array where unvoiced frames are NaN (already
    sliced to the segment by the caller).
    """

    if not words:
        return None

    per_word_pitch: list[float] = []
    per_word_intensity: list[float] = []
    for w in words:
        pitch_mask = (pitch_times >= w.start) & (pitch_times < w.end)
        pitch_window = pitch_st[pitch_mask] if pitch_st.size else np.array([])
        voiced = pitch_window[~np.isnan(pitch_window)] if pitch_window.size else pitch_window
        per_word_pitch.append(float(np.max(voiced)) if voiced.size else float("nan"))

        int_mask = (intensity_times >= w.start) & (intensity_times < w.end)
        int_window = intensity_db[int_mask] if intensity_db.size else np.array([])
        per_word_intensity.append(float(np.max(int_window)) if int_window.size else float("nan"))

    pitch_arr = np.asarray(per_word_pitch, dtype=np.float64)
    int_arr = np.asarray(per_word_intensity, dtype=np.float64)

    pitch_z = _safe_zscore(pitch_arr)
    int_z = _safe_zscore(int_arr)
    combined = pitch_z + int_z

    if not np.isfinite(combined).any():
        return None
    best_idx = int(np.nanargmax(combined))
    if not np.isfinite(combined[best_idx]) or combined[best_idx] <= 0.0:
        return None

    chosen = words[best_idx]
    return ProminentWord(text=chosen.text, t=round(chosen.start, 3))


def classify_boundary_tone(
    pitch_times: np.ndarray,
    pitch_st: np.ndarray,
    segment_end: float,
    tail_sec: float = BOUNDARY_TAIL_SEC,
) -> BoundaryTone | None:
    """Look at the last `tail_sec` of voiced pitch (semitones) and decide
    whether the contour is rising, falling, or flat. Uses a least-squares
    slope in semitones per second; returns None if the tail has too few
    voiced frames to fit a line."""

    if pitch_times.size == 0 or pitch_st.size == 0:
        return None
    tail_mask = (pitch_times >= segment_end - tail_sec) & (pitch_times <= segment_end)
    tail_t = pitch_times[tail_mask]
    tail_st = pitch_st[tail_mask]
    voiced_mask = ~np.isnan(tail_st)
    tail_t = tail_t[voiced_mask]
    tail_st = tail_st[voiced_mask]
    if tail_t.size < BOUNDARY_MIN_FRAMES:
        return None

    # polyfit(deg=1) returns [slope, intercept] in y-per-x units (st per second).
    slope, _ = np.polyfit(tail_t, tail_st, 1)
    if slope > BOUNDARY_SLOPE_THRESHOLD_ST_PER_SEC:
        return "rising"
    if slope < -BOUNDARY_SLOPE_THRESHOLD_ST_PER_SEC:
        return "falling"
    return "flat"


def _safe_zscore(values: np.ndarray) -> np.ndarray:
    """Z-score ignoring NaNs. NaN inputs stay NaN; constant arrays return zeros."""

    if values.size == 0:
        return values
    finite = values[~np.isnan(values)]
    if finite.size == 0:
        return np.full_like(values, np.nan)
    mean = float(np.mean(finite))
    std = float(np.std(finite))
    if std == 0.0:
        return np.where(np.isnan(values), np.nan, 0.0)
    return (values - mean) / std


def _intervals_to_pauses(
    intervals: np.ndarray, sr: int, duration: float
) -> list[Pause]:
    pauses: list[Pause] = []
    prev_end = 0.0
    for start_sample, end_sample in intervals:
        start = float(start_sample) / sr
        if start - prev_end >= MIN_PAUSE_SEC:
            pauses.append(Pause(start=round(prev_end, 3), end=round(start, 3)))
        prev_end = float(end_sample) / sr
    if duration - prev_end >= MIN_PAUSE_SEC:
        pauses.append(Pause(start=round(prev_end, 3), end=round(duration, 3)))
    return pauses


def _downsample_pitch(
    times: np.ndarray, freqs: np.ndarray, step: float
) -> tuple[list[float], list[float | None]]:
    out_t: list[float] = []
    out_f: list[float | None] = []
    if times.size == 0:
        return out_t, out_f
    duration = float(times[-1])
    half = step / 2
    t = 0.0
    while t <= duration + 1e-9:
        mask = (times >= t - half) & (times < t + half)
        window = freqs[mask]
        voiced = window[window > 0]
        out_t.append(round(t, 3))
        out_f.append(float(np.median(voiced)) if voiced.size else None)
        t += step
    return out_t, out_f


if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) != 2:
        print("usage: uv run python -m app.acoustic <path-to-audio>", file=sys.stderr)
        sys.exit(1)

    features = analyze_audio(sys.argv[1])
    print(
        json.dumps(
            {
                "duration_sec": round(features.duration_sec, 2),
                "pitch_mean_hz": round(features.pitch_mean_hz, 2),
                "pitch_std_hz": round(features.pitch_std_hz, 2),
                "pitch_std_st": round(features.pitch_std_st, 2),
                "voiced_mean_hz": round(features.voiced_mean_hz, 2),
                "pause_count": len(features.pauses),
                "pauses": [{"start": p.start, "end": p.end} for p in features.pauses],
                "timeline_first_10": [
                    {"t": t, "pitch_hz": v}
                    for t, v in list(zip(features.pitch_times, features.pitch_values))[:10]
                ],
                "timeline_total_points": len(features.pitch_times),
                "intensity_mean_db": round(
                    float(np.mean(features.intensity_values_db)), 2
                )
                if features.intensity_values_db
                else None,
            },
            indent=2,
        )
    )
