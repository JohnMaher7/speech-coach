from collections.abc import Sequence

import numpy as np

from app.acoustic import AcousticFeatures
from app.schemas import Acoustic, FillerHit, Metrics, TimelinePoint, Transcript, Word


FILLER_WORDS: frozenset[str] = frozenset({"um", "uh", "uhm", "er", "ah", "hmm"})
LONG_PAUSE_THRESHOLD_SEC = 1.0
WPM_WINDOW_SEC = 10.0
MONOTONE_LOW_HZ = 10.0
MONOTONE_HIGH_HZ = 50.0


def compute_metrics(transcript: Transcript, acoustic: AcousticFeatures) -> Metrics:
    duration_min = max(transcript.duration_sec / 60.0, 1e-6)

    wpm = len(transcript.words) / duration_min
    fillers = _detect_fillers(transcript.words)
    filler_per_min = len(fillers) / duration_min
    long_pauses = sum(
        1 for p in acoustic.pauses if (p.end - p.start) >= LONG_PAUSE_THRESHOLD_SEC
    )
    monotone_score = _monotone_from_std(acoustic.pitch_std_hz)

    return Metrics(
        wpm=round(wpm, 1),
        fillers=fillers,
        filler_per_min=round(filler_per_min, 2),
        long_pauses=long_pauses,
        monotone_score=round(monotone_score, 3),
    )


def compute_wpm_timeline(
    words: Sequence[Word],
    tick_times: Sequence[float],
    duration: float,
    window_sec: float = WPM_WINDOW_SEC,
) -> list[float]:
    if not tick_times:
        return []
    if not words:
        return [0.0] * len(tick_times)

    starts = np.asarray([w.start for w in words], dtype=np.float64)
    half = window_sec / 2

    out: list[float] = []
    for t in tick_times:
        window_start = max(0.0, t - half)
        window_end = min(duration, t + half)
        width = window_end - window_start
        if width <= 0:
            out.append(0.0)
            continue
        count = int(((starts >= window_start) & (starts < window_end)).sum())
        out.append(round(count / (width / 60.0), 1))
    return out


def build_acoustic(transcript: Transcript, features: AcousticFeatures) -> Acoustic:
    wpm_locals = compute_wpm_timeline(
        transcript.words,
        features.pitch_times,
        duration=features.duration_sec,
    )
    timeline = [
        TimelinePoint(t=t, pitch_hz=p, wpm_local=w)
        for t, p, w in zip(features.pitch_times, features.pitch_values, wpm_locals)
    ]
    return Acoustic(
        timeline=timeline,
        pauses=features.pauses,
        pitch_mean_hz=round(features.pitch_mean_hz, 2),
        pitch_std_hz=round(features.pitch_std_hz, 2),
    )


def _detect_fillers(words: Sequence[Word]) -> list[FillerHit]:
    hits: list[FillerHit] = []
    for w in words:
        token = w.text.strip().lower().rstrip(".,!?;:")
        if token in FILLER_WORDS:
            hits.append(FillerHit(word=token, t=round(w.start, 3)))
    return hits


def _monotone_from_std(std_hz: float) -> float:
    if std_hz <= MONOTONE_LOW_HZ:
        return 1.0
    if std_hz >= MONOTONE_HIGH_HZ:
        return 0.0
    span = MONOTONE_HIGH_HZ - MONOTONE_LOW_HZ
    return float((MONOTONE_HIGH_HZ - std_hz) / span)


if __name__ == "__main__":
    from app.schemas import Pause

    transcript = Transcript(
        text="So um I think uh this works.",
        words=[
            Word(text="So", start=0.0, end=0.3, confidence=0.99),
            Word(text="um", start=0.4, end=0.6, confidence=0.95),
            Word(text="I", start=0.7, end=0.8, confidence=0.99),
            Word(text="think", start=0.9, end=1.2, confidence=0.99),
            Word(text="uh", start=1.5, end=1.7, confidence=0.95),
            Word(text="this", start=1.8, end=2.0, confidence=0.99),
            Word(text="works.", start=2.1, end=2.4, confidence=0.99),
        ],
        duration_sec=4.0,
    )
    acoustic = AcousticFeatures(
        duration_sec=4.0,
        pitch_times=[0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5],
        pitch_values=[120.0, 122.0, None, 125.0, 121.0, 119.0, None, None],
        pauses=[Pause(start=2.5, end=4.0)],
        pitch_mean_hz=121.4,
        pitch_std_hz=12.0,
    )

    metrics = compute_metrics(transcript, acoustic)
    print("Metrics:")
    print(metrics.model_dump_json(indent=2))

    ticks = [0.0, 1.0, 2.0, 3.0, 4.0]
    wpms = compute_wpm_timeline(transcript.words, ticks, duration=4.0, window_sec=2.0)
    print("\nWPM timeline (window=2s):")
    for t, w in zip(ticks, wpms):
        print(f"  t={t:>4.1f}s  wpm_local={w}")
