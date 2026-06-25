"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Pause, TimelinePoint } from "@/lib/api";
import { pitchVarietySeries } from "@/lib/pitch-variety";

const PITCH_COLOR = "#6366f1";
const WPM_COLOR = "#10b981";
const PAUSE_COLOR = "#94a3b8";
const LONG_PAUSE_COLOR = "#ef4444";
const PAUSE_MIN_SEC = 0.6;
const LONG_PAUSE_SEC = 2.0;
const WPM_SWEET_LOW = 130;
const WPM_SWEET_HIGH = 160;
// Clamp the pitch axis so a residual outlier (fry frame, brief tracker
// excursion) can't dominate the visual. Real speech intonation rarely
// exceeds ±6 st in continuous delivery; ±8 leaves headroom for the
// genuinely expressive without letting a single spike rescale everything.
const PITCH_AXIS_MIN = -8;
const PITCH_AXIS_MAX = 8;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSemitones(st: number): string {
  const rounded = Math.round(st * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)} st`;
}

function formatPitchTick(st: number): string {
  const rounded = Math.round(st);
  if (rounded === 0) return "0";
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function findPauseAt(t: number, pauses: Pause[]): Pause | null {
  return pauses.find((p) => t >= p.start && t <= p.end) ?? null;
}

type TooltipPayloadEntry = {
  dataKey: string;
  value: number | null;
  color: string;
  name: string;
  payload?: { pitch_st?: number | null };
};

function ChartTooltip({
  active,
  payload,
  label,
  pauses,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
  pauses: Pause[];
}) {
  if (!active || label === undefined) return null;
  const hoveredPause = findPauseAt(label, pauses);
  if (!hoveredPause && !payload?.length) return null;

  const pauseDur = hoveredPause ? hoveredPause.end - hoveredPause.start : 0;
  const pauseIsLong = pauseDur >= LONG_PAUSE_SEC;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <div className="font-mono text-muted-foreground">{formatTime(label)}</div>
      {hoveredPause && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: pauseIsLong ? LONG_PAUSE_COLOR : PAUSE_COLOR }}
          />
          <span>Pause:</span>
          <span className="font-medium">{pauseDur.toFixed(1)}s</span>
        </div>
      )}
      {payload?.map((p) => {
        const isPitch = p.dataKey === "pitch_var";
        // The plotted pitch line is the variety indicator; surface the real
        // pitch (semitones vs. the speaker's average) in the tooltip instead.
        const realPitch = isPitch ? p.payload?.pitch_st : null;
        if (isPitch) {
          if (realPitch === null || realPitch === undefined) return null;
        } else if (p.value === null || p.value === undefined) {
          return null;
        }
        const display = isPitch
          ? formatSemitones(realPitch as number)
          : Math.round(p.value as number).toString();
        return (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: p.color }}
            />
            <span>{p.name}:</span>
            <span className="font-medium">{display}</span>
          </div>
        );
      })}
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
  const visiblePauses = pauses.filter(
    (p) => p.end - p.start >= PAUSE_MIN_SEC,
  );

  const variety = pitchVarietySeries(timeline);
  const data = timeline.map((point, i) => ({ ...point, pitch_var: variety[i] }));

  return (
    <div className="h-56 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 24, bottom: 8, left: 16 }}
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
            width={52}
            tick={{ fontSize: 11 }}
            tickFormatter={formatPitchTick}
            tickLine={false}
            axisLine={false}
            stroke={PITCH_COLOR}
            domain={[PITCH_AXIS_MIN, PITCH_AXIS_MAX]}
            allowDataOverflow
            label={{
              value: "Vocal variety (st)",
              angle: -90,
              position: "insideLeft",
              offset: 14,
              style: {
                fontSize: 11,
                fill: PITCH_COLOR,
                textAnchor: "middle",
              },
            }}
          />
          <YAxis
            yAxisId="wpm"
            orientation="right"
            width={40}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            stroke={WPM_COLOR}
            label={{
              value: "WPM",
              angle: 90,
              position: "insideRight",
              offset: 10,
              style: { fontSize: 11, fill: WPM_COLOR, textAnchor: "middle" },
            }}
          />
          <ReferenceArea
            yAxisId="wpm"
            y1={WPM_SWEET_LOW}
            y2={WPM_SWEET_HIGH}
            fill={WPM_COLOR}
            fillOpacity={0.08}
            stroke={WPM_COLOR}
            strokeOpacity={0.25}
            strokeDasharray="2 3"
            label={{
              value: "sweet spot 130–160 wpm",
              position: "top",
              fill: WPM_COLOR,
              fontSize: 10,
              fillOpacity: 0.9,
              offset: 4,
            }}
            ifOverflow="extendDomain"
          />
          <ReferenceLine
            yAxisId="pitch"
            y={0}
            stroke={PITCH_COLOR}
            strokeDasharray="3 3"
            strokeOpacity={0.4}
          />
          {visiblePauses.map((p, i) => {
            const dur = p.end - p.start;
            const isLong = dur >= LONG_PAUSE_SEC;
            return (
              <ReferenceArea
                key={i}
                yAxisId="pitch"
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
                <ChartTooltip
                  active={tp.active}
                  payload={tp.payload}
                  label={tp.label}
                  pauses={visiblePauses}
                />
              );
            }}
          />
          <Area
            yAxisId="pitch"
            type="linear"
            dataKey="pitch_var"
            name="Pitch"
            baseValue={0}
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
