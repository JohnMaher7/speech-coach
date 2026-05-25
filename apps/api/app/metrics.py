from collections.abc import Sequence

import numpy as np

from app.acoustic import AcousticFeatures, classify_boundary_tone, find_prominent_word
from app.schemas import (
    Acoustic,
    FillerHit,
    Metrics,
    Pause,
    Segment,
    TimelinePoint,
    Transcript,
    Word,
)


FILLER_DEDUPE_WINDOW_SEC = 0.05


FILLER_WORDS: frozenset[str] = frozenset({"um", "uh", "uhm", "er", "ah", "hmm"})
LONG_PAUSE_THRESHOLD_SEC = 1.0
WPM_WINDOW_SEC = 10.0
# Monotone thresholds in semitones. Literature (Patel et al., Hirschberg):
# expressive speech runs 3-4 st SD, conversational 2-3 st, monotone <1 st.
# Below MONOTONE_LOW_ST: fully monotone (1.0). Above MONOTONE_HIGH_ST:
# fully animated (0.0). Linear interpolation in between.
MONOTONE_LOW_ST = 1.0
MONOTONE_HIGH_ST = 3.5
# Segment pitch range uses percentiles, not max−min — one octave-error frame
# would otherwise inflate the range by 12 semitones.
SEGMENT_PITCH_RANGE_LOW_PCT = 5
SEGMENT_PITCH_RANGE_HIGH_PCT = 95
SENTENCE_TERMINALS = frozenset({".", "!", "?"})
# Pause-split fallback only fires when neither utterances nor punctuation
# yielded boundaries; this threshold catches "between-thought" silences.
PAUSE_SPLIT_THRESHOLD_SEC = 0.6


def compute_metrics(
    transcript: Transcript,
    acoustic: AcousticFeatures,
    lexical_fillers: Sequence[FillerHit] = (),
) -> Metrics:
    duration_min = max(transcript.duration_sec / 60.0, 1e-6)

    wpm = len(transcript.words) / duration_min
    token_fillers = _detect_fillers(transcript.words)
    fillers = _merge_fillers(token_fillers, lexical_fillers)
    filler_per_min = len(fillers) / duration_min
    long_pauses = sum(
        1 for p in acoustic.pauses if (p.end - p.start) >= LONG_PAUSE_THRESHOLD_SEC
    )
    monotone_score = _monotone_from_std_st(acoustic.pitch_std_st)

    return Metrics(
        wpm=round(wpm, 1),
        fillers=fillers,
        filler_per_min=round(filler_per_min, 2),
        long_pauses=long_pauses,
        monotone_score=round(monotone_score, 3),
    )


def _merge_fillers(
    token_hits: Sequence[FillerHit], lexical_hits: Sequence[FillerHit]
) -> list[FillerHit]:
    """Combine token-matched (interjection) hits with Haiku lexical hits.
    Token hits win when both land within FILLER_DEDUPE_WINDOW_SEC — they
    carry the exact transcript token, not a paraphrase."""

    merged: list[FillerHit] = list(token_hits)
    for hit in lexical_hits:
        if any(
            existing.word.lower() == hit.word.lower()
            and abs(existing.t - hit.t) <= FILLER_DEDUPE_WINDOW_SEC
            for existing in merged
        ):
            continue
        merged.append(hit)
    merged.sort(key=lambda h: h.t)
    return merged


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
        TimelinePoint(t=t, pitch_hz=p, pitch_st=p_st, wpm_local=w)
        for t, p, p_st, w in zip(
            features.pitch_times,
            features.pitch_values,
            features.pitch_st_timeline,
            wpm_locals,
        )
    ]
    pauses = _enrich_pauses(features.pauses, transcript.words)
    segments = build_segments(transcript, features)
    return Acoustic(
        timeline=timeline,
        pauses=pauses,
        pitch_mean_hz=round(features.pitch_mean_hz, 2),
        pitch_std_hz=round(features.pitch_std_hz, 2),
        pitch_std_st=round(features.pitch_std_st, 2),
        segments=segments,
    )


def build_segments(
    transcript: Transcript, features: AcousticFeatures
) -> list[Segment]:
    """Cut the speech into sentences/clauses and attach per-segment prosody.

    Source preference:
      1. Deepgram-provided utterances (already sentence-shaped).
      2. Punctuation on word tokens (`.`, `!`, `?`).
      3. Pause-based splits using the acoustic pause inventory.

    Once boundaries exist, slice the per-frame pitch (semitones) and
    intensity arrays by timestamp — no audio re-load.
    """

    words = transcript.words
    if not words:
        return []

    spans = _spans_from_utterances(transcript, words)
    if not spans:
        spans = _spans_from_punctuation(words)
    if not spans:
        spans = _spans_from_pauses(words, features.pauses)
    if not spans:
        # Single-segment fallback so downstream code always has something.
        spans = [(0, len(words) - 1)]

    pitch_times = np.asarray(features.pitch_frame_times, dtype=np.float64)
    pitch_st = np.asarray(
        [v if v is not None else np.nan for v in features.pitch_st_values],
        dtype=np.float64,
    )
    intensity_times = np.asarray(features.intensity_frame_times, dtype=np.float64)
    intensity_db = np.asarray(features.intensity_values_db, dtype=np.float64)

    segments: list[Segment] = []
    for start_idx, end_idx in spans:
        seg_words = words[start_idx : end_idx + 1]
        if not seg_words:
            continue
        start = seg_words[0].start
        end = seg_words[-1].end
        duration = max(end - start, 1e-6)
        text = " ".join(w.text for w in seg_words)

        pitch_window = (
            pitch_st[(pitch_times >= start) & (pitch_times < end)]
            if pitch_times.size
            else np.array([], dtype=np.float64)
        )
        voiced_pitch = pitch_window[~np.isnan(pitch_window)]
        pitch_mean_st = float(np.mean(voiced_pitch)) if voiced_pitch.size else None
        if voiced_pitch.size >= 2:
            p_low, p_high = np.percentile(
                voiced_pitch,
                [SEGMENT_PITCH_RANGE_LOW_PCT, SEGMENT_PITCH_RANGE_HIGH_PCT],
            )
            pitch_range_st = float(p_high - p_low)
        elif voiced_pitch.size == 1:
            pitch_range_st = 0.0
        else:
            pitch_range_st = 0.0

        intensity_window = (
            intensity_db[(intensity_times >= start) & (intensity_times < end)]
            if intensity_times.size
            else np.array([], dtype=np.float64)
        )
        if intensity_window.size:
            intensity_mean_db = float(np.mean(intensity_window))
            intensity_peak_db = float(np.max(intensity_window))
        else:
            intensity_mean_db = 0.0
            intensity_peak_db = 0.0

        wpm_local = round(len(seg_words) / (duration / 60.0), 1)

        seg_pitch_mask = (pitch_times >= start) & (pitch_times < end)
        seg_pitch_times = pitch_times[seg_pitch_mask] if pitch_times.size else pitch_times
        seg_pitch_st = pitch_st[seg_pitch_mask] if pitch_st.size else pitch_st
        seg_int_mask = (intensity_times >= start) & (intensity_times < end)
        seg_int_times = (
            intensity_times[seg_int_mask] if intensity_times.size else intensity_times
        )
        seg_int_db = intensity_db[seg_int_mask] if intensity_db.size else intensity_db

        prominent = find_prominent_word(
            list(seg_words), seg_pitch_times, seg_pitch_st, seg_int_times, seg_int_db
        )
        boundary_tone = classify_boundary_tone(pitch_times, pitch_st, segment_end=end)

        segments.append(
            Segment(
                start=round(start, 3),
                end=round(end, 3),
                text=text,
                word_indices=list(range(start_idx, end_idx + 1)),
                pitch_mean_st=round(pitch_mean_st, 2) if pitch_mean_st is not None else None,
                pitch_range_st=round(pitch_range_st, 2),
                intensity_mean_db=round(intensity_mean_db, 2),
                intensity_peak_db=round(intensity_peak_db, 2),
                wpm_local=wpm_local,
                boundary_tone=boundary_tone,
                prominent_word=prominent,
            )
        )
    return segments


def _spans_from_utterances(
    transcript: Transcript, words: Sequence[Word]
) -> list[tuple[int, int]]:
    if not transcript.utterances:
        return []
    spans: list[tuple[int, int]] = []
    for utt in transcript.utterances:
        idxs = [
            i
            for i, w in enumerate(words)
            if w.start >= utt.start - 0.05 and w.end <= utt.end + 0.05
        ]
        if idxs:
            spans.append((idxs[0], idxs[-1]))
    return spans


def _spans_from_punctuation(words: Sequence[Word]) -> list[tuple[int, int]]:
    spans: list[tuple[int, int]] = []
    start_idx = 0
    for i, w in enumerate(words):
        if _ends_sentence(w.text):
            spans.append((start_idx, i))
            start_idx = i + 1
    if start_idx <= len(words) - 1:
        spans.append((start_idx, len(words) - 1))
    return spans


def _spans_from_pauses(
    words: Sequence[Word], pauses: Sequence[Pause]
) -> list[tuple[int, int]]:
    if not words:
        return []
    long_pauses = [p for p in pauses if (p.end - p.start) >= PAUSE_SPLIT_THRESHOLD_SEC]
    if not long_pauses:
        return [(0, len(words) - 1)]
    spans: list[tuple[int, int]] = []
    start_idx = 0
    for i, w in enumerate(words[:-1]):
        next_w = words[i + 1]
        gap_start, gap_end = w.end, next_w.start
        if any(p.start >= gap_start - 0.05 and p.end <= gap_end + 0.05 for p in long_pauses):
            spans.append((start_idx, i))
            start_idx = i + 1
    spans.append((start_idx, len(words) - 1))
    return spans


def _ends_sentence(text: str) -> bool:
    stripped = text.rstrip("\"')]} ")
    return bool(stripped) and stripped[-1] in SENTENCE_TERMINALS


def _enrich_pauses(pauses: Sequence[Pause], words: Sequence[Word]) -> list[Pause]:
    """Attach the words immediately bracketing each pause. The
    `_intervals_to_pauses` helper in acoustic.py runs from audio alone — only
    here, with the transcript in hand, can we say which word a pause sat
    after and which it sat before."""

    if not words:
        return [p.model_copy() for p in pauses]
    enriched: list[Pause] = []
    for p in pauses:
        prev_word = None
        for w in words:
            if w.end <= p.start + 0.05:
                prev_word = w.text
            else:
                break
        next_word = None
        for w in words:
            if w.start >= p.end - 0.05:
                next_word = w.text
                break
        enriched.append(
            Pause(
                start=p.start,
                end=p.end,
                prev_word=prev_word,
                next_word=next_word,
            )
        )
    return enriched


def _detect_fillers(words: Sequence[Word]) -> list[FillerHit]:
    hits: list[FillerHit] = []
    for w in words:
        token = w.text.strip().lower().rstrip(".,!?;:")
        if token in FILLER_WORDS:
            hits.append(
                FillerHit(word=token, t=round(w.start, 3), category="interjection")
            )
    return hits


def _monotone_from_std_st(std_st: float) -> float:
    """Map pitch SD in semitones onto a 0..1 monotone scale (1 = monotone).

    Operating in semitones not Hz makes the score speaker-uniform — a male
    at 100 Hz and a female at 200 Hz with the same intonation register read
    identically. The 1.0/3.5 endpoints came from speech-analysis literature
    on conversational vs. expressive English; tighten only with eval evidence.
    """

    if std_st <= MONOTONE_LOW_ST:
        return 1.0
    if std_st >= MONOTONE_HIGH_ST:
        return 0.0
    span = MONOTONE_HIGH_ST - MONOTONE_LOW_ST
    return float((MONOTONE_HIGH_ST - std_st) / span)


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
        pitch_st_timeline=[0.0, 0.3, None, 0.7, 0.1, -0.2, None, None],
        pitch_frame_times=[0.0, 1.0, 2.0],
        pitch_st_values=[0.0, 0.5, -0.3],
        intensity_frame_times=[0.0, 1.0, 2.0],
        intensity_values_db=[60.0, 65.0, 62.0],
        voiced_mean_hz=120.0,
        pauses=[Pause(start=2.5, end=4.0)],
        pitch_mean_hz=121.4,
        pitch_std_hz=12.0,
        pitch_std_st=2.0,
    )

    metrics = compute_metrics(transcript, acoustic)
    print("Metrics:")
    print(metrics.model_dump_json(indent=2))

    ticks = [0.0, 1.0, 2.0, 3.0, 4.0]
    wpms = compute_wpm_timeline(transcript.words, ticks, duration=4.0, window_sec=2.0)
    print("\nWPM timeline (window=2s):")
    for t, w in zip(ticks, wpms):
        print(f"  t={t:>4.1f}s  wpm_local={w}")
