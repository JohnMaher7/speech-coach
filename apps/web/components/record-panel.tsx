"use client";

import { useEffect } from "react";
import { Loader2, Pause, Play, RotateCcw, Square } from "lucide-react";

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
          className="w-[3px] bg-foreground transition-[height] duration-75"
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
    <div className="flex min-h-[104px] flex-col items-center justify-center gap-4 border-[1.5px] border-dashed border-muted-foreground/50 bg-muted px-4 py-6 sm:px-5">
      {state === "idle" && (
        <>
          <button
            type="button"
            onClick={() => {
              onError(null);
              void start();
            }}
            className="btn btn-ink"
          >
            <span aria-hidden className="lamp bg-stop" />
            Start recording
          </button>
          <div className="text-[14.5px] text-muted-foreground">
            Records in your browser · auto-stops at 20:00
          </div>
        </>
      )}

      {state === "requesting" && (
        <div className="flex items-center gap-2 text-[15px] text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Allow microphone access…
        </div>
      )}

      {(state === "recording" || state === "paused") && (
        <>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span
                className={`lamp size-3 ${
                  state === "recording"
                    ? "bg-stop [animation:lamp-blink_1.2s_ease-in-out_infinite]"
                    : "bg-caution"
                }`}
              />
              <span className="font-display text-[40px] leading-none font-bold">
                {formatClock(elapsedSec)}
              </span>
            </span>
            <LevelBars levels={levels} />
            {state === "paused" && (
              <span className="text-[15px] font-semibold text-caution-ink">
                Paused
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {state === "recording" ? (
              <button
                type="button"
                onClick={pause}
                className="btn btn-line btn-sm"
              >
                <Pause className="size-[14px]" strokeWidth={2.4} />
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={resume}
                className="btn btn-line btn-sm"
              >
                <Play className="size-[14px]" strokeWidth={2.4} />
                Resume
              </button>
            )}
            <button
              type="button"
              onClick={stop}
              className="btn btn-stop btn-sm"
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
          <div className="text-[14.5px] text-muted-foreground">
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
              className="btn btn-line"
            >
              <RotateCcw className="size-[14px]" strokeWidth={2.4} />
              Re-record
            </button>
            <button
              type="button"
              onClick={handleAnalyzeClick}
              disabled={busy}
              className="btn btn-ink"
            >
              {busy && <Loader2 className="size-4 animate-spin" strokeWidth={2.4} />}
              {analyzeLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
