import Link from "next/link";

import { ScoreRing, SectionHead, SignalBar, Lamp, Tally, TONE_INK } from "@/components/signal";
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

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  hook: "Hook",
  message_focus: "Message focus",
  structure: "Structure",
  closing: "Closing",
  pacing: "Pacing",
  pauses: "Pauses",
  vocal_variety: "Vocal variety",
  language: "Language",
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

const LONG_PAUSE_SEC = 2;

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

function beatTone(beat: Beat): ScoreTone {
  return beat.praise && !beat.critique ? "good" : "mid";
}

function walkthroughBeats(walkthrough: Walkthrough) {
  return [
    { label: "Opening", beat: walkthrough.opening },
    ...walkthrough.body.map((b, i) => ({ label: `Beat ${i + 1}`, beat: b })),
    { label: "Close", beat: walkthrough.close },
  ];
}

export function ReportView({
  report,
  sampleLabel,
}: {
  report: Report;
  sampleLabel?: string;
}) {
  const { synthesis } = report;

  return (
    <main className="wrap flex-1 pb-8">
      <HeadlineSection report={report} sampleLabel={sampleLabel} />
      <SpeechStrip report={report} />
      <StatReadout report={report} />
      <WalkthroughSection walkthrough={synthesis.walkthrough} />
      <PrioritiesSection priorities={synthesis.priorities} />
      {synthesis.rewrites.length > 0 && (
        <RewritesSection rewrites={synthesis.rewrites} />
      )}
      <ScorecardSection report={report} />
      <ChartsSection report={report} />
      <FooterSection report={report} />
    </main>
  );
}

function HeadlineSection({
  report,
  sampleLabel,
}: {
  report: Report;
  sampleLabel?: string;
}) {
  const overall = report.overall.score;
  const tone = scoreTone(overall);
  const wpm = report.metrics.wpm.toFixed(0);
  const wordCount = report.transcript.words.length.toLocaleString();

  return (
    <section className="pt-8 pb-10 sm:pt-10">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          SpeakGrade
        </Link>
        <span className="text-border-strong">/</span>
        <span>Report</span>
        <span className="text-border-strong">/</span>
        <span className="truncate">{report.report_id}</span>
        {sampleLabel && (
          <span className="ml-1 rounded-full border border-caution/30 bg-caution/10 px-2.5 py-0.5 text-[12px] font-medium text-caution-ink">
            {sampleLabel}
          </span>
        )}
      </nav>

      <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
        <div>
          <p className="eyebrow">
            Speech evaluation
            {report.speech_type && (
              <> · {SPEECH_TYPE_LABEL[report.speech_type] ?? report.speech_type}</>
            )}{" "}
            · {formatDate(report.created_at)}
          </p>
          <h1 className="display mt-4 max-w-[22ch] text-[clamp(36px,4.6vw,58px)] leading-[1.04] tracking-[-0.015em]">
            {report.synthesis.headline}
          </h1>
          <div className="mt-6 flex flex-wrap gap-2 text-[13.5px]">
            {[
              formatDuration(report.duration_sec),
              `${wordCount} words`,
              `${wpm} wpm`,
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border bg-card px-3 py-1 text-ink-2"
              >
                {chip}
              </span>
            ))}
          </div>
          {report.synthesis.message_sentence && (
            <p className="mt-6 max-w-[62ch] border-l-2 border-border-strong pl-4 text-[15.5px] leading-[1.6] text-muted-foreground">
              <span className="font-medium text-foreground">Core message</span>
              <br />
              &ldquo;{report.synthesis.message_sentence}&rdquo;
            </p>
          )}
        </div>

        <div
          role="img"
          aria-label={`Overall ${overall.toFixed(1)} out of 5, ${verdict(overall)}`}
          className="surface flex items-center gap-6 p-6 shadow-lift lg:flex-col lg:items-start lg:gap-5 lg:p-7"
        >
          <ScoreRing score={overall} tone={tone} size={128} stroke={7} />
          <div>
            <p className="eyebrow">Overall</p>
            <p className="display mt-1 text-[34px] leading-none">{verdict(overall)}</p>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              {overall.toFixed(1)} out of 5, averaged across eight categories
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpeechStrip({ report }: { report: Report }) {
  const { duration_sec: duration, metrics, acoustic } = report;
  const beats = walkthroughBeats(report.synthesis.walkthrough);
  const pct = (t: number) => `${Math.min(100, Math.max(0, (t / duration) * 100))}%`;
  const ticks: number[] = [];
  const step = duration > 900 ? 120 : 60;
  for (let t = 0; t <= duration; t += step) ticks.push(t);
  const pauseLabel = `${acoustic.pauses.length} ${
    acoustic.pauses.length === 1 ? "pause" : "pauses"
  } marked`;

  return (
    <section
      aria-label="The whole speech at a glance"
      className="surface px-4 pt-5 pb-4 sm:px-6"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-[-0.005em]">The whole talk at a glance</h2>
        <p className="text-[13px] text-muted-foreground">
          {formatDuration(duration)} total · {pauseLabel}
        </p>
      </div>

      <div className="grid grid-cols-[52px_1fr] gap-x-3 sm:grid-cols-[64px_1fr]">
        <span />
        <div className="relative h-[52px]">
          {beats.map(({ label, beat }) => {
            const width = ((beat.end_t - beat.start_t) / duration) * 100;
            return (
              <div
                key={label}
                className="absolute inset-y-0 overflow-hidden rounded-lg border-x-2 border-card bg-muted"
                style={{ left: pct(beat.start_t), width: `${width}%` }}
                title={`${label} · ${formatDuration(beat.start_t)} – ${formatDuration(beat.end_t)}`}
              >
                <span
                  className={`block h-[4px] ${beatTone(beat) === "good" ? "bg-go" : "bg-caution"}`}
                />
                {width > 9 && (
                  <div
                    className={`px-2 pt-1 leading-tight whitespace-nowrap ${
                      width <= 22 ? "max-sm:hidden" : ""
                    }`}
                  >
                    <div className="text-[13.5px] font-semibold">{label}</div>
                    {width > 16 && (
                      <div
                        className={`text-[11.5px] text-muted-foreground ${
                          width <= 30 ? "max-sm:hidden" : ""
                        }`}
                      >
                        {formatDuration(beat.start_t)} – {formatDuration(beat.end_t)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <span className="self-center text-[12.5px] text-muted-foreground">Fillers</span>
        <div className="relative my-3 h-5">
          {metrics.fillers.map((f, i) => (
            <span
              key={i}
              title={`“${f.word}” at ${formatDuration(f.t)}`}
              className="absolute inset-y-0.5 w-[2px] rounded-full bg-foreground/80"
              style={{ left: pct(f.t) }}
            />
          ))}
        </div>

        <span className="self-center text-[12.5px] text-muted-foreground">Pauses</span>
        <div className="relative h-5">
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          {acoustic.pauses.map((p, i) => {
            const long = p.end - p.start >= LONG_PAUSE_SEC;
            return (
              <span
                key={i}
                title={`Pause ${(p.end - p.start).toFixed(1)}s at ${formatDuration(p.start)}`}
                className={`absolute inset-y-1 min-w-[4px] rounded-full ${long ? "bg-stop" : "bg-foreground/70"}`}
                style={{
                  left: pct(p.start),
                  width: `${((p.end - p.start) / duration) * 100}%`,
                }}
              />
            );
          })}
        </div>

        <span />
        <div className="relative mt-1 h-6 border-t border-border-strong">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute top-0 flex flex-col items-center text-[11.5px] text-muted-foreground"
              style={{
                left: pct(t),
                transform: t === 0 ? "none" : "translateX(-50%)",
              }}
            >
              <span className="h-[4px] w-px bg-border-strong" />
              {formatDuration(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 text-[12.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Lamp tone="good" />
          Strong
        </span>
        <span className="inline-flex items-center gap-2">
          <Lamp tone="mid" />
          Watch
        </span>
        <span className="inline-flex items-center gap-2">
          <Lamp tone="low" />
          Long pause (≥ 2s)
        </span>
      </div>
    </section>
  );
}

function Readout({
  label,
  value,
  unit,
  tone,
  context,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: ScoreTone;
  context: string;
}) {
  return (
    <div className="px-5 pt-5 pb-6 sm:px-6">
      <div className="eyebrow">{label}</div>
      <div className="display mt-2 text-[52px] leading-none">
        {value}
        {unit && <small className="ml-0.5 text-[28px] text-muted-foreground">{unit}</small>}
      </div>
      <div className="mt-3 flex items-baseline gap-2 text-[13.5px] text-muted-foreground">
        {tone && <Lamp tone={tone} className="translate-y-[1px]" />}
        <span>{context}</span>
      </div>
    </div>
  );
}

function StatReadout({ report }: { report: Report }) {
  const { metrics, duration_sec, transcript } = report;
  const monotonePct = Math.round(metrics.monotone_score * 100);
  const wpm = wpmBand(metrics.wpm);
  const fillers = fillerBand(metrics.filler_per_min);
  const mono = monotoneBand(monotonePct);
  const pausePct =
    duration_sec > 0
      ? Math.round((metrics.total_pause_sec / duration_sec) * 100)
      : 0;

  return (
    <section aria-label="By the numbers">
      <div className="surface mt-4 grid grid-cols-2 overflow-hidden lg:grid-cols-4 [&>*]:border-border max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(even)]:border-l lg:[&>*+*]:border-l">
        <Readout
          label="Duration"
          value={formatDuration(duration_sec)}
          context={`${transcript.words.length.toLocaleString()} words`}
        />
        <Readout
          label="Words / min"
          value={metrics.wpm.toFixed(0)}
          tone={wpm.tone}
          context={wpm.label}
        />
        <Readout
          label="Fillers"
          value={metrics.fillers.length.toString()}
          tone={fillers.tone}
          context={`${metrics.filler_per_min.toFixed(1)}/min · ${fillers.label}`}
        />
        <Readout
          label="Monotone"
          value={monotonePct.toString()}
          unit="%"
          tone={mono.tone}
          context={`${mono.label} · lower is better`}
        />
      </div>
      <div className="surface mt-4 grid items-baseline gap-x-6 gap-y-3 px-5 py-5 sm:grid-cols-[auto_repeat(3,1fr)] sm:px-6">
        <span className="eyebrow">Pauses</span>
        <PauseStat value={metrics.pauses_over_0_6} label="≥ 0.6s · deliberate" />
        <PauseStat value={metrics.pauses_over_2} label="≥ 2s · long" />
        <PauseStat
          value={`${metrics.total_pause_sec.toFixed(1)}s`}
          label={`total silence · ${pausePct}% of talk`}
        />
      </div>
    </section>
  );
}

function PauseStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="display text-[32px] leading-none">{value}</span>
      <span className="text-[13.5px] text-muted-foreground">{label}</span>
    </div>
  );
}

function WalkthroughSection({ walkthrough }: { walkthrough: Walkthrough }) {
  return (
    <section className="pt-24">
      <SectionHead
        label="Walk-through · how it unfolded"
        title="Listen back to how it ran."
      />
      <ol className="surface divide-y divide-border overflow-hidden">
        {walkthroughBeats(walkthrough).map(({ label, beat }) => (
          <li
            key={label}
            className="grid gap-3 px-5 py-6 sm:grid-cols-[200px_1fr] sm:gap-8 sm:px-7 sm:py-7"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 sm:block">
              <div className="display text-[28px] leading-none">
                {label}
              </div>
              <div className="text-[13.5px] font-medium text-muted-foreground sm:mt-2">
                {formatDuration(beat.start_t)} – {formatDuration(beat.end_t)}
              </div>
              {beat.quote_t !== null && (
                <div className="text-[12.5px] text-muted-foreground">
                  @ {formatDuration(beat.quote_t)}
                </div>
              )}
            </div>
            <div className="max-w-[68ch] text-[15.5px] leading-[1.65]">
              <p>{beat.observation}</p>
              {beat.praise && (
                <Note tone="good" lead="Strong.">
                  {beat.praise}
                </Note>
              )}
              {beat.critique && (
                <Note tone="mid" lead="Watch.">
                  {beat.critique}
                </Note>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Note({
  tone,
  lead,
  children,
}: {
  tone: ScoreTone;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <p className="mt-3 grid grid-cols-[8px_1fr] gap-3 text-ink-2">
      <Lamp tone={tone} className="mt-[9px]" />
      <span>
        <b className="font-semibold text-foreground">{lead}</b> {children}
      </span>
    </p>
  );
}

function Quote({ text, t }: { text: string; t: number }) {
  return (
    <p className="my-4 rounded-xl bg-background px-4 py-3 text-[15px] leading-[1.6] text-ink-2">
      &ldquo;{text}&rdquo;
      <span className="ml-2 text-[12.5px] font-medium whitespace-nowrap text-muted-foreground">
        @ {formatDuration(t)}
      </span>
    </p>
  );
}

function PrioritiesSection({ priorities }: { priorities: Priority[] }) {
  return (
    <section className="pt-24">
      <SectionHead
        label={`Top ${priorities.length} ${
          priorities.length === 1 ? "priority" : "priorities"
        } · ranked`}
        title="Work on these next."
      />
      <ol className="grid gap-4">
        {priorities.map((p, i) => (
          <li
            key={i}
            className="surface grid grid-cols-[44px_1fr] gap-4 px-5 py-7 sm:grid-cols-[96px_1fr] sm:gap-6 sm:px-8 sm:py-8"
          >
            <span className="display text-[52px] leading-[0.8] text-muted-foreground/70 sm:text-[84px]">
              {i + 1}
            </span>
            <div className="max-w-[72ch] text-[15.5px] leading-[1.65]">
              <h3 className="display text-[30px] leading-[1.08] sm:text-[34px]">
                {p.title}
              </h3>
              <p className="mt-3 text-ink-2">{p.observation}</p>
              <Quote text={p.example_quote} t={p.example_t} />
              <dl className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 sm:gap-8">
                <div>
                  <dt className="text-[13px] font-semibold">Why it matters</dt>
                  <dd className="mt-1 text-ink-2">{p.why_it_matters}</dd>
                </div>
                <div>
                  <dt className="text-[13px] font-semibold">Drill</dt>
                  <dd className="mt-1 text-ink-2">{p.drill}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RewritesSection({ rewrites }: { rewrites: Rewrite[] }) {
  return (
    <section className="pt-24">
      <SectionHead
        label={`Phrasing rewrites · ${rewrites.length} ${
          rewrites.length === 1 ? "example" : "examples"
        }`}
        title="Say it like this instead."
      />
      <div className="grid gap-4">
        {rewrites.map((rw, i) => (
          <article key={i} className="surface grid overflow-hidden md:grid-cols-[1fr_1.2fr]">
            <div className="border-border bg-background/70 px-5 py-6 max-md:border-b sm:px-7 md:border-r">
              <p className="eyebrow">What you said</p>
              <p className="mt-2 text-[16px] leading-[1.6] text-muted-foreground line-through decoration-stop/60 decoration-[1.5px]">
                {rw.original}
              </p>
            </div>
            <div className="px-5 py-6 sm:px-7">
              <p className="text-[13.5px] font-medium text-go-ink">Try instead</p>
              <p className="display mt-2 text-[28px] leading-[1.12]">
                {rw.suggested}
              </p>
              <p className="mt-4 text-[14.5px] leading-[1.6] text-muted-foreground">
                <span className="font-medium text-foreground">Why it works.</span> {rw.why}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScorecardSection({ report }: { report: Report }) {
  return (
    <section className="pt-24">
      <SectionHead label="Scorecard · eight categories" title="How you scored." />
      <div className="grid gap-4 md:grid-cols-2">
        {CATEGORY_ORDER.map((key) => (
          <CategoryCard
            key={key}
            catKey={key}
            cat={report.synthesis.categories[key]}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ catKey, cat }: { catKey: CategoryKey; cat: CategoryScore }) {
  const na = cat.score === "n/a" || typeof cat.score !== "number";
  const score = na ? 0 : (cat.score as number);
  const tone = na ? null : scoreTone(score);

  return (
    <article className="surface px-5 pt-6 pb-6 sm:px-7">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="display text-[28px] leading-none">
          {CATEGORY_LABEL[catKey]}
        </h3>
        <span
          className={`display text-[28px] leading-none ${tone ? TONE_INK[tone] : "text-muted-foreground"}`}
        >
          {na ? (
            "n/a"
          ) : (
            <>
              {score}
              <small className="text-[18px] text-muted-foreground">/5</small>
            </>
          )}
        </span>
      </div>
      <SignalBar filled={score} tone={tone} className="mt-4" />

      <p className="mt-4 text-[15px] leading-[1.65] text-ink-2">{cat.rationale}</p>

      {cat.counts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
          {cat.counts.map((c) => (
            <span key={c.label} className="inline-flex items-center gap-2">
              <span className="font-medium">{c.label}</span>
              {catKey === "language" && c.count <= 40 && <Tally count={c.count} />}
              <span className="text-muted-foreground">×{c.count}</span>
            </span>
          ))}
        </div>
      )}

      {cat.evidence.map((ev, i) => (
        <Quote key={i} text={ev.quote} t={ev.t} />
      ))}

      {na && cat.applicability_reason && (
        <p className="mt-3 text-[14px] text-muted-foreground">
          {cat.applicability_reason}
        </p>
      )}
    </article>
  );
}

function LegendSwatch({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block size-2.5 rounded-[3px] ${className}`} />;
}

function ChartsSection({ report }: { report: Report }) {
  const { acoustic, duration_sec } = report;
  const pauseLabel = `${acoustic.pauses.length} ${
    acoustic.pauses.length === 1 ? "pause" : "pauses"
  } marked`;

  return (
    <section className="pt-24">
      <SectionHead label="Delivery over time" title="Pitch, pace and volume." />
      <div className="surface px-4 pt-6 pb-7 sm:px-7">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="text-[16px] font-semibold tracking-[-0.005em]">
            Pitch &amp; pace
          </h3>
          <span className="text-[13px] text-muted-foreground">
            {formatDuration(duration_sec)} total · {pauseLabel}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <LegendSwatch className="bg-foreground" />
            <span>
              <b className="font-semibold text-foreground">Vocal variety</b> · pitch
              above/below your baseline
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <LegendSwatch className="bg-go" />
            <b className="font-semibold text-foreground">Words per minute</b>
          </span>
          <span className="inline-flex items-center gap-2">
            <LegendSwatch className="bg-[#A3A39C]/60" />
            <span>
              <b className="font-semibold text-foreground">Pause</b> (≥ 0.6s)
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <LegendSwatch className="bg-stop" />
            <span>
              <b className="font-semibold text-foreground">Long pause</b> (≥ 2s)
            </span>
          </span>
        </div>

        <TimelineChart
          timeline={acoustic.timeline}
          pauses={acoustic.pauses}
          duration_sec={duration_sec}
        />

        <p className="mt-3 mb-10 max-w-[110ch] text-[13px] leading-[1.6] text-muted-foreground">
          <b className="font-semibold text-foreground">Vocal variety</b> — flat at
          your baseline, spiking when your pitch moves notably higher or lower
          (hover for the actual pitch) ·{" "}
          <b className="font-semibold text-go-ink">words per minute</b> with the
          130–160 sweet spot highlighted · grey bands are pauses ≥ 0.6s, red bands
          are long pauses ≥ 2s (hover for duration).
        </p>

        <VolumeChart
          timeline={acoustic.timeline}
          pauses={acoustic.pauses}
          duration_sec={duration_sec}
        />

        <p className="mt-3 max-w-[110ch] text-[13px] leading-[1.6] text-muted-foreground">
          <b className="font-semibold text-caution-ink">Volume</b> as{" "}
          <em>± decibels from your recent delivery</em>, not absolute loudness — so
          it doesn&apos;t depend on your mic. The line sits near 0 when you hold a
          steady level; peaks above it are where you pushed louder for emphasis,
          dips below where you dropped softer. The line breaks on silences.
        </p>
      </div>
    </section>
  );
}

function FooterSection({ report }: { report: Report }) {
  return (
    <section className="grid gap-6 pt-24 pb-6">
      <div className="surface flex flex-col items-center px-6 py-14 text-center">
        <h2 className="display max-w-[18ch] text-[clamp(32px,4vw,46px)] leading-[1.05]">
          Rehearse it again and see what moved.
        </h2>
        <p className="mt-3 max-w-[46ch] text-[15px] text-muted-foreground">
          Every report is saved to your dashboard, so you can track each
          rehearsal against the last.
        </p>
        <Link href="/#upload" className="btn btn-ink btn-lg mt-7">
          Analyze another speech
        </Link>
      </div>

      <details className="group surface w-full px-5 py-4 text-[14px] text-muted-foreground sm:px-6">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground [&::-webkit-details-marker]:hidden">
          <span>Technical details · raw report data</span>
          <span aria-hidden className="text-[20px] leading-none text-muted-foreground transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="mt-3 border-t border-border pt-3 text-[13.5px] leading-[1.6]">
          Deepgram transcription, Parselmouth + librosa acoustic pass, annotated
          transcript, schema v{report.schema_version}.
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl bg-background px-4 py-3 font-mono text-[12px] text-foreground">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      </details>
    </section>
  );
}
