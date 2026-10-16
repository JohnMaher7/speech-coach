import type { ScoreTone } from "@/lib/scores";
import { cn } from "@/lib/utils";

export const LAMP_BG: Record<ScoreTone, string> = {
  good: "bg-go",
  mid: "bg-caution",
  low: "bg-stop",
};

export const TONE_INK: Record<ScoreTone, string> = {
  good: "text-go-ink",
  mid: "text-caution-ink",
  low: "text-stop-ink",
};

export function Lamp({
  tone,
  className = "",
}: {
  tone: ScoreTone | "off";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`lamp ${tone === "off" ? "bg-lamp-off" : LAMP_BG[tone]} ${className}`}
    />
  );
}

export const TONE_STROKE: Record<ScoreTone, string> = {
  good: "var(--go)",
  mid: "var(--caution)",
  low: "var(--stop)",
};

export function SignalBar({
  filled,
  tone,
  total = 5,
  className = "",
}: {
  filled: number;
  tone: ScoreTone | null;
  total?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`grid gap-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-[5px] rounded-full ${tone && i < filled ? LAMP_BG[tone] : "bg-lamp-off"}`}
        />
      ))}
    </div>
  );
}

export function ScoreRing({
  score,
  size = 120,
  stroke = 6,
  tone,
  label,
  className = "",
}: {
  score: number;
  size?: number;
  stroke?: number;
  tone: ScoreTone;
  label?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / 5));
  return (
    <div
      className={`relative grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} aria-hidden className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--lamp-off)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE_STROKE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </svg>
      <div className="relative text-center">
        <div className="display" style={{ fontSize: size * 0.36 }}>
          {score.toFixed(1)}
        </div>
        {label}
      </div>
    </div>
  );
}

export function SectionHead({
  label,
  title,
  aside,
  className = "",
}: {
  label?: React.ReactNode;
  title: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-12",
        className,
      )}
    >
      <div>
        {label && <p className="eyebrow mb-3">{label}</p>}
        <h2 className="display max-w-[20ch] text-[clamp(36px,4.4vw,54px)] leading-[1.02]">
          {title}
        </h2>
      </div>
      {aside && (
        <div className="max-w-[42ch] text-[15.5px] leading-[1.6] text-muted-foreground">
          {aside}
        </div>
      )}
    </div>
  );
}

export function Tally({ count }: { count: number }) {
  const groups = Math.ceil(count / 5);
  const lastGroup = count - (groups - 1) * 5;
  const width = (groups - 1) * 27 + (lastGroup === 5 ? 22 : lastGroup * 5);
  const strokes: React.ReactNode[] = [];
  for (let g = 0; g < groups; g++) {
    const inGroup = Math.min(5, count - g * 5);
    const x = g * 27;
    for (let i = 0; i < Math.min(inGroup, 4); i++) {
      const lx = x + i * 5 + 2;
      strokes.push(<line key={`${g}-${i}`} x1={lx} x2={lx} y1={2} y2={16} />);
    }
    if (inGroup === 5) {
      strokes.push(<line key={`${g}-x`} x1={x - 1} x2={x + 20} y1={13} y2={5} />);
    }
  }
  return (
    <svg
      aria-hidden
      width={width}
      height={18}
      className="shrink-0 stroke-foreground"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      {strokes}
    </svg>
  );
}
