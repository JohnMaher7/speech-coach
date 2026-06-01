import type { ScoreTone } from "@/lib/scores";

/** A plain-English verdict on a raw metric, plus a colour tone the UI can
 * render with the existing `toneColor` / score-tone palette. Thresholds are
 * grounded in the synthesis prompt's own scoring anchors and the timeline
 * chart's highlighted band — see comments on each helper. */
export type MetricBand = {
  label: string;
  tone: ScoreTone;
};

/** Words per minute. 130–160 is the band the timeline chart already
 * highlights as the sweet spot (report-view.tsx). */
export function wpmBand(wpm: number): MetricBand {
  if (wpm < 130) return { label: "Slow · aim 130–160", tone: "mid" };
  if (wpm > 160) return { label: "Rushing", tone: "low" };
  return { label: "Ideal pace", tone: "good" };
}

/** Fillers per minute. Cutoffs from the prompt's worked examples:
 * 0.3 reads as clean, 2.1 as acceptable, 9.5 as high. */
export function fillerBand(perMin: number): MetricBand {
  if (perMin < 1.5) return { label: "Clean", tone: "good" };
  if (perMin > 4) return { label: "High", tone: "low" };
  return { label: "Acceptable", tone: "mid" };
}

/** Monotone score as a percentage (0 = expressive, 100 = flat). Lower is
 * better, so the tones invert relative to the other bands. */
export function monotoneBand(pct: number): MetricBand {
  if (pct < 40) return { label: "Expressive", tone: "good" };
  if (pct > 65) return { label: "Flat", tone: "low" };
  return { label: "Some variation", tone: "mid" };
}
