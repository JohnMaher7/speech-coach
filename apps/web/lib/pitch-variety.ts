import type { TimelinePoint } from "@/lib/api";

export type VarietyOptions = {
  deadbandSt?: number;
  restingPercentile?: number;
  smoothWindow?: number;
};

// Tunable defaults — see docs/.../plan. The dead-band is the main dial:
// wider => flatter line but mutes subtle emphasis; narrower => catches more
// emphasis but leaves more residual wiggle.
const DEFAULT_DEADBAND_ST = 1.0;
const DEFAULT_RESTING_PERCENTILE = 0.5;

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}

function smooth(
  values: (number | null)[],
  window: number,
): (number | null)[] {
  if (window <= 1) return values;
  const half = Math.floor(window / 2);
  return values.map((v, i) => {
    if (v === null) return null;
    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j++) {
      const w = values[j];
      if (j >= 0 && j < values.length && w !== null) {
        sum += w;
        count += 1;
      }
    }
    return count ? sum / count : v;
  });
}

/**
 * Turn the raw pitch contour (`pitch_st`, semitones vs. the speaker's mean)
 * into a vocal-variety indicator: flat at the speaker's resting baseline,
 * spiking only on genuine departures.
 *
 * 1. Re-anchor zero from the mean to the median of voiced pitch (the resting
 *    cluster), so ordinary delivery sits at the baseline instead of swinging
 *    around a centre the speaker rarely holds.
 * 2. Soft dead-band: collapse anything within `deadbandSt` of the baseline to
 *    flat; larger departures spike (up or down) by their excess over the band.
 *
 * Unvoiced points (`pitch_st === null`) stay null so gaps are preserved.
 */
export function pitchVarietySeries(
  points: TimelinePoint[],
  opts: VarietyOptions = {},
): (number | null)[] {
  const deadband = opts.deadbandSt ?? DEFAULT_DEADBAND_ST;
  const restingPercentile =
    opts.restingPercentile ?? DEFAULT_RESTING_PERCENTILE;
  const smoothWindow = opts.smoothWindow ?? 1;

  const voiced = points
    .map((p) => p.pitch_st)
    .filter((v): v is number => v !== null && Number.isFinite(v));

  if (voiced.length === 0) return points.map(() => null);

  const baseline = quantile([...voiced].sort((a, b) => a - b), restingPercentile);

  const series = points.map((p) => {
    if (p.pitch_st === null || !Number.isFinite(p.pitch_st)) return null;
    const dev = p.pitch_st - baseline;
    const mag = Math.max(0, Math.abs(dev) - deadband);
    return Math.sign(dev) * mag;
  });

  return smooth(series, smoothWindow);
}
