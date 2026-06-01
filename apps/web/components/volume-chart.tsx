"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Pause, TimelinePoint } from "@/lib/api";
import { volumeDeviationSeries } from "@/lib/volume-series";

const VOLUME_COLOR = "#f59e0b";
const PAUSE_COLOR = "#94a3b8";
const LONG_PAUSE_COLOR = "#ef4444";
const PAUSE_MIN_SEC = 0.6;
const LONG_PAUSE_SEC = 2.0;
// Fixed, symmetric axis around the speaker's own baseline (mirrors the pitch
// chart's ±8 st clamp). Absolute dB is mic-dependent, so we plot deviation from
// a rolling baseline instead — a flat speaker then reads as a flat line near 0
// rather than being auto-scaled to fill the chart. A genuinely big swell clips
// (allowDataOverflow) instead of rescaling everything.
const VOLUME_AXIS_MIN = -8;
const VOLUME_AXIS_MAX = 8;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatVolumeDelta(db: number): string {
  const rounded = Math.round(db * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)} dB`;
}

function formatVolumeTick(db: number): string {
  const rounded = Math.round(db);
  if (rounded === 0) return "0";
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

type TooltipPayloadEntry = {
  dataKey: string;
  value: number | null;
  color: string;
  name: string;
};

function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}) {
  if (!active || label === undefined || !payload?.length) return null;
  const entry = payload.find((p) => p.value !== null && p.value !== undefined);
  if (!entry) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <div className="font-mono text-muted-foreground">{formatTime(label)}</div>
      <div className="flex items-center gap-2">
        <span
          className="inline-block size-2 rounded-full"
          style={{ background: VOLUME_COLOR }}
        />
        <span>Volume:</span>
        <span className="font-medium">
          {formatVolumeDelta(entry.value as number)}
        </span>
      </div>
    </div>
  );
}

export function VolumeChart({
  timeline,
  pauses,
  duration_sec,
}: {
  timeline: TimelinePoint[];
  pauses: Pause[];
  duration_sec: number;
}) {
  const visiblePauses = pauses.filter((p) => p.end - p.start >= PAUSE_MIN_SEC);
  // Deviation (± dB) from a rolling baseline, smoothed and aligned 1:1 with the
  // timeline. Null where there was silence or a run too short to trust.
  const deviation = volumeDeviationSeries(timeline);
  const data = timeline.map((p, i) => ({ t: p.t, volume_rel: deviation[i] }));
  const hasVolume = deviation.some((v) => v !== null);
  if (!hasVolume) return null;

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 24, bottom: 8, left: 16 }}
        >
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={VOLUME_COLOR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={VOLUME_COLOR} stopOpacity={0.02} />
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
            width={72}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            stroke={VOLUME_COLOR}
            domain={[VOLUME_AXIS_MIN, VOLUME_AXIS_MAX]}
            allowDataOverflow
            tickFormatter={formatVolumeTick}
            label={{
              value: "Volume (± dB)",
              angle: -90,
              position: "insideLeft",
              offset: 14,
              style: { fontSize: 11, fill: VOLUME_COLOR, textAnchor: "middle" },
            }}
          />
          <ReferenceLine
            y={0}
            stroke={VOLUME_COLOR}
            strokeDasharray="3 3"
            strokeOpacity={0.4}
          />
          {visiblePauses.map((p, i) => {
            const isLong = p.end - p.start >= LONG_PAUSE_SEC;
            return (
              <ReferenceArea
                key={i}
                x1={p.start}
                x2={p.end}
                fill={isLong ? LONG_PAUSE_COLOR : PAUSE_COLOR}
                fillOpacity={isLong ? 0.22 : 0.14}
                stroke="none"
              />
            );
          })}
          <Tooltip
            content={(props) => {
              const tp = props as unknown as {
                active?: boolean;
                payload?: TooltipPayloadEntry[];
                label?: number;
              };
              return (
                <VolumeTooltip
                  active={tp.active}
                  payload={tp.payload}
                  label={tp.label}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="volume_rel"
            name="Volume"
            stroke={VOLUME_COLOR}
            strokeWidth={2}
            fill="url(#volumeFill)"
            baseValue={0}
            connectNulls={false}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
