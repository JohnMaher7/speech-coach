"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check, Lightbulb, Loader2, RefreshCw } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
] as const;

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
            router.replace(`/report/${ev.data.report_id}`);
            return;
          }
          if (ev.event === "error") {
            setError(ev.data.message);
            return;
          }
          setCompleted((prev) => new Set(prev).add(ev.event));
        }
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
  const pct = (completed.size / STEPS.length) * 100;

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-20 sm:py-24">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {error ? "Couldn’t analyze that recording" : "Analyzing your speech"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {error
              ? "Nothing was saved — give it another go with a different file."
              : "This usually takes about three minutes."}
          </p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              error ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        <ol className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone = completed.has(step.id);
            const isActive = !isDone && i === activeIdx && !error;
            return (
              <li key={step.id} className="flex items-center gap-3 text-sm">
                <span className="flex size-5 items-center justify-center">
                  {isDone ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  ) : isActive ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <span className="block size-2 rounded-full bg-muted-foreground/30" />
                  )}
                </span>
                <span
                  className={
                    isDone
                      ? "text-foreground"
                      : isActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        {error ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}
            >
              <RefreshCw className="size-4" />
              Try a different recording
            </Link>
          </div>
        ) : (
          <Card className="flex items-start gap-3 bg-muted/30 p-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lightbulb className="size-4" />
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {TIPS[tipIdx]}
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
