"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Pause, TimelinePoint } from "@/lib/api";

const PITCH_COLOR = "#6366f1";
const WPM_COLOR = "#10b981";
const PAUSE_COLOR = "#94a3b8";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type TooltipPayloadEntry = {
  dataKey: string;
  value: number | null;
  color: string;
  name: string;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}) {
  if (!active || !payload?.length || label === undefined) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <div className="font-mono text-muted-foreground">{formatTime(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span>{p.name}:</span>
          <span className="font-medium">
            {p.value === null ? "—" : Math.round(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TimelineChart({
  timeline,
  pauses,
  duration_sec,
}: {
  timeline: TimelinePoint[];
  pauses: Pause[];
  duration_sec: number;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={timeline}
          margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
        >
          <defs>
            <linearGradient id="pitchFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PITCH_COLOR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={PITCH_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            vertical={false}
          />
          <XAxis
            dataKey="t"
            type="number"
            domain={[0, duration_sec]}
            tickFormatter={formatTime}
            tick={{ fontSize: 11 }}
            tickLine={false}
            stroke="currentColor"
            className="text-muted-foreground"
          />
          <YAxis
            yAxisId="pitch"
            orientation="left"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            stroke={PITCH_COLOR}
            label={{
              value: "Pitch (Hz)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: PITCH_COLOR },
            }}
          />
          <YAxis
            yAxisId="wpm"
            orientation="right"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            stroke={WPM_COLOR}
            label={{
              value: "WPM",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 11, fill: WPM_COLOR },
            }}
          />
          {pauses.map((p, i) => (
            <ReferenceArea
              key={i}
              yAxisId="pitch"
              x1={p.start}
              x2={p.end}
              fill={PAUSE_COLOR}
              fillOpacity={0.12}
              stroke="none"
            />
          ))}
          <Tooltip content={<ChartTooltip />} />
          <Area
            yAxisId="pitch"
            type="monotone"
            dataKey="pitch_hz"
            name="Pitch"
            stroke={PITCH_COLOR}
            strokeWidth={2}
            fill="url(#pitchFill)"
            connectNulls={false}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
          <Line
            yAxisId="wpm"
            type="monotone"
            dataKey="wpm_local"
            name="WPM"
            stroke={WPM_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
