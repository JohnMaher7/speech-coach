import {
  AudioLines,
  ListTree,
  MessageSquareDashed,
  Timer,
  TrendingUp,
  UploadCloud,
  WandSparkles,
} from "lucide-react";

import { UploadForm } from "@/components/upload-form";
import { Card } from "@/components/ui/card";

type IconType = React.ComponentType<{ className?: string }>;

const STEPS: { icon: IconType; title: string; body: string }[] = [
  {
    icon: UploadCloud,
    title: "Upload a recording",
    body: "An MP3, WAV, or M4A of any talk — up to twenty minutes.",
  },
  {
    icon: WandSparkles,
    title: "Rhetor analyses it",
    body: "Transcription, acoustic measurements, and an AI evaluator — about ten seconds.",
  },
  {
    icon: TrendingUp,
    title: "Get coached",
    body: "An evaluator-style report with the three things to work on next.",
  },
];

const FEATURES: { icon: IconType; title: string; body: string }[] = [
  {
    icon: MessageSquareDashed,
    title: "Fillers",
    body: "Every “um”, “uh”, “like”, and “you know” — counted and timestamped.",
  },
  {
    icon: Timer,
    title: "Pacing",
    body: "Words per minute over the whole talk, plus where your deliberate pauses landed.",
  },
  {
    icon: AudioLines,
    title: "Vocal variety",
    body: "Pitch range and energy — are you landing emphasis, or droning in one note?",
  },
  {
    icon: ListTree,
    title: "Structure",
    body: "Opening, signposting, and whether the close actually closes the talk.",
  },
];

export default function Home() {
  return (
    <main className="px-6">
      <section className="mx-auto w-full max-w-2xl pt-16 pb-10 text-center sm:pt-20">
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          Free to use — no account needed
        </span>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Get an evaluator&apos;s notes on any speech.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
          Upload a recording. In about ten seconds, Rhetor returns a structured
          report on fillers, pacing, vocal variety, and structure — plus the
          three things to work on next.
        </p>
      </section>

      <section className="mx-auto w-full max-w-xl pb-12">
        <UploadForm />
      </section>

      <section className="mx-auto w-full max-w-3xl pb-14">
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title}>
              <Card className="h-full p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-3xl pb-20">
        <h2 className="text-center text-sm font-medium uppercase tracking-wide text-muted-foreground">
          What you&apos;ll get
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="flex gap-4 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
