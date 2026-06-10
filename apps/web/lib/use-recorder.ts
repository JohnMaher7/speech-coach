"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "stopped";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

const LEVEL_BANDS = 14;
const LEVEL_INTERVAL_MS = 80;

function friendlyMicError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Microphone access was blocked. Allow it in your browser's site settings and try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No microphone was found. Check your input device and try again.";
  }
  return "Couldn't access the microphone. Try again.";
}

export function useRecorder(opts: {
  maxDurationSec?: number;
  onError?: (message: string) => void;
}) {
  const { maxDurationSec = 20 * 60, onError } = opts;

  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [levels, setLevels] = useState<number[]>(() =>
    new Array<number>(LEVEL_BANDS).fill(0),
  );
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("audio/webm");
  const [autoStopped, setAutoStopped] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef(0);
  const stateRef = useRef<RecorderState>("idle");
  const previewUrlRef = useRef<string | null>(null);
  const lastLevelCommitRef = useRef(0);
  const levelsZeroedRef = useRef(true);
  const freqBufRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const mountedRef = useRef(true);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const setRecorderState = useCallback((next: RecorderState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const releaseResources = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return;
    try {
      rec.stop();
    } catch {
      // Already stopped (e.g. track ended right before).
    }
  }, []);

  const startLoop = useCallback(() => {
    const loop = () => {
      const liveMs =
        stateRef.current === "recording"
          ? performance.now() - segmentStartRef.current
          : 0;
      const elapsed = (accumulatedMsRef.current + liveMs) / 1000;
      setElapsedSec((prev) => {
        const whole = Math.floor(elapsed);
        return whole !== prev ? whole : prev;
      });

      if (elapsed >= maxDurationSec && stateRef.current === "recording") {
        setAutoStopped(true);
        stop();
        return;
      }

      const now = performance.now();
      if (now - lastLevelCommitRef.current >= LEVEL_INTERVAL_MS) {
        lastLevelCommitRef.current = now;
        const analyser = analyserRef.current;
        if (stateRef.current === "recording" && analyser) {
          const buf =
            freqBufRef.current ??
            (freqBufRef.current = new Uint8Array(analyser.frequencyBinCount));
          analyser.getByteFrequencyData(buf);
          const bandSize = Math.floor(buf.length / LEVEL_BANDS);
          const next: number[] = [];
          for (let b = 0; b < LEVEL_BANDS; b++) {
            let sum = 0;
            for (let i = b * bandSize; i < (b + 1) * bandSize; i++) {
              sum += buf[i];
            }
            next.push(sum / bandSize / 255);
          }
          levelsZeroedRef.current = false;
          setLevels(next);
        } else if (!levelsZeroedRef.current) {
          levelsZeroedRef.current = true;
          setLevels(new Array<number>(LEVEL_BANDS).fill(0));
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [maxDurationSec, stop]);

  const reset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    chunksRef.current = [];
    accumulatedMsRef.current = 0;
    setBlob(null);
    setPreviewUrl(null);
    setElapsedSec(0);
    setAutoStopped(false);
    levelsZeroedRef.current = true;
    setLevels(new Array<number>(LEVEL_BANDS).fill(0));
    setRecorderState("idle");
  }, [setRecorderState]);

  const start = useCallback(async () => {
    if (stateRef.current !== "idle" && stateRef.current !== "stopped") return;
    if (stateRef.current === "stopped") reset();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      onErrorRef.current?.(
        "Recording isn't supported in this browser — upload a file instead.",
      );
      return;
    }

    setRecorderState("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      onErrorRef.current?.(friendlyMicError(err));
      setRecorderState("idle");
      return;
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;

    const requestedMime = MIME_CANDIDATES.find((m) =>
      MediaRecorder.isTypeSupported(m),
    );
    const recorder = new MediaRecorder(
      stream,
      requestedMime ? { mimeType: requestedMime } : undefined,
    );
    recorderRef.current = recorder;
    chunksRef.current = [];

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    freqBufRef.current = null;
    if (ctx.state === "suspended") await ctx.resume();

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      if (stateRef.current === "recording") {
        accumulatedMsRef.current += performance.now() - segmentStartRef.current;
      }
      const baseType = (recorder.mimeType || requestedMime || "audio/webm")
        .split(";")[0];
      const recorded = new Blob(chunksRef.current, { type: baseType });
      releaseResources();
      recorderRef.current = null;
      setElapsedSec(Math.floor(accumulatedMsRef.current / 1000));
      if (recorded.size === 0) {
        onErrorRef.current?.("Nothing was recorded. Try again.");
        reset();
        return;
      }
      const url = URL.createObjectURL(recorded);
      previewUrlRef.current = url;
      setMimeType(baseType);
      setBlob(recorded);
      setPreviewUrl(url);
      setRecorderState("stopped");
    };
    const track = stream.getAudioTracks()[0];
    if (track) track.onended = stop;

    recorder.start(1000);
    accumulatedMsRef.current = 0;
    segmentStartRef.current = performance.now();
    setRecorderState("recording");
    startLoop();
  }, [releaseResources, reset, setRecorderState, startLoop, stop]);

  const pause = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "recording") return;
    rec.pause();
    accumulatedMsRef.current += performance.now() - segmentStartRef.current;
    setRecorderState("paused");
  }, [setRecorderState]);

  const resume = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "paused") return;
    rec.resume();
    segmentStartRef.current = performance.now();
    setRecorderState("recording");
  }, [setRecorderState]);

  useEffect(() => {
    const isActive = state === "recording" || state === "paused";
    if (!isActive) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const rec = recorderRef.current;
      if (rec) {
        rec.ondataavailable = null;
        rec.onstop = null;
        if (rec.state !== "inactive") {
          try {
            rec.stop();
          } catch {
            // Best-effort cleanup.
          }
        }
        recorderRef.current = null;
      }
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close().catch(() => {});
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  return {
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
  };
}
