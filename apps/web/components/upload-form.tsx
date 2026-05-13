"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  FileAudio,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { signUpload, uploadToR2 } from "@/lib/api";

const ACCEPTED_MIME = "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/mp3";
const MAX_BYTES = 100 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Status = "idle" | "signing" | "uploading";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function handleSubmit() {
    if (!file) return;
    setError(null);
    try {
      setStatus("signing");
      const { url, key } = await signUpload(file.type);

      setStatus("uploading");
      await uploadToR2(url, file);

      router.push(`/analyzing/${key}`);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  const busy = status !== "idle";
  const buttonLabel = {
    idle: "Analyze speech",
    signing: "Preparing upload…",
    uploading: "Uploading…",
  }[status];

  return (
    <div className="w-full space-y-4">
      <label
        htmlFor="audio-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy) pickFile(e.dataTransfer.files[0] ?? null);
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-12 text-center shadow-sm transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-accent/40"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <span
          className={`flex size-12 items-center justify-center rounded-full transition-colors ${
            dragOver
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          }`}
        >
          <UploadCloud className="size-6" />
        </span>
        <span className="space-y-1">
          <span className="block font-medium text-foreground">
            Drop your speech recording here
          </span>
          <span className="block text-sm text-muted-foreground">
            or click to browse
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          MP3, WAV, or M4A · up to 100 MB · up to 20 minutes
        </span>
        <input
          ref={inputRef}
          id="audio-input"
          type="file"
          accept={ACCEPTED_MIME}
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
      </label>

      {file && (
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-sm">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileAudio className="size-4" />
          </span>
          <div className="min-w-0 flex-1 truncate">
            <span className="font-medium">{file.name}</span>
            <span className="ml-2 text-muted-foreground">
              {formatSize(file.size)}
            </span>
          </div>
          <button
            type="button"
            onClick={clearFile}
            disabled={busy}
            aria-label="Remove file"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!file || busy}
        className="h-11 w-full text-base font-medium"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
        {buttonLabel}
      </Button>
    </div>
  );
}
