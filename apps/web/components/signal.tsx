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
      className={`grid gap-[3px] ${className}`}
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-[10px] ${tone && i < filled ? LAMP_BG[tone] : "bg-lamp-off"}`}
        />
      ))}
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
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-10",
        className,
      )}
    >
      <div>
        {label && (
          <p className="mb-1 text-[15.5px] font-medium text-muted-foreground">
            {label}
          </p>
        )}
        <h2 className="text-balance font-display text-[clamp(34px,4.4vw,46px)] leading-none font-bold">
          {title}
        </h2>
      </div>
      {aside && (
        <div className="max-w-[44ch] text-[15.5px] leading-[1.55] text-muted-foreground sm:text-right">
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
