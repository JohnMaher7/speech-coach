"use client";

import { useEffect } from "react";
import {
  ArrowRight,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";

import { useRecorder } from "@/lib/use-recorder";
import { formatSize } from "@/lib/utils";

const MIN_DURATION_SEC = 10;

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildRecordingFile(blob: Blob, mimeType: string): File {
  const ext = mimeType === "audio/mp4" ? "m4a" : "webm";
  const stamp = new Date()
    .toISOString()
    .slice(0, 16)
    .replace("T", "-")
    .replace(":", "");
  return new File([blob], `recording-${stamp}.${ext}`, { type: blob.type });
}

function LevelBars({ levels }: { levels: number[] }) {
  return (
    <div className="flex h-10 items-center gap-[3px]" aria-hidden>
      {levels.map((level, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary transition-[height] duration-75"
          style={{ height: `${Math.max(8, level * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function RecordPanel({
  busy,
  analyzeLabel,
  onAnalyze,
  onError,
  onActiveChange,
}: {
  busy: boolean;
  analyzeLabel: string;
  onAnalyze: (file: File) => void;
  onError: (message: string | null) => void;
  onActiveChange: (active: boolean) => void;
}) {
  const {
    state,
    elapsedSec,
    levels,
    blob,
    previewUrl,
    mimeType,
    autoStopped,
    start,
    pause,
    resume,
    stop,
    reset,
  } = useRecorder({ onError });

  const active =
    state === "requesting" || state === "recording" || state === "paused";

  useEffect(() => {
    onActiveChange(active);
  }, [active, onActiveChange]);

  function handleAnalyzeClick() {
    if (!blob || busy) return;
    if (elapsedSec < MIN_DURATION_SEC) {
      onError(
        "That recording is under 10 seconds — speeches need at least 10 seconds to analyze. Re-record and try again.",
      );
      return;
    }
    onAnalyze(buildRecordingFile(blob, mimeType));
  }

  return (
    <div className="flex min-h-[104px] flex-col items-center justify-center gap-4 rounded-[14px] border-[1.5px] border-dashed border-[oklch(0.85_0.01_264)] bg-[linear-gradient(180deg,oklch(0.995_0.002_264),oklch(0.98_0.003_264))] px-[22px] py-[26px]">
      {state === "idle" && (
        <>
          <button
            type="button"
            onClick={() => {
              onError(null);
              void start();
            }}
            className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[oklch(0.45_0.22_277)]"
          >
            <Mic className="size-[14px]" strokeWidth={2.4} />
            Start recording
          </button>
          <div className="font-mono text-[11.5px] tracking-wide text-muted-foreground">
            Records in your browser · auto-stops at 20:00
          </div>
        </>
      )}

      {state === "requesting" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Allow microphone access…
        </div>
      )}

      {(state === "recording" || state === "paused") && (
        <>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  state === "recording"
                    ? "animate-pulse bg-[oklch(0.6_0.21_25)]"
                    : "bg-muted-foreground"
                }`}
              />
              <span className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
                {formatClock(elapsedSec)}
              </span>
            </span>
            <LevelBars levels={levels} />
            {state === "paused" && (
              <span className="font-mono text-[11.5px] tracking-wide text-muted-foreground uppercase">
                Paused
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {state === "recording" ? (
              <button
                type="button"
                onClick={pause}
                className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Pause className="size-[14px]" strokeWidth={2.4} />
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={resume}
                className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Play className="size-[14px]" strokeWidth={2.4} />
                Resume
              </button>
            )}
            <button
              type="button"
              onClick={stop}
              className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-destructive/40 bg-destructive/10 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              <Square className="size-[14px]" strokeWidth={2.4} />
              Stop
            </button>
          </div>
        </>
      )}

      {state === "stopped" && blob && previewUrl && (
        <>
          <audio controls src={previewUrl} className="w-full" />
          <div className="font-mono text-[11.5px] tracking-wide text-muted-foreground">
            {formatClock(elapsedSec)} · {formatSize(blob.size)}
            {autoStopped && " · stopped at the 20-minute limit"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onError(null);
                reset();
              }}
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-[11px] border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RotateCcw className="size-[14px]" strokeWidth={2.4} />
              Re-record
            </button>
            <button
              type="button"
              onClick={handleAnalyzeClick}
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[oklch(0.45_0.22_277)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? (
                <Loader2 className="size-[14px] animate-spin" strokeWidth={2.4} />
              ) : (
                <ArrowRight className="size-[14px]" strokeWidth={2.4} />
              )}
              {analyzeLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
