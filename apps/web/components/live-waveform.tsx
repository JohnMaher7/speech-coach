"use client";

import { useEffect, useState } from "react";

type Bar = {
  height: number;
  delay: number;
  duration: number;
  color?: string;
  opacity?: number;
};

const BARS = 96;

function buildBars(): Bar[] {
  const out: Bar[] = [];
  for (let i = 0; i < BARS; i++) {
    const base = 30 + Math.round(Math.random() * 60);
    const delay = Number(((i / BARS) * 1.4).toFixed(3));
    const duration = Number((1.0 + Math.random() * 0.9).toFixed(2));
    let color: string | undefined;
    let opacity: number | undefined;
    if (i > 38 && i < 46) {
      color = "oklch(0.78 0.18 27)";
      opacity = 0.95;
    } else if (i > 70 && i < 76) {
      color = "oklch(0.82 0.16 65)";
      opacity = 0.9;
    }
    out.push({ height: base, delay, duration, color, opacity });
  }
  return out;
}

export function LiveWaveform() {
  const [bars, setBars] = useState<Bar[]>([]);

  useEffect(() => {
    setBars(buildBars());
  }, []);

  return (
    <div
      className="relative mb-9 flex h-[168px] items-center gap-[3px]"
      aria-hidden
    >
      {bars.map((b, i) => (
        <span
          key={i}
          className="flex-1 origin-center rounded-[2px] will-change-transform [animation:wave-pulse_1.4s_ease-in-out_infinite]"
          style={{
            minHeight: 3,
            height: `${b.height}%`,
            background: b.color ?? "oklch(0.62 0.16 277)",
            opacity: b.opacity ?? 0.7,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}
      <div
        className="absolute -top-[10px] -bottom-[10px] w-[2px] bg-white shadow-[0_0_0_5px_color-mix(in_oklch,white_18%,transparent)]"
        style={{ left: "42%" }}
      >
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-white px-2 py-1 font-mono text-[10.5px] font-medium whitespace-nowrap text-foreground">
          03:42 · filler cluster
          <span className="absolute -bottom-[4px] left-1/2 size-2 -translate-x-1/2 rotate-45 bg-white" />
        </div>
      </div>
    </div>
  );
}
