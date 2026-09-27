"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check, Loader2, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { streamAnalyze, type SpeechType } from "@/lib/api";

const SPEECH_TYPES: readonly SpeechType[] = [
  "prepared",
  "impromptu",
  "presentation",
] as const;

function parseSpeechType(raw: string | null): SpeechType | null {
  return raw && (SPEECH_TYPES as readonly string[]).includes(raw)
    ? (raw as SpeechType)
    : null;
}

const STEPS = [
  { id: "transcribed", label: "Transcribing speech" },
  { id: "acoustic_done", label: "Analyzing audio" },
  { id: "lexical_done", label: "Spotting filler words" },
  { id: "metrics_done", label: "Computing metrics" },
  { id: "synthesis_done", label: "Generating coaching" },
  { id: "saving_report", label: "Saving report" },
] as const;

const STEP_IDS = new Set<string>(STEPS.map((step) => step.id));

const TIPS = [
  "Pauses feel longer to you than to your audience — let them breathe.",
  "“Um” and “uh” usually mean you’re searching for the next idea. Pause instead.",
  "Vary your pitch on the words that matter. Monotone is the fastest way to lose a room.",
  "Aim for roughly 130–160 words a minute. Faster than that and people stop following.",
  "A speech needs a real ending — a callback or a call to action, not “so, yeah, that’s it”.",
];

export default function AnalyzingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useParams<{ key: string[] }>();
  const searchParams = useSearchParams();
  const key = params.key.join("/");
  const speechType = parseSpeechType(searchParams.get("type"));

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [tipIdx, setTipIdx] = useState(0);
  const startedRef = useRef(false);
  const tokenRefreshRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          router.replace("/sign-in");
          return;
        }
        for await (const ev of streamAnalyze(key, token, speechType)) {
          if (ev.event === "done") {
            router.replace(`/report/${ev.data.report_id}?fresh=1`);
            return;
          }
          if (ev.event === "error") {
            setError(ev.data.message);
            return;
          }
          if (ev.event === "synthesis_done" && !tokenRefreshRef.current) {
            tokenRefreshRef.current = getToken({ skipCache: true }).catch(
              () => null,
            );
          }
          if (STEP_IDS.has(ev.event)) {
            setCompleted((prev) => new Set(prev).add(ev.event));
          }
        }
        // The stream ended without a terminal "done"/"error" event (e.g. a
        // proxy idle timeout closed the connection cleanly mid-analysis).
        setError(
          "The connection was interrupted before the analysis finished. Please try again.",
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed.");
      }
    })();
  }, [key, router, speechType, getToken]);

  useEffect(() => {
    if (error) return;
    const t = setInterval(
      () => setTipIdx((i) => (i + 1) % TIPS.length),
      4500
    );
    return () => clearInterval(t);
  }, [error]);

  const activeIdx = STEPS.findIndex((s) => !completed.has(s.id));

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[720px] px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="font-display text-[clamp(44px,6vw,64px)] leading-[0.92] font-bold">
          {error ? "Couldn’t analyze that recording" : "Analyzing your speech"}
        </h1>
        <p className="mt-3 text-[17px] text-muted-foreground">
          {error
            ? "Nothing was saved — give it another go with a different file."
            : "This usually takes about three minutes."}
        </p>

        <div
          role="progressbar"
          aria-label="Analysis progress"
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          aria-valuenow={completed.size}
          className="mt-8 grid grid-cols-6 gap-[3px]"
        >
          {STEPS.map((step, i) => {
            const isDone = completed.has(step.id);
            const isActive = !isDone && i === activeIdx;
            return (
              <span
                key={step.id}
                className={cn(
                  "h-3 transition-colors duration-500",
                  isDone
                    ? "bg-go"
                    : isActive && error
                      ? "bg-stop"
                      : isActive
                        ? "bg-caution [animation:lamp-blink_1.4s_ease-in-out_infinite]"
                        : "bg-lamp-off",
                )}
              />
            );
          })}
        </div>

        <ol className="mt-[3px] divide-y divide-border bg-card">
          {STEPS.map((step, i) => {
            const isDone = completed.has(step.id);
            const isActive = !isDone && i === activeIdx && !error;
            const failed = !isDone && i === activeIdx && Boolean(error);
            return (
              <li
                key={step.id}
                aria-current={isActive ? "step" : undefined}
                className="flex items-center gap-3.5 px-4 py-3 sm:px-5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "lamp",
                    isDone
                      ? "bg-go"
                      : failed
                        ? "bg-stop"
                        : isActive
                          ? "bg-caution"
                          : "bg-lamp-off",
                  )}
                />
                <span
                  className={cn(
                    "text-[16.5px]",
                    isDone
                      ? "text-foreground"
                      : isActive || failed
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {isActive && (
                  <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" />
                )}
                {isDone && <Check className="ml-auto size-4 text-go-ink" strokeWidth={2.6} />}
              </li>
            );
          })}
        </ol>

        {error ? (
          <div className="mt-6 grid gap-4">
            <div
              role="alert"
              className="border-l-[3px] border-stop bg-stop/10 px-4 py-3 text-[15.5px] text-stop-ink"
            >
              {error}
            </div>
            <Link href="/" className="btn btn-line w-full">
              <RefreshCw className="size-4" />
              Try a different recording
            </Link>
          </div>
        ) : (
          <p
            aria-live="polite"
            className="mt-6 border-l-[3px] border-foreground pl-4 text-[17px] leading-[1.55] text-[#2D302D]"
          >
            {TIPS[tipIdx]}
          </p>
        )}
      </div>
    </main>
  );
}
