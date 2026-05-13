import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  AudioLines,
  ListTree,
  MessageSquareDashed,
  PencilLine,
  Quote,
  Timer,
} from "lucide-react";

import { TimelineChart } from "@/components/timeline-chart";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  scoreTone,
  verdict,
  TONE_BADGE,
  TONE_BG,
  TONE_BORDER,
  TONE_TEXT,
  type ScoreTone,
} from "@/lib/scores";
import {
  fetchReport,
  type Action,
  type CategoryScore,
  type Report,
  type Rewrite,
} from "@/lib/api";

type IconType = React.ComponentType<{ className?: string }>;

const CATEGORIES: {
  key: "fillers" | "pacing" | "vocal_variety" | "structure";
  label: string;
  icon: IconType;
}[] = [
  { key: "fillers", label: "Fillers", icon: MessageSquareDashed },
  { key: "pacing", label: "Pacing", icon: Timer },
  { key: "vocal_variety", label: "Vocal variety", icon: AudioLines },
  { key: "structure", label: "Structure", icon: ListTree },
];

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let report: Report;
  try {
    report = await fetchReport(id);
  } catch {
    notFound();
  }

  const { synthesis, metrics, acoustic } = report;
  const overall =
    (synthesis.fillers.score +
      synthesis.pacing.score +
      synthesis.vocal_variety.score +
      synthesis.structure.score) /
    4;

  return (
    <main className="px-6 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <div className="space-y-4">
          <p className="font-mono text-xs text-muted-foreground">
            Report · {report.report_id}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Speech evaluation
          </h1>
          <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base leading-relaxed text-foreground/90">
              {synthesis.summary}
            </p>
            <OverallScore value={overall} />
          </Card>
        </div>

        <section className="space-y-3">
          <SectionHeading>Rubric</SectionHeading>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {CATEGORIES.map(({ key, label, icon }) => (
              <ScoreCard
                key={key}
                label={label}
                icon={icon}
                score={synthesis[key]}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading>Top 3 actions</SectionHeading>
          <ol className="space-y-3">
            {synthesis.top_actions.map((action, i) => (
              <ActionItem key={i} rank={i + 1} action={action} />
            ))}
          </ol>
        </section>

        {synthesis.rewrites.length > 0 && (
          <section className="space-y-3">
            <SectionHeading>Phrasing rewrites</SectionHeading>
            <ul className="space-y-3">
              {synthesis.rewrites.map((rw, i) => (
                <RewriteItem key={i} rewrite={rw} />
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3">
          <SectionHeading>Pitch &amp; pace over time</SectionHeading>
          <Card className="p-4">
            <TimelineChart
              timeline={acoustic.timeline}
              pauses={acoustic.pauses}
              duration_sec={report.duration_sec}
            />
            <p className="mt-2 px-1 text-xs text-muted-foreground">
              <span className="font-medium text-[#6366f1]">Pitch</span> in Hz ·{" "}
              <span className="font-medium text-[#10b981]">words per minute</span>{" "}
              · grey bands mark your longer pauses.
            </p>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionHeading>By the numbers</SectionHeading>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Duration"
              value={`${(report.duration_sec / 60).toFixed(1)} min`}
            />
            <Stat label="Words / min" value={metrics.wpm.toFixed(0)} />
            <Stat label="Fillers" value={metrics.fillers.length.toString()} />
            <Stat
              label="Monotone"
              value={`${Math.round(metrics.monotone_score * 100)}%`}
            />
          </div>
        </section>

        <div className="flex flex-col items-center gap-2 pt-2 text-center">
          <Link
            href="/"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}
          >
            Analyze another speech
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <details className="rounded-xl border bg-card p-4 shadow-sm">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Details
          </summary>
          <div className="mt-3 space-y-3">
            {report.cost && (
              <p className="text-xs text-muted-foreground">
                Generated with one Claude Sonnet call (adaptive thinking) for $
                {report.cost.total_usd.toFixed(4)}.
              </p>
            )}
            <pre className="overflow-auto rounded-lg bg-muted/40 p-3 text-xs">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </main>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function OverallScore({ value }: { value: number }) {
  const tone = scoreTone(value);
  return (
    <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:text-right">
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-full border-[3px]",
          TONE_BORDER[tone]
        )}
      >
        <span
          className={cn(
            "text-2xl font-semibold tabular-nums",
            TONE_TEXT[tone]
          )}
        >
          {value.toFixed(1)}
        </span>
      </div>
      <div>
        <div className={cn("font-semibold", TONE_TEXT[tone])}>
          {verdict(value)}
        </div>
        <div className="text-xs text-muted-foreground">{value.toFixed(1)} / 5 overall</div>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  icon: Icon,
  score,
}: {
  label: string;
  icon: IconType;
  score: CategoryScore;
}) {
  const tone = scoreTone(score.score);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Badge variant={TONE_BADGE[tone]}>{score.score} / 5</Badge>
      </div>
      <ScoreMeter value={score.score} tone={tone} className="mt-4" />
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {score.rationale}
      </p>
    </Card>
  );
}

function ScoreMeter({
  value,
  tone,
  className,
}: {
  value: number;
  tone: ScoreTone;
  className?: string;
}) {
  return (
    <div
      className={cn("flex gap-1.5", className)}
      aria-label={`${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "h-2 flex-1 rounded-full",
            i <= value ? TONE_BG[tone] : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

function ActionItem({ rank, action }: { rank: number; action: Action }) {
  return (
    <li>
      <Card className="flex gap-4 p-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {rank}
        </span>
        <div className="space-y-1">
          <p className="font-medium">{action.title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {action.detail}
          </p>
        </div>
      </Card>
    </li>
  );
}

function RewriteItem({ rewrite }: { rewrite: Rewrite }) {
  return (
    <li>
      <Card className="p-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Quote className="size-3.5" />
          What you said
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-through decoration-muted-foreground/40">
          {rewrite.original}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
          <PencilLine className="size-3.5" />
          Try instead
        </div>
        <p className="mt-1 rounded-lg bg-primary/5 px-3 py-2 text-sm font-medium leading-relaxed">
          {rewrite.suggested}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {rewrite.why}
        </p>
      </Card>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </Card>
  );
}
