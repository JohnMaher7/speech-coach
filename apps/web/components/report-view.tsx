import Link from "next/link";

import { SectionHead, SignalBar, Lamp, Tally, TONE_INK } from "@/components/signal";
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
    <main className="wrap flex-1 pb-4">
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
    <section className="pt-7 pb-8">
      <div className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          SpeakGrade
        </Link>
        <span className="text-border">/</span>
        <span>Report</span>
        <span className="text-border">/</span>
        <span className="truncate">{report.report_id}</span>
        {sampleLabel && (
          <span className="bg-caution px-2 font-semibold text-foreground">
            {sampleLabel}
          </span>
        )}
      </div>

      <div className="mt-4 grid items-end gap-8 md:grid-cols-[1fr_300px] md:gap-10">
        <div>
          <h1 className="font-display text-[clamp(52px,7vw,92px)] leading-[0.9] font-bold">
            Speech evaluation.
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[16px] text-muted-foreground">
            <span>
              Recorded{" "}
              <b className="font-semibold text-foreground">
                {formatDate(report.created_at)}
              </b>
            </span>
            <span>
              <b className="font-semibold text-foreground">
                {formatDuration(report.duration_sec)}
              </b>{" "}
              · {wordCount} words · {wpm} wpm
            </span>
            {report.speech_type && (
              <b className="font-semibold text-foreground">
                {SPEECH_TYPE_LABEL[report.speech_type] ?? report.speech_type}
              </b>
            )}
          </div>
          <p className="mt-5 max-w-[36ch] text-pretty text-[23px] leading-[1.4] font-medium">
            {report.synthesis.headline}
          </p>
          {report.synthesis.message_sentence && (
            <p className="mt-3 max-w-[60ch] text-muted-foreground">
              Core message ·{" "}
              <span className="text-foreground">
                &ldquo;{report.synthesis.message_sentence}&rdquo;
              </span>
            </p>
          )}
        </div>

        <div
          role="img"
          aria-label={`Overall ${overall.toFixed(1)} out of 5, ${verdict(overall)}`}
          className="grid max-w-[360px] grid-cols-[auto_1fr] items-center gap-5 bg-foreground px-[22px] pt-5 pb-[18px] text-card"
        >
          <div className="grid gap-2">
            {(["good", "mid", "low"] as const).map((t) => (
              <SignalLamp key={t} tone={t} on={t === tone} />
            ))}
          </div>
          <div>
            <div className="text-[14.5px] text-[#B9BDB8]">Overall</div>
            <div className="mt-0.5 font-display text-[76px] leading-[0.9] font-bold">
              {overall.toFixed(1)}
            </div>
            <div className="mt-1 font-display text-[24px] leading-tight font-semibold">
              {verdict(overall)}
            </div>
            <div className="mt-0.5 text-[14.5px] text-[#B9BDB8]">
              {overall.toFixed(1)} / 5
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const SIGNAL_ON: Record<ScoreTone, string> = {
  good: "bg-go shadow-[0_0_0_4px_rgb(14_159_91/0.25)]",
  mid: "bg-caution shadow-[0_0_0_4px_rgb(240_160_0/0.25)]",
  low: "bg-stop shadow-[0_0_0_4px_rgb(218_58_43/0.3)]",
};

function SignalLamp({ tone, on }: { tone: ScoreTone; on: boolean }) {
  return (
    <span
      aria-hidden
      className={`block size-[30px] rounded-full ${on ? SIGNAL_ON[tone] : "bg-[#2C2E2C]"}`}
    />
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
      className="border-t-[3px] border-foreground bg-card px-4 pt-4 pb-3 sm:px-5"
    >
      <p className="mb-3 text-[14.5px] text-muted-foreground">
        {formatDuration(duration)} total · {pauseLabel}
      </p>

      <div className="grid grid-cols-[52px_1fr] gap-x-3 sm:grid-cols-[64px_1fr]">
        <span />
        <div className="relative h-[52px]">
          {beats.map(({ label, beat }) => {
            const width = ((beat.end_t - beat.start_t) / duration) * 100;
            return (
              <div
                key={label}
                className="absolute inset-y-0 overflow-hidden border-x border-card bg-muted"
                style={{ left: pct(beat.start_t), width: `${width}%` }}
                title={`${label} · ${formatDuration(beat.start_t)} – ${formatDuration(beat.end_t)}`}
              >
                <span
                  className={`block h-[6px] ${beatTone(beat) === "good" ? "bg-go" : "bg-caution"}`}
                />
                {width > 9 && (
                  <div
                    className={`px-2 pt-1 leading-tight whitespace-nowrap ${
                      width <= 22 ? "max-sm:hidden" : ""
                    }`}
                  >
                    <div className="font-display text-[18px] font-bold">{label}</div>
                    {width > 16 && (
                      <div
                        className={`text-[12.5px] text-muted-foreground ${
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

        <span className="self-center text-[13px] text-muted-foreground">Fillers</span>
        <div className="relative my-3 h-5">
          {metrics.fillers.map((f, i) => (
            <span
              key={i}
              title={`“${f.word}” at ${formatDuration(f.t)}`}
              className="absolute inset-y-0 w-[2px] bg-foreground"
              style={{ left: pct(f.t) }}
            />
          ))}
        </div>

        <span className="self-center text-[13px] text-muted-foreground">Pauses</span>
        <div className="relative h-5">
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          {acoustic.pauses.map((p, i) => {
            const long = p.end - p.start >= LONG_PAUSE_SEC;
            return (
              <span
                key={i}
                title={`Pause ${(p.end - p.start).toFixed(1)}s at ${formatDuration(p.start)}`}
                className={`absolute inset-y-0 min-w-[4px] ${long ? "bg-stop" : "bg-foreground"}`}
                style={{
                  left: pct(p.start),
                  width: `${((p.end - p.start) / duration) * 100}%`,
                }}
              />
            );
          })}
        </div>

        <span />
        <div className="relative mt-1 h-6 border-t border-muted-foreground/40">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute top-0 flex flex-col items-center text-[12px] text-muted-foreground"
              style={{
                left: pct(t),
                transform: t === 0 ? "none" : "translateX(-50%)",
              }}
            >
              <span className="h-[5px] w-px bg-muted-foreground" />
              {formatDuration(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted-foreground">
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
    <div className="px-4 pt-4 pb-5 sm:px-5">
      <div className="text-[15px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-[54px] leading-none font-bold">
        {value}
        {unit && <small className="ml-0.5 text-[26px]">{unit}</small>}
      </div>
      <div className="mt-2 flex items-baseline gap-2 text-[15px] text-muted-foreground">
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
      <div className="mt-[3px] grid grid-cols-2 bg-card lg:grid-cols-4 [&>*]:border-border max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(even)]:border-l lg:[&>*+*]:border-l">
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
      <div className="mt-[3px] grid items-baseline gap-x-6 gap-y-2 bg-card px-4 py-4 sm:grid-cols-[auto_repeat(3,1fr)] sm:px-5">
        <span className="text-[15px] font-medium text-muted-foreground">Pauses</span>
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
      <span className="font-display text-[32px] leading-none font-bold">{value}</span>
      <span className="text-[15px] text-muted-foreground">{label}</span>
    </div>
  );
}

function WalkthroughSection({ walkthrough }: { walkthrough: Walkthrough }) {
  return (
    <section className="pt-16">
      <SectionHead
        label="Walk-through · how it unfolded"
        title="Listen back to how it ran."
      />
      <ol className="divide-y divide-border bg-card">
        {walkthroughBeats(walkthrough).map(({ label, beat }) => (
          <li
            key={label}
            className="grid gap-2 px-4 py-5 sm:grid-cols-[200px_1fr] sm:gap-7 sm:px-6"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 sm:block">
              <div className="font-display text-[26px] leading-none font-bold">
                {label}
              </div>
              <div className="font-display text-[20px] font-semibold text-muted-foreground sm:mt-1.5">
                {formatDuration(beat.start_t)} – {formatDuration(beat.end_t)}
              </div>
              {beat.quote_t !== null && (
                <div className="text-[14.5px] text-muted-foreground">
                  @ {formatDuration(beat.quote_t)}
                </div>
              )}
            </div>
            <div className="max-w-[68ch]">
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
    <p className="mt-3 grid grid-cols-[10px_1fr] gap-3 text-[#2D302D]">
      <Lamp tone={tone} className="mt-[8px]" />
      <span>
        <b className="font-semibold text-foreground">{lead}</b> {children}
      </span>
    </p>
  );
}

function Quote({ text, t }: { text: string; t: number }) {
  return (
    <p className="my-3 border-l-[3px] border-foreground pl-3.5 font-medium italic">
      &ldquo;{text}&rdquo;
      <span className="ml-2 text-[14.5px] font-medium text-muted-foreground not-italic">
        @ {formatDuration(t)}
      </span>
    </p>
  );
}

function PrioritiesSection({ priorities }: { priorities: Priority[] }) {
  return (
    <section className="pt-16">
      <SectionHead
        label={`Top ${priorities.length} ${
          priorities.length === 1 ? "priority" : "priorities"
        } · ranked`}
        title="Work on these next."
      />
      <ol className="border-b-[3px] border-foreground">
        {priorities.map((p, i) => (
          <li
            key={i}
            className="grid grid-cols-[48px_1fr] gap-3 border-t-[3px] border-foreground py-6 sm:grid-cols-[90px_1fr] sm:gap-5"
          >
            <span className="font-display text-[56px] leading-[0.8] font-bold sm:text-[84px]">
              {i + 1}
            </span>
            <div className="max-w-[72ch]">
              <h3 className="font-display text-[30px] leading-[1.05] font-bold">
                {p.title}
              </h3>
              <p className="mt-1.5">{p.observation}</p>
              <Quote text={p.example_quote} t={p.example_t} />
              <dl className="grid grid-cols-[56px_1fr] gap-x-3 gap-y-1">
                <dt className="font-bold">Why.</dt>
                <dd className="text-[#2D302D]">{p.why_it_matters}</dd>
                <dt className="font-bold">Drill.</dt>
                <dd className="text-[#2D302D]">{p.drill}</dd>
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
    <section className="pt-16">
      <SectionHead
        label={`Phrasing rewrites · ${rewrites.length} ${
          rewrites.length === 1 ? "example" : "examples"
        }`}
        title="Say it like this instead."
      />
      <div className="grid gap-[3px]">
        {rewrites.map((rw, i) => (
          <article key={i} className="grid bg-card md:grid-cols-2">
            <div className="border-border px-4 py-5 max-md:border-b sm:px-6 md:border-r">
              <p className="text-[14.5px] font-medium text-muted-foreground">
                What you said
              </p>
              <p className="mt-1.5 text-[18px] text-muted-foreground line-through decoration-stop decoration-2">
                {rw.original}
              </p>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <p className="text-[14.5px] font-medium text-muted-foreground">
                Try instead
              </p>
              <p className="mt-1 font-display text-[30px] leading-[1.08] font-bold">
                {rw.suggested}
              </p>
              <p className="mt-2 text-[15.5px] text-[#2D302D]">
                <b className="font-bold text-foreground">Why.</b> {rw.why}
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
    <section className="pt-16">
      <SectionHead label="Scorecard · eight categories" title="How you scored." />
      <div className="grid gap-[3px] md:grid-cols-2">
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
    <article className="bg-card px-4 pt-5 pb-6 sm:px-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[26px] leading-none font-bold">
          {CATEGORY_LABEL[catKey]}
        </h3>
        <span
          className={`font-display text-[26px] leading-none font-bold ${tone ? TONE_INK[tone] : "text-muted-foreground"}`}
        >
          {na ? (
            "n/a"
          ) : (
            <>
              {score} <small className="text-[17px] text-muted-foreground">/ 5</small>
            </>
          )}
        </span>
      </div>
      <SignalBar filled={score} tone={tone} className="mt-3" />

      <p className="mt-3 text-[16px]">{cat.rationale}</p>

      {cat.counts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
          {cat.counts.map((c) => (
            <span key={c.label} className="inline-flex items-center gap-2">
              <b className="font-semibold">{c.label}</b>
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
        <p className="mt-3 text-[15px] text-muted-foreground">
          {cat.applicability_reason}
        </p>
      )}
    </article>
  );
}

function LegendSwatch({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block size-3 ${className}`} />;
}

function ChartsSection({ report }: { report: Report }) {
  const { acoustic, duration_sec } = report;
  const pauseLabel = `${acoustic.pauses.length} ${
    acoustic.pauses.length === 1 ? "pause" : "pauses"
  } marked`;

  return (
    <section className="pt-16">
      <div className="bg-card px-4 pt-5 pb-6 sm:px-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="font-display text-[30px] leading-none font-bold">
            Pitch &amp; pace over time
          </h2>
          <span className="text-[15px] text-muted-foreground">
            {formatDuration(duration_sec)} total · {pauseLabel}
          </span>
        </div>

        <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-[14.5px] text-muted-foreground">
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
            <LegendSwatch className="bg-[#A9AFA8]" />
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

        <p className="mt-2 mb-6 max-w-[110ch] text-[14.5px] leading-[1.55] text-muted-foreground">
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

        <p className="mt-2 max-w-[110ch] text-[14.5px] leading-[1.55] text-muted-foreground">
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
    <section className="grid justify-items-center gap-8 pt-14 pb-10">
      <Link href="/" className="btn btn-ink btn-lg">
        <Lamp tone="good" className="size-3" />
        Analyze another speech
      </Link>

      <details className="group w-full bg-card px-4 py-3 text-[15px] text-muted-foreground sm:px-5">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          <span>Details · raw report data</span>
          <span aria-hidden className="font-display text-[22px] leading-none group-open:hidden">
            +
          </span>
          <span aria-hidden className="hidden font-display text-[22px] leading-none group-open:inline">
            −
          </span>
        </summary>
        <div className="mt-3 border-t border-border pt-3 text-[14px] leading-[1.6]">
          Deepgram transcription, Parselmouth + librosa acoustic pass, annotated
          transcript, schema v{report.schema_version}.
          <pre className="mt-3 max-h-[420px] overflow-auto bg-background px-3.5 py-3 font-mono text-[12px] text-foreground">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      </details>
    </section>
  );
}
