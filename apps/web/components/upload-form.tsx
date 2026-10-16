"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  AlertCircle,
  FileAudio,
  Loader2,
  Mic,
  UploadCloud,
  X,
} from "lucide-react";

import {
  fetchBillingStatus,
  signUpload,
  uploadToR2,
  warmUpApi,
  type SpeechType,
} from "@/lib/api";
import { RecordPanel } from "@/components/record-panel";
import { formatSize } from "@/lib/utils";

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

type Status = "idle" | "signing" | "uploading";

type Mode = "upload" | "record";

export function UploadForm() {
  const router = useRouter();
  const { isSignedIn, has, getToken } = useAuth();
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [speechType, setSpeechType] = useState<SpeechType>("prepared");
  const [mode, setMode] = useState<Mode>("upload");
  const [recorderActive, setRecorderActive] = useState(false);
  const [hasStripePlan, setHasStripePlan] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const { active } = await fetchBillingStatus(token);
      if (!cancelled) setHasStripePlan(active);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);
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

  // Returns true if it redirected (signed-out → /sign-in, no plan → /pricing).
  function redirectIfGated(): boolean {
    // Analysis requires an account. Signed-out visitors are sent to sign in.
    if (!isSignedIn) {
      router.push("/sign-in");
      return true;
    }
    // ...and an active plan or trial. Unsubscribed users go to pricing. The
    // backend enforces this too (402), so this is just the friendly path.
    if (!isSubscribed) {
      router.push("/pricing");
      return true;
    }
    return false;
  }

  async function startAnalysis(f: File) {
    if (busy || redirectIfGated()) return;
    setError(null);
    try {
      setStatus("signing");
      const token = await getToken();
      if (!token) {
        setStatus("idle");
        router.push("/sign-in");
        return;
      }
      const { url, key } = await signUpload(f.type, token);
      setStatus("uploading");
      await uploadToR2(url, f);
      router.push(`/analyzing/${key}?type=${speechType}`);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  async function handleAnalyze() {
    if (busy) return;
    if (redirectIfGated()) return;
    if (!file) {
      openPicker();
      return;
    }
    await startAnalysis(file);
  }

  const busy = status !== "idle";
  // Comp accounts and legacy Clerk Billing subscribers are known from the
  // session instantly; Stripe subscribers once /billing/status answers.
  const hasComp = Boolean(user?.publicMetadata?.compAccess);
  const isSubscribed = Boolean(
    isSignedIn && (hasComp || has?.({ plan: "pro" }) || hasStripePlan),
  );
  const buttonLabel = {
    idle: !isSignedIn
      ? "Sign in to analyze"
      : !isSubscribed
        ? "Start free trial"
        : file
          ? "Analyze"
          : "Choose file",
    signing: "Preparing…",
    uploading: "Uploading…",
  }[status];
  const recordAnalyzeLabel = {
    idle: !isSignedIn
      ? "Sign in to analyze"
      : !isSubscribed
        ? "Start free trial"
        : "Analyze",
    signing: "Preparing…",
    uploading: "Uploading…",
  }[status];

  const MODES: { value: Mode; label: string; icon: typeof UploadCloud }[] = [
    { value: "upload", label: "Upload", icon: UploadCloud },
    { value: "record", label: "Record", icon: Mic },
  ];

  const selectedType = SPEECH_TYPES.find((t) => t.value === speechType);

  return (
    <div
      id="upload"
      className="surface scroll-mt-24 p-3 shadow-lift sm:p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div
        role="tablist"
        aria-label="Audio source"
        className="seg"
      >
        {MODES.map((m) => {
          const selected = mode === m.value;
          const locked = busy || recorderActive;
          const Icon = m.icon;
          return (
            <button
              key={m.value}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={locked && !selected}
              title={recorderActive && !selected ? "Stop recording first" : undefined}
              onClick={() => {
                if (mode === m.value) return;
                setError(null);
                setMode(m.value);
              }}
              className="seg-item"
            >
              <Icon className="size-4" strokeWidth={1.8} />
              {m.label}
            </button>
          );
        })}
      </div>
      <span className="pr-1 text-[13px] text-muted-foreground">
        MP3 · WAV · M4A · up to 20 min
      </span>
      </div>

      {mode === "record" && (
        <RecordPanel
          busy={busy}
          analyzeLabel={recordAnalyzeLabel}
          onAnalyze={(f) => void startAnalysis(f)}
          onError={setError}
          onActiveChange={setRecorderActive}
        />
      )}

      {mode === "upload" && (
        <div
          role="button"
          tabIndex={0}
          aria-label={file ? `Selected file ${file.name}` : "Choose an audio file"}
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
          className={`flex flex-wrap items-center gap-4 rounded-2xl border border-dashed px-4 py-4 transition-colors sm:px-5 sm:py-5 ${
            dragOver
              ? "border-foreground/50 bg-muted"
              : "border-border-strong bg-background hover:border-foreground/30"
          } ${busy || file ? "cursor-default" : "cursor-pointer"}`}
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-soft">
            {file ? (
              <FileAudio className="size-[18px]" strokeWidth={1.8} />
            ) : (
              <UploadCloud className="size-[18px]" strokeWidth={1.8} />
            )}
          </span>
          <div className="min-w-0 flex-1 basis-[220px]">
            {file ? (
              <>
                <div className="truncate text-[15.5px] font-medium">{file.name}</div>
                <div className="mt-0.5 text-[13.5px] text-muted-foreground">
                  {formatSize(file.size)} · ready to analyze
                </div>
              </>
            ) : (
              <>
                <div className="text-[15.5px] font-medium">
                  Drop a recording, or click to browse
                </div>
                <div className="mt-0.5 text-[13.5px] text-muted-foreground">
                  Any talk up to 100 MB · your audio is deleted after analysis
                </div>
              </>
            )}
          </div>
          <div className="flex basis-full items-center gap-2">
            {file && !busy && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                aria-label="Remove file"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-strong bg-card transition-colors hover:bg-muted"
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
              className="btn btn-ink btn-lg flex-1"
            >
              {busy && <Loader2 className="size-4 animate-spin" strokeWidth={2.4} />}
              {buttonLabel}
            </button>
          </div>
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
      )}

      <fieldset className="mt-3 px-1 pb-1" disabled={busy}>
        <legend className="sr-only">Type</legend>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span aria-hidden className="text-[13.5px] font-medium text-muted-foreground">
            Speech type
          </span>
          <div className="seg">
            {SPEECH_TYPES.map((opt) => {
              const selected = speechType === opt.value;
              return (
                <label
                  key={opt.value}
                  title={opt.hint}
                  className={`seg-item h-7 px-3 text-[13.5px] ${busy ? "cursor-not-allowed opacity-60" : ""}`}
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
          </div>
        </div>
        {selectedType && (
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            {selectedType.hint}
          </p>
        )}
      </fieldset>

      {error && (
        <div
          role="alert"
          className="alert-stop mt-3 flex items-start gap-2.5 px-4 py-3 text-[14.5px]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
