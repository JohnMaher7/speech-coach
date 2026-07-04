import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Flag,
  ListTree,
  MessageSquareDashed,
  Pause as PauseIcon,
  PencilLine,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";

import { TimelineChart } from "@/components/timeline-chart";
import { VolumeChart } from "@/components/volume-chart";
import type {
  Beat,
  CategoryKey,
  CategoryScore,
  Priority,
  Report,
  Rewrite,
  Walkthrough,
} from "@/lib/api";
import { scoreTone, verdict, type ScoreTone } from "@/lib/scores";
import { fillerBand, monotoneBand, wpmBand } from "@/lib/metric-bands";

const SPEECH_TYPE_LABEL: Record<string, string> = {
  prepared: "Prepared",
  impromptu: "Impromptu",
  presentation: "Presentation",
};

type IconType = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; icon: IconType }
> = {
  hook: { label: "Hook", icon: Sparkles },
  message_focus: { label: "Message focus", icon: Target },
  structure: { label: "Structure", icon: ListTree },
  closing: { label: "Closing", icon: Flag },
  pacing: { label: "Pacing", icon: Timer },
  pauses: { label: "Pauses", icon: PauseIcon },
  vocal_variety: { label: "Vocal variety", icon: AudioLines },
  language: { label: "Language", icon: MessageSquareDashed },
};

const CATEGORY_ORDER: CategoryKey[] = [
  "hook",
  "message_focus",
  "structure",
  "closing",
  "pacing",
  "pauses",
  "vocal_variety",
  "language",
];

function categoryColor(score: CategoryScore["score"]): string {
  if (score === "n/a") return "var(--muted-foreground)";
  if (score <= 2) return "var(--score-low)";
  if (score === 3) return "var(--score-mid)";
  if (score === 4) return "var(--chart-5)";
  return "var(--primary)";
}

function toneColor(tone: ScoreTone): string {
  if (tone === "good") return "var(--score-good)";
  if (tone === "mid") return "var(--score-mid)";
  return "var(--score-low)";
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReportView({
  report,
  sampleLabel,
}: {
  report: Report;
  sampleLabel?: string;
}) {
  const { synthesis } = report;
  const overall = report.overall.score;

  return (
    <main className="flex-1">
      <HeadlineSection
        report={report}
        overall={overall}
        sampleLabel={sampleLabel}
      />
      <StatDashboard report={report} />
      <WalkthroughSection walkthrough={synthesis.walkthrough} />
      <PrioritiesSection priorities={synthesis.priorities} />
      {synthesis.rewrites.length > 0 && (
        <RewritesSection rewrites={synthesis.rewrites} />
      )}
      <ScorecardSection report={report} />
      <FooterSection report={report} />
    </main>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[22px] flex items-baseline justify-between gap-4">
      <div className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
        <span className="h-px w-[22px] bg-current opacity-50" />
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-[22px] font-serif text-[28px] leading-[1.15] font-medium tracking-[-0.01em]">
      {children}
    </h2>
  );
}

function HeadlineSection({
  report,
  overall,
  sampleLabel,
}: {
  report: Report;
  overall: number;
  sampleLabel?: string;
}) {
  const tone = scoreTone(overall);
  const color = toneColor(tone);
  const wpm = report.metrics.wpm.toFixed(0);
  const wordCount = report.transcript.words.length.toLocaleString();

  return (
    <section className="py-12 pb-6">
      <div className="mx-auto w-full max-w-[920px] px-5 sm:px-8">
        <div className="mb-[18px] flex items-center gap-[10px] font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
          <Link href="/" className="transition-colors hover:text-foreground">
            SpeakGrade
          </Link>
          <span className="opacity-50">/</span>
          <span>Report</span>
          <span className="opacity-50">/</span>
          <span className="truncate">{report.report_id}</span>
          {sampleLabel && (
            <span className="inline-flex items-center gap-[6px] rounded-full border border-[color-mix(in_oklch,var(--primary)_18%,transparent)] bg-accent px-2 py-[2px] text-primary">
              {sampleLabel}
            </span>
          )}
        </div>

        <h1 className="my-[6px] mb-[22px] text-balance font-serif text-[clamp(40px,4.6vw,56px)] leading-[1.02] font-medium tracking-[-0.02em]">
          Speech <em className="font-medium text-primary italic">evaluation.</em>
        </h1>

        <div className="mb-8 flex flex-wrap gap-[22px] font-mono text-[11.5px] text-muted-foreground">
          <span>
            Recorded{" "}
            <b className="font-medium text-foreground">
              {formatDate(report.created_at)}
            </b>
          </span>
          <span>
            <b className="font-medium text-foreground">
              {formatDuration(report.duration_sec)}
            </b>{" "}
            · {wordCount} words · {wpm} wpm
          </span>
          {report.speech_type && (
            <span>
              <b className="font-medium text-foreground">
                {SPEECH_TYPE_LABEL[report.speech_type] ?? report.speech_type}
              </b>
            </span>
          )}
        </div>

        <div className="grid items-center gap-9 rounded-[22px] border border-border bg-card px-9 py-8 shadow-[0_1px_0_rgba(0,0,0,0.02),0_20px_50px_-30px_rgba(20,20,40,0.2)] sm:grid-cols-[1fr_auto]">
          <div>
            <blockquote className="font-serif text-[21px] leading-[1.45] tracking-[-0.005em] text-foreground">
              {report.synthesis.headline}
            </blockquote>
            {report.synthesis.message_sentence && (
              <p className="mt-[18px] text-[13.5px] leading-[1.55] text-[oklch(0.35_0.01_264)]">
                <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">
                  Core message ·{" "}
                </span>
                <em className="font-serif text-[15px] not-italic">
                  &ldquo;{report.synthesis.message_sentence}&rdquo;
                </em>
              </p>
            )}
          </div>
          <div className="text-center">
            <div
              className="mb-[10px] inline-flex size-24 flex-col items-center justify-center rounded-full border-[4px]"
              style={{ borderColor: color, color }}
            >
              <b className="font-serif text-[36px] leading-none font-medium tabular-nums">
                {overall.toFixed(1)}
              </b>
              <span className="mt-1 font-mono text-[9.5px] tracking-[0.1em] uppercase opacity-80">
                Overall
              </span>
            </div>
            <div className="text-[13.5px] font-semibold" style={{ color }}>
              {verdict(overall)}
            </div>
            <div className="mt-0.5 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              {overall.toFixed(1)} / 5
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WalkthroughSection({ walkthrough }: { walkthrough: Walkthrough }) {
  const beats: { label: string; beat: Beat }[] = [
    { label: "Opening", beat: walkthrough.opening },
    ...walkthrough.body.map((b, i) => ({ label: `Beat ${i + 1}`, beat: b })),
    { label: "Close", beat: walkthrough.close },
  ];

  return (
    <section className="py-14 pb-0">
      <div className="mx-auto w-full max-w-[920px] px-5 sm:px-8">
        <SectionEyebrow>Walk-through · how it unfolded</SectionEyebrow>
        <SectionTitle>
          Listen back to{" "}
          <em className="font-medium text-primary italic">how it ran</em>.
        </SectionTitle>

        <ol className="grid gap-3">
          {beats.map(({ label, beat }, i) => (
            <BeatCard key={i} label={label} beat={beat} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function BeatCard({ label, beat }: { label: string; beat: Beat }) {
  return (
    <li className="grid grid-cols-1 items-start gap-2 rounded-[18px] border border-border bg-card px-5 py-[18px] sm:grid-cols-[110px_1fr] sm:gap-4">
      <div className="flex flex-col gap-[6px] font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
        <span className="font-semibold text-foreground">{label}</span>
        <span>
          {formatDuration(beat.start_t)} – {formatDuration(beat.end_t)}
        </span>
        {beat.quote_t !== null && (
          <span className="text-primary">@ {formatDuration(beat.quote_t)}</span>
        )}
      </div>
      <div className="space-y-[10px]">
        <p className="text-[14.5px] leading-[1.55] text-foreground">
          {beat.observation}
        </p>
        {beat.praise && (
          <p
            className="rounded-md border-l-2 px-3 py-[7px] text-[13px] leading-[1.55]"
            style={{
              borderColor: "var(--score-good)",
              background: "color-mix(in oklch, var(--score-good) 8%, var(--card))",
              color: "oklch(0.32 0.01 264)",
            }}
          >
            <b className="font-medium" style={{ color: "var(--score-good)" }}>
              Strong.
            </b>{" "}
            {beat.praise}
          </p>
        )}
        {beat.critique && (
          <p
            className="rounded-md border-l-2 px-3 py-[7px] text-[13px] leading-[1.55]"
            style={{
              borderColor: "var(--score-low)",
              background: "color-mix(in oklch, var(--score-low) 8%, var(--card))",
              color: "oklch(0.32 0.01 264)",
            }}
          >
            <b className="font-medium" style={{ color: "var(--score-low)" }}>
              Watch.
            </b>{" "}
            {beat.critique}
          </p>
        )}
      </div>
    </li>
  );
}


function PrioritiesSection({ priorities }: { priorities: Priority[] }) {
  return (
    <section className="py-14 pb-0">
      <div className="mx-auto w-full max-w-[920px] px-5 sm:px-8">
        <SectionEyebrow>
          Top {priorities.length}{" "}
          {priorities.length === 1 ? "priority" : "priorities"} · ranked
        </SectionEyebrow>
        <SectionTitle>Work on these next.</SectionTitle>

        <div className="grid gap-3">
          {priorities.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-[36px_1fr] items-start gap-4 rounded-[18px] border border-border bg-card px-5 py-[18px]"
            >
              <div className="mt-[2px] flex size-[30px] items-center justify-center rounded-full bg-foreground text-[13px] font-semibold text-background">
                {i + 1}
              </div>
              <div>
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.005em]">
                  {p.title}
                </h3>
                <p className="text-[14px] leading-[1.6] text-[oklch(0.35_0.01_264)]">
                  {p.observation}
                </p>
                <p className="mt-2 rounded-md border-l-2 border-primary/40 bg-accent/40 px-3 py-2 font-serif text-[14.5px] leading-[1.5] text-foreground italic">
                  &ldquo;{p.example_quote}&rdquo;
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground not-italic">
                    @ {formatDuration(p.example_t)}
                  </span>
                </p>
                <p className="mt-2 text-[13.5px] leading-[1.55] text-[oklch(0.35_0.01_264)]">
                  <b className="font-medium text-foreground">Why.</b>{" "}
                  {p.why_it_matters}
                </p>
                <p className="mt-1 text-[13.5px] leading-[1.55] text-[oklch(0.35_0.01_264)]">
                  <b className="font-medium text-foreground">Drill.</b>{" "}
                  {p.drill}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RewritesSection({ rewrites }: { rewrites: Rewrite[] }) {
  return (
    <section className="py-14 pb-0">
      <div className="mx-auto w-full max-w-[920px] px-5 sm:px-8">
        <div className="mb-[22px] flex items-baseline justify-between gap-4">
          <div className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            <span className="h-px w-[22px] bg-current opacity-50" />
            Phrasing rewrites · {rewrites.length}{" "}
            {rewrites.length === 1 ? "example" : "examples"}
          </div>
        </div>
        <SectionTitle>
          Say it like{" "}
          <em className="font-medium text-primary italic">this</em> instead.
        </SectionTitle>

        <div className="grid gap-[14px]">
          {rewrites.map((rw, i) => (
            <article
              key={i}
              className="rounded-[18px] border border-border bg-card px-[22px] py-5"
            >
              <div className="inline-flex items-center gap-[7px] font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">
                <MessageSquareDashed className="size-3" strokeWidth={2} />
                What you said
              </div>
              <p className="mt-2 font-serif text-[17px] leading-[1.45] text-muted-foreground italic line-through decoration-muted-foreground/40">
                {rw.original}
              </p>
              <div className="mt-[14px] inline-flex items-center gap-[7px] font-mono text-[10.5px] tracking-[0.1em] text-primary uppercase">
                <PencilLine className="size-3" strokeWidth={2} />
                Try instead
              </div>
              <p className="mt-[14px] rounded-xl border-l-[3px] border-primary bg-accent px-[18px] py-[14px] font-serif text-[19px] leading-[1.4] font-medium tracking-[-0.005em] text-foreground">
                {rw.suggested}
              </p>
              <p className="mx-[2px] mt-3 text-[13.5px] leading-[1.5] text-[oklch(0.35_0.01_264)]">
                <b className="font-medium text-foreground">Why.</b> {rw.why}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScorecardSection({ report }: { report: Report }) {
  const { synthesis, acoustic, duration_sec } = report;
  const pauseLabel = `${acoustic.pauses.length} ${
    acoustic.pauses.length === 1 ? "pause" : "pauses"
  } marked`;

  return (
    <section className="py-14 pb-0">
      <div className="mx-auto w-full max-w-[920px] px-5 sm:px-8">
        <SectionEyebrow>Scorecard · eight categories</SectionEyebrow>
        <SectionTitle>How you scored.</SectionTitle>

        <div className="grid gap-3">
          {CATEGORY_ORDER.map((key) => (
            <CategoryCard key={key} catKey={key} cat={synthesis.categories[key]} />
          ))}
        </div>

        <div className="mt-10">
          <div className="mb-[22px] flex items-baseline justify-between gap-4">
            <div className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
              <span className="h-px w-[22px] bg-current opacity-50" />
              Pitch &amp; pace over time
            </div>
            <div className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              {formatDuration(duration_sec)} total · {pauseLabel}
            </div>
          </div>

          <div className="rounded-[18px] border border-border bg-card px-6 pt-6 pb-[18px]">
            <div className="mb-4 flex flex-wrap gap-[22px] text-[12.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-[3px] bg-primary" />
                <b className="font-medium text-foreground">Vocal variety</b> · pitch above/below your baseline
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-3 rounded-[3px]"
                  style={{ background: "var(--score-good)" }}
                />
                <b className="font-medium text-foreground">Words per minute</b>
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-3 rounded-[3px]"
                  style={{
                    background:
                      "color-mix(in oklch, var(--muted-foreground) 30%, var(--border))",
                  }}
                />
                <b className="font-medium text-foreground">Pause</b> (≥ 0.6s)
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-3 rounded-[3px]"
                  style={{ background: "#ef4444" }}
                />
                <b className="font-medium text-foreground">Long pause</b> (≥ 2s)
              </span>
            </div>

            <TimelineChart
              timeline={acoustic.timeline}
              pauses={acoustic.pauses}
              duration_sec={duration_sec}
            />

            <p className="mt-[10px] px-1 text-[12px] leading-[1.5] text-muted-foreground">
              <span className="font-medium text-primary">Vocal variety</span> — flat
              at your baseline, spiking when your pitch moves notably higher or
              lower (hover for the actual pitch) ·{" "}
              <span
                className="font-medium"
                style={{ color: "var(--score-good)" }}
              >
                words per minute
              </span>{" "}
              with the 130–160 sweet spot highlighted · grey bands are pauses
              ≥ 0.6s, red bands are long pauses ≥ 2s (hover for duration).
            </p>

            <VolumeChart
              timeline={acoustic.timeline}
              pauses={acoustic.pauses}
              duration_sec={duration_sec}
            />

            <p className="mt-[10px] px-1 text-[12px] leading-[1.5] text-muted-foreground">
              <span
                className="font-medium"
                style={{ color: "#f59e0b" }}
              >
                Volume
              </span>{" "}
              as <em>± decibels from your recent delivery</em>, not absolute
              loudness — so it doesn&apos;t depend on your mic. The line sits near
              0 when you hold a steady level; peaks above it are where you pushed
              louder for emphasis, dips below where you dropped softer. The line
              breaks on silences.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  catKey,
  cat,
}: {
  catKey: CategoryKey;
  cat: CategoryScore;
}) {
  const meta = CATEGORY_META[catKey];
  const Icon = meta.icon;
  const color = categoryColor(cat.score);
  const scoreLabel = cat.score === "n/a" ? "n/a" : `${cat.score} / 5`;
  const filled = cat.score === "n/a" || typeof cat.score !== "number" ? 0 : cat.score;

  return (
    <article
      className="rounded-[18px] border border-border bg-card px-[22px] py-5"
      style={{ color }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-[10px] text-foreground">
          <span
            className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px]"
            style={{
              background: "color-mix(in oklch, currentColor 14%, var(--card))",
              color,
            }}
          >
            <Icon className="size-4" strokeWidth={2} />
          </span>
          <b className="truncate text-[15px] font-semibold tracking-[-0.005em] text-foreground">
            {meta.label}
          </b>
        </div>
        <span
          className="shrink-0 rounded-full border px-3 py-[3px] font-mono text-[11.5px] font-medium"
          style={{
            background: "color-mix(in oklch, currentColor 12%, var(--card))",
            borderColor: "color-mix(in oklch, currentColor 22%, transparent)",
            color,
          }}
        >
          {scoreLabel}
        </span>
      </div>

      <div className="mt-[16px] flex gap-[5px]" style={{ color }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-[6px] flex-1 rounded-[3px]"
            style={{
              background: i < filled ? "currentColor" : "oklch(0.95 0.005 264)",
            }}
          />
        ))}
      </div>

      <p className="mt-[14px] text-[14px] leading-[1.6] text-[oklch(0.35_0.01_264)]">
        {cat.rationale}
      </p>

      {cat.counts.length > 0 && (
        <div className="mt-[14px] flex flex-wrap gap-[8px]">
          {cat.counts.map((c) => (
            <span
              key={c.label}
              className="rounded-full border border-border bg-background px-3 py-[3px] font-mono text-[11px] tracking-[0.04em] text-foreground"
            >
              <b className="font-medium">{c.label}</b>{" "}
              <span className="text-muted-foreground">×{c.count}</span>
            </span>
          ))}
        </div>
      )}

      {cat.evidence.length > 0 && (
        <ul className="mt-[14px] grid gap-[8px]">
          {cat.evidence.map((ev, i) => (
            <li
              key={i}
              className="rounded-md border-l-2 border-primary/40 bg-accent/40 px-3 py-2 font-serif text-[14px] leading-[1.5] text-foreground italic"
            >
              &ldquo;{ev.quote}&rdquo;
              <span className="ml-2 font-mono text-[11px] text-muted-foreground not-italic">
                @ {formatDuration(ev.t)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {cat.score === "n/a" && cat.applicability_reason && (
        <p className="mt-[12px] font-mono text-[11.5px] text-muted-foreground">
          {cat.applicability_reason}
        </p>
      )}
    </article>
  );
}

function FooterSection({ report }: { report: Report }) {
  return (
    <section className="py-14 pb-20">
      <div className="mx-auto w-full max-w-[920px] px-5 sm:px-8">
        <div className="flex flex-col items-center gap-[14px] text-center">
          <Link
            href="/"
            className="inline-flex h-[52px] items-center gap-[10px] rounded-xl bg-foreground px-[26px] text-[15px] font-medium text-background transition-colors hover:bg-[oklch(0.22_0.01_264)]"
          >
            Analyze another speech
            <ArrowRight className="size-4" strokeWidth={2.2} />
          </Link>
        </div>

        <details className="mt-9 rounded-xl border border-border bg-card px-5 py-4 text-[13.5px] text-muted-foreground">
          <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <span>Details · raw report data</span>
            <span className="font-mono text-muted-foreground">+</span>
          </summary>
          <div className="mt-[14px] border-t border-border pt-[14px] text-[12.5px] leading-[1.6]">
            Deepgram transcription, Parselmouth + librosa acoustic pass,
            annotated transcript, schema v{report.schema_version}.
            <pre className="mt-3 overflow-x-auto rounded-lg bg-[oklch(0.97_0.003_264)] px-[14px] py-3 font-mono text-[11px] text-[oklch(0.35_0.01_264)]">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  unit,
  valueColor,
  context,
}: {
  label: string;
  value: string;
  unit?: string;
  valueColor?: string;
  context?: string;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-card px-5 py-[18px]">
      <div className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </div>
      <div
        className="mt-2 font-serif text-[28px] leading-none font-medium tracking-[-0.01em] tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
        {unit && (
          <small className="ml-1 font-mono text-[12px] font-normal text-muted-foreground">
            {unit}
          </small>
        )}
      </div>
      {context && (
        <div className="mt-[8px] font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
          {context}
        </div>
      )}
    </div>
  );
}

function PauseStat({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div>
      <div className="font-serif text-[26px] leading-none font-medium tracking-[-0.01em] tabular-nums">
        {value}
      </div>
      <div className="mt-[7px] font-mono text-[11px] tracking-[0.03em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function StatDashboard({ report }: { report: Report }) {
  const { metrics, duration_sec, transcript } = report;
  const wordCount = transcript.words.length;
  const monotonePct = Math.round(metrics.monotone_score * 100);

  const wpm = wpmBand(metrics.wpm);
  const fillers = fillerBand(metrics.filler_per_min);
  const mono = monotoneBand(monotonePct);

  const pausePct =
    duration_sec > 0
      ? Math.round((metrics.total_pause_sec / duration_sec) * 100)
      : 0;

  return (
    <section className="pb-2">
      <div className="mx-auto w-full max-w-[920px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-[14px] min-[360px]:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Duration"
            value={formatDuration(duration_sec)}
            context={`${wordCount.toLocaleString()} words`}
          />
          <Stat
            label="Words / min"
            value={metrics.wpm.toFixed(0)}
            valueColor={toneColor(wpm.tone)}
            context={wpm.label}
          />
          <Stat
            label="Fillers"
            value={metrics.fillers.length.toString()}
            valueColor={toneColor(fillers.tone)}
            context={`${metrics.filler_per_min.toFixed(1)}/min · ${fillers.label}`}
          />
          <Stat
            label="Monotone"
            value={monotonePct.toString()}
            unit="%"
            valueColor={toneColor(mono.tone)}
            context={`${mono.label} · lower is better`}
          />
        </div>

        <div className="mt-[14px] rounded-[12px] border border-border bg-card px-5 py-[18px]">
          <div className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground uppercase">
            Pauses
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <PauseStat value={metrics.pauses_over_0_6} label="≥ 0.6s · deliberate" />
            <PauseStat value={metrics.pauses_over_2} label="≥ 2s · long" />
            <PauseStat
              value={`${metrics.total_pause_sec.toFixed(1)}s`}
              label={`total silence · ${pausePct}% of talk`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
