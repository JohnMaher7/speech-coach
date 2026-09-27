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
      color = "var(--stop)";
      opacity = 1;
    } else if (i > 70 && i < 76) {
      color = "var(--caution)";
      opacity = 1;
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
      className="relative mt-12 mb-10 flex h-[150px] items-center gap-[3px]"
      aria-hidden
    >
      {bars.map((b, i) => (
        <span
          key={i}
          className="flex-1 origin-center will-change-transform [animation:wave-pulse_1.4s_ease-in-out_infinite]"
          style={{
            minHeight: 3,
            height: `${b.height}%`,
            background: b.color ?? "#E4E6E0",
            opacity: b.opacity ?? 0.55,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}
      <div
        className="absolute -top-[10px] -bottom-[10px] w-[2px] bg-white"
        style={{ left: "42%" }}
      >
        <div className="absolute -top-8 left-0 bg-white px-2 py-1 text-[13px] font-semibold whitespace-nowrap text-foreground">
          03:42 · filler cluster
        </div>
      </div>
    </div>
  );
}
