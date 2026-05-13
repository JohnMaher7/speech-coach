from dataclasses import dataclass

import librosa
import numpy as np
import parselmouth

from app.schemas import Pause


PITCH_TIME_STEP_SEC = 0.01
TIMELINE_STEP_SEC = 0.5
SILENCE_TOP_DB = 30.0
MIN_PAUSE_SEC = 0.4


@dataclass
class AcousticFeatures:
    duration_sec: float
    pitch_times: list[float]
    pitch_values: list[float | None]
    pauses: list[Pause]
    pitch_mean_hz: float
    pitch_std_hz: float


def analyze_audio(path: str) -> AcousticFeatures:
    y, sr = librosa.load(path, sr=None, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    intervals = librosa.effects.split(y, top_db=SILENCE_TOP_DB)
    pauses = _intervals_to_pauses(intervals, sr=sr, duration=duration)

    sound = parselmouth.Sound(values=y.astype(np.float64), sampling_frequency=sr)
    pitch = sound.to_pitch(time_step=PITCH_TIME_STEP_SEC)
    times = np.asarray(pitch.xs(), dtype=np.float64)
    freqs = np.asarray(pitch.selected_array["frequency"], dtype=np.float64)

    pitch_times, pitch_values = _downsample_pitch(times, freqs, TIMELINE_STEP_SEC)

    voiced = freqs[freqs > 0]
    pitch_mean = float(np.mean(voiced)) if voiced.size else 0.0
    pitch_std = float(np.std(voiced)) if voiced.size else 0.0

    return AcousticFeatures(
        duration_sec=duration,
        pitch_times=pitch_times,
        pitch_values=pitch_values,
        pauses=pauses,
        pitch_mean_hz=pitch_mean,
        pitch_std_hz=pitch_std,
    )


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
                "pause_count": len(features.pauses),
                "pauses": [{"start": p.start, "end": p.end} for p in features.pauses],
                "timeline_first_10": [
                    {"t": t, "pitch_hz": v}
                    for t, v in list(zip(features.pitch_times, features.pitch_values))[:10]
                ],
                "timeline_total_points": len(features.pitch_times),
            },
            indent=2,
        )
    )
