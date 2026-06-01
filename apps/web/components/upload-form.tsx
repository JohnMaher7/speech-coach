"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  AlertCircle,
  ArrowRight,
  FileAudio,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

import { signUpload, uploadToR2, warmUpApi, type SpeechType } from "@/lib/api";

const ACCEPTED_MIME = "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/mp3";
const MAX_BYTES = 100 * 1024 * 1024;

const SPEECH_TYPES: { value: SpeechType; label: string; hint: string }[] = [
  {
    value: "prepared",
    label: "Prepared",
    hint: "Rehearsed talk with a planned structure.",
  },
  {
    value: "impromptu",
    label: "Impromptu",
    hint: "Off-the-cuff — closing is graded leniently.",
  },
  {
    value: "presentation",
    label: "Presentation",
    hint: "Likely supports slides; structure anchored on signposting.",
  },
];

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Status = "idle" | "signing" | "uploading";

export function UploadForm() {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [speechType, setSpeechType] = useState<SpeechType>("prepared");
  const inputRef = useRef<HTMLInputElement>(null);
  const warmupStartedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || warmupStartedRef.current) return;
    warmupStartedRef.current = true;

    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token || cancelled) return;
      await warmUpApi(token);
    })().catch(() => {
      // Warmup is opportunistic; upload/analyze still does the real error handling.
    });

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  function pickFile(f: File | null) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("audio/")) {
      setError("Please upload an audio file (MP3, WAV, or M4A).");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`That file is ${formatSize(f.size)} — the limit is 100 MB.`);
      return;
    }
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleAnalyze() {
    if (busy) return;
    // Analysis requires an account. Signed-out visitors are sent to sign in.
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    if (!file) {
      openPicker();
      return;
    }
    setError(null);
    try {
      setStatus("signing");
      const token = await getToken();
      if (!token) {
        setStatus("idle");
        router.push("/sign-in");
        return;
      }
      const { url, key } = await signUpload(file.type, token);
      setStatus("uploading");
      await uploadToR2(url, file);
      router.push(`/analyzing/${key}?type=${speechType}`);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  const busy = status !== "idle";
  const buttonLabel = {
    idle: !isSignedIn ? "Sign in to analyze" : file ? "Analyze" : "Choose file",
    signing: "Preparing…",
    uploading: "Uploading…",
  }[status];

  return (
    <div
      id="upload"
      className="rounded-[18px] border border-border bg-card p-[18px] shadow-[0_1px_0_rgba(0,0,0,0.02),0_12px_28px_-20px_rgba(20,20,40,0.18)] transition-[border-color,box-shadow] duration-150 hover:border-[color-mix(in_oklch,var(--primary)_35%,var(--border))] hover:shadow-[0_1px_0_rgba(0,0,0,0.02),0_18px_36px_-22px_color-mix(in_oklch,var(--primary)_30%,transparent)]"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!busy && !file) openPicker();
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy && !file) {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy) pickFile(e.dataTransfer.files[0] ?? null);
        }}
        className={`flex items-center gap-[18px] rounded-[14px] border-[1.5px] border-dashed px-[22px] py-[26px] transition-colors ${
          dragOver
            ? "border-primary bg-accent/60"
            : "border-[oklch(0.85_0.01_264)] bg-[linear-gradient(180deg,oklch(0.995_0.002_264),oklch(0.98_0.003_264))]"
        } ${busy || file ? "cursor-default" : "cursor-pointer"}`}
      >
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
          {file ? (
            <FileAudio className="size-5" strokeWidth={2} />
          ) : (
            <UploadCloud className="size-5" strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          {file ? (
            <>
              <div className="truncate text-[15px] font-semibold text-foreground">
                {file.name}
              </div>
              <div className="mt-1 font-mono text-[11.5px] tracking-wide text-muted-foreground">
                {formatSize(file.size)} · ready to analyze
              </div>
            </>
          ) : (
            <>
              <div className="text-[15px] font-semibold text-foreground">
                Drop a recording, or click to browse
              </div>
              <div className="mt-1 font-mono text-[11.5px] tracking-wide text-muted-foreground">
                MP3 · WAV · M4A · up to 100 MB · up to 20 min
              </div>
            </>
          )}
        </div>
        {file && !busy && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            aria-label="Remove file"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAnalyze();
          }}
          disabled={busy}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[11px] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[oklch(0.45_0.22_277)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? (
            <Loader2 className="size-[14px] animate-spin" strokeWidth={2.4} />
          ) : (
            <ArrowRight className="size-[14px]" strokeWidth={2.4} />
          )}
          {buttonLabel}
        </button>
        <input
          ref={inputRef}
          id="audio-input"
          type="file"
          accept={ACCEPTED_MIME}
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
      </div>

      <fieldset
        className="mt-[14px] flex flex-wrap items-center gap-[10px] px-[6px]"
        disabled={busy}
      >
        <legend className="mr-2 font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">
          Type
        </legend>
        {SPEECH_TYPES.map((opt) => {
          const selected = speechType === opt.value;
          return (
            <label
              key={opt.value}
              title={opt.hint}
              className={`inline-flex cursor-pointer items-center rounded-full border px-[14px] py-[5px] text-[12.5px] font-medium transition-colors ${
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              } ${busy ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="speech-type"
                value={opt.value}
                checked={selected}
                onChange={() => setSpeechType(opt.value)}
                className="sr-only"
                disabled={busy}
              />
              {opt.label}
            </label>
          );
        })}
      </fieldset>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
