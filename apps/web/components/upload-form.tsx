"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const ACCEPTED_MIME = "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/mp3";
const MAX_BYTES = 100 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("audio/")) {
      setError("Please upload an audio file (MP3, WAV, or M4A).");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`File is too large (${formatSize(f.size)}). Max is 100 MB.`);
      return;
    }
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit() {
    console.log("submit:", file);
  }

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
          pickFile(e.dataTransfer.files[0] ?? null);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors ${
          dragOver
            ? "border-foreground bg-muted/50"
            : "border-muted-foreground/30 hover:bg-muted/30"
        }`}
      >
        <p className="font-medium">Drop your speech recording here</p>
        <p className="text-sm text-muted-foreground text-center">
          or click to browse · MP3, WAV, M4A · up to 100 MB · up to 20 minutes
        </p>
        <input
          ref={inputRef}
          id="audio-input"
          type="file"
          accept={ACCEPTED_MIME}
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {file && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3 text-sm">
          <div className="truncate">
            <span className="font-medium">{file.name}</span>
            <span className="ml-2 text-muted-foreground">
              {formatSize(file.size)}
            </span>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="text-muted-foreground hover:text-foreground"
          >
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={!file}
        className="w-full"
        size="lg"
      >
        Analyze speech
      </Button>
    </div>
  );
}
