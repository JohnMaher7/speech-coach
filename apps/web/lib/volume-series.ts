import type { TimelinePoint } from "@/lib/api";

// The volume timeline arrives as absolute dB per ~0.5s window, gated to voiced
// speech (so silences are null). Absolute dB is mic-dependent and noisy at the
// syllable level, which made the raw chart wavy even for flat speakers. This
// transform turns it into "± dB from your recent delivery": first smooth out
// the syllable jitter, then subtract a slow rolling baseline so only deliberate
// emphasis — a phrase pushed louder or dropped softer — shows. The output is
// aligned 1:1 with `timeline`: null wherever the input was null, or where a
// voiced run is too short to be a real phrase.

const SMOOTH_WINDOW_SEC = 2.5;
const BASELINE_WINDOW_SEC = 15;
const MIN_RUN_SEC = 1.5;
const FALLBACK_STEP_SEC = 0.5;

function inferStepSec(timeline: TimelinePoint[]): number {
  for (let i = 1; i < timeline.length; i++) {
    const d = timeline[i].t - timeline[i - 1].t;
    if (d > 0) return d;
  }
  return FALLBACK_STEP_SEC;
}

/** Centered moving average over `radius` points each side, clamped at the
 * array's ends. Operates on a gap-free run of values. With a radius wider than
 * the run, every point's window covers the whole run, so the result is the run
 * mean — exactly the baseline we want for runs shorter than the window. */
function centeredMovingAverage(values: number[], radius: number): number[] {
  if (radius < 1) return values.slice();
  const out = new Array<number>(values.length);
  for (let i = 0; i < values.length; i++) {
    const lo = Math.max(0, i - radius);
    const hi = Math.min(values.length - 1, i + radius);
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += values[j];
    out[i] = sum / (hi - lo + 1);
  }
  return out;
}

/** Per-point deviation (dB) of smoothed loudness from a rolling baseline,
 * aligned 1:1 with `timeline`. */
export function volumeDeviationSeries(
  timeline: TimelinePoint[],
): (number | null)[] {
  const out: (number | null)[] = timeline.map(() => null);
  const step = inferStepSec(timeline);
  const smoothRadius = Math.max(1, Math.round(SMOOTH_WINDOW_SEC / step / 2));
  const baselineRadius = Math.max(1, Math.round(BASELINE_WINDOW_SEC / step / 2));
  const minRunPoints = Math.max(1, Math.round(MIN_RUN_SEC / step));

  let i = 0;
  while (i < timeline.length) {
    const v = timeline[i].volume_db;
    if (v === null || v === undefined) {
      i++;
      continue;
    }
    // Collect a contiguous voiced run [start, end); silences (null) break runs
    // so we never average loudness across a pause.
    const start = i;
    const run: number[] = [];
    while (i < timeline.length) {
      const val = timeline[i].volume_db;
      if (val === null || val === undefined) break;
      run.push(val);
      i++;
    }
    // Runs shorter than a real phrase stay null — ignore very short spikes.
    if (run.length < minRunPoints) continue;

    const smoothed = centeredMovingAverage(run, smoothRadius);
    const baseline = centeredMovingAverage(smoothed, baselineRadius);
    for (let k = 0; k < run.length; k++) {
      out[start + k] = Math.round((smoothed[k] - baseline[k]) * 100) / 100;
    }
  }
  return out;
}
