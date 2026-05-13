export type ScoreTone = "good" | "mid" | "low";

/** Map a 1-5 category score (or an averaged overall) to a colour tone. */
export function scoreTone(score: number): ScoreTone {
  if (score >= 4) return "good";
  if (score >= 3) return "mid";
  return "low";
}

const VERDICTS: readonly [number, string][] = [
  [4.5, "Excellent"],
  [3.75, "Strong"],
  [3, "Solid"],
  [2.25, "Developing"],
];

/** A one-word headline for the averaged overall score. */
export function verdict(overall: number): string {
  for (const [threshold, label] of VERDICTS) {
    if (overall >= threshold) return label;
  }
  return "Needs work";
}

// Tone → Tailwind classes. Listed as literals so Tailwind's scanner picks them up.
export const TONE_TEXT: Record<ScoreTone, string> = {
  good: "text-score-good",
  mid: "text-score-mid",
  low: "text-score-low",
};

export const TONE_BG: Record<ScoreTone, string> = {
  good: "bg-score-good",
  mid: "bg-score-mid",
  low: "bg-score-low",
};

export const TONE_BORDER: Record<ScoreTone, string> = {
  good: "border-score-good",
  mid: "border-score-mid",
  low: "border-score-low",
};

export const TONE_BADGE: Record<ScoreTone, "good" | "mid" | "low"> = {
  good: "good",
  mid: "mid",
  low: "low",
};
