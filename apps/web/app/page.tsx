import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Check,
  ClipboardList,
  ListTree,
  MessageSquareDashed,
  PencilLine,
  Timer,
} from "lucide-react";

import { LiveWaveform } from "@/components/live-waveform";
import { UploadForm } from "@/components/upload-form";

const SAMPLE_REPORT_HREF = "/report/sample";

const RUBRIC_TILES: {
  key: "fillers" | "pacing" | "vocal" | "structure";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  title: string;
  body: string;
  reading: string;
  unit: string;
  accent: string;
  iconAccent: string;
}[] = [
  {
    key: "fillers",
    icon: MessageSquareDashed,
    label: "Category 01",
    title: "Fillers",
    body: 'Every "um", "uh", "like", "you know" — counted and timestamped to the second.',
    reading: "23",
    unit: "in 8:24",
    accent: "oklch(0.78 0.17 27)",
    iconAccent: "color-mix(in oklch, oklch(0.78 0.17 27) 18%, transparent)",
  },
  {
    key: "pacing",
    icon: Timer,
    label: "Category 02",
    title: "Pacing",
    body: "Words per minute over the whole talk, plus where your deliberate pauses landed.",
    reading: "148",
    unit: "words / min",
    accent: "oklch(0.82 0.16 65)",
    iconAccent: "color-mix(in oklch, oklch(0.82 0.16 65) 18%, transparent)",
  },
  {
    key: "vocal",
    icon: AudioLines,
    label: "Category 03",
    title: "Vocal variety",
    body: "Pitch range and energy — are you landing emphasis, or droning in one note?",
    reading: "2.4",
    unit: "octaves",
    accent: "oklch(0.76 0.14 320)",
    iconAccent: "color-mix(in oklch, oklch(0.76 0.14 320) 18%, transparent)",
  },
  {
    key: "structure",
    icon: ListTree,
    label: "Category 04",
    title: "Structure",
    body: "Opening, signposting, and whether the close actually closes the talk.",
    reading: "5 / 5",
    unit: "tight close",
    accent: "oklch(0.78 0.16 277)",
    iconAccent: "color-mix(in oklch, oklch(0.78 0.16 277) 18%, transparent)",
  },
];

const FAQ_ITEMS: { q: string; a: string; open?: boolean }[] = [
  {
    q: "Is my recording stored anywhere?",
    a: "No. Audio is kept only while your report is being generated, then deleted. We keep the report itself so you can come back to it from your dashboard; you can delete it at any time.",
    open: true,
  },
  {
    q: "What languages does SpeakGrade support?",
    a: "English transcription is the most accurate today. We can analyze most major European languages, but the rubric prompts are tuned for English speech-coaching conventions for now.",
  },
  {
    q: "How long can a recording be?",
    a: "Up to twenty minutes per upload, or 100 MB of audio — whichever you hit first. Most talks under fifteen minutes return a report in about three minutes.",
  },
  {
    q: "What models is this built on?",
    a: "A single adaptive-thinking Claude Sonnet call handles synthesis; Deepgram does transcription; Parselmouth and librosa handle the acoustic pass.",
  },
  {
    q: "How much does it cost?",
    a: "Every plan starts with a 7-day free trial. We ask for a card up front, but you're only charged after the trial and you can cancel any time before then. After that it's a simple monthly or yearly subscription for unlimited analyses — see the pricing page for current rates.",
  },
  {
    q: "Do I need an account?",
    a: "Yes — you sign in so your reports stay together across devices and your subscription follows you. Start the free trial, upload a recording, and your report is saved to your dashboard.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <ListeningBand />
      <HowItWorks />
      <BeyondTheScore />
      <Faq />
    </main>
  );
}

function Hero() {
  return (
    <section className="py-[72px] pb-16">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-stretch gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr]">
        {/* LEFT */}
        <div>
          <span className="inline-flex h-7 items-center gap-[9px] rounded-full border border-[color-mix(in_oklch,var(--primary)_18%,transparent)] bg-accent px-[13px] text-xs font-medium text-primary">
            <span
              className="size-[6px] rounded-full bg-primary"
              style={{ animation: "speakgrade-pulse 1.8s infinite" }}
            />
            7-day free trial · cancel anytime · ~3 minute turnaround
          </span>

          <h1 className="my-[22px] max-w-[14ch] text-balance font-serif text-[clamp(44px,5.2vw,64px)] leading-none font-medium tracking-[-0.022em]">
            Get an
            <br />
            <em className="text-primary not-italic">
              <span className="italic">evaluator&apos;s notes</span>
            </em>
            <br />
            on any{" "}
            <span className="relative whitespace-nowrap">
              speech
              <span
                aria-hidden
                className="absolute -inset-x-[2px] top-[56%] -z-10 h-[7px] -rotate-1 rounded-[2px] bg-[color-mix(in_oklch,var(--primary)_24%,transparent)]"
              />
            </span>
            .
          </h1>

          <p className="mb-8 max-w-[44ch] text-[17.5px] leading-[1.55] text-[oklch(0.35_0.01_264)]">
            Upload a recording. SpeakGrade returns a scored report on fillers,
            pacing, vocal variety, and structure — plus the three things to work
            on next.
          </p>

          <UploadForm />

          <div className="mt-[22px] flex flex-wrap items-center gap-[22px] text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-[7px]">
              <Check
                className="size-[14px] text-[color:var(--score-good)]"
                strokeWidth={2.5}
              />
              Audio never stored
            </span>
            <span className="inline-flex items-center gap-[7px]">
              <Check
                className="size-[14px] text-[color:var(--score-good)]"
                strokeWidth={2.5}
              />
              Works in any browser
            </span>
            <span
              aria-hidden
              className="hidden h-[14px] w-px bg-border sm:block"
            />
            <Link
              href={SAMPLE_REPORT_HREF}
              className="inline-flex items-center gap-[6px] font-medium text-primary underline decoration-[1px] underline-offset-[3px] transition-colors hover:text-[oklch(0.45_0.22_277)]"
            >
              See a sample report
              <ArrowRight className="size-[13px]" strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* RIGHT — faux report card */}
        <div className="relative self-start">
          <Link
            href={SAMPLE_REPORT_HREF}
            className="absolute -top-[10px] right-6 z-10 inline-block -rotate-3 rounded-full border border-border bg-card px-[14px] py-[5px] font-serif text-[13.5px] whitespace-nowrap text-muted-foreground italic shadow-[0_6px_14px_-10px_rgba(0,0,0,0.2)] transition-colors hover:border-[color-mix(in_oklch,var(--primary)_30%,var(--border))] hover:text-primary"
          >
            ↘ see the full sample report
          </Link>
          <HeroReport />
        </div>
      </div>
    </section>
  );
}

function HeroReport() {
  return (
    <article
      aria-label="Sample report preview"
      className="grid gap-[18px] rounded-[22px] border border-border bg-card px-[22px] pt-[22px] pb-5 shadow-[0_1px_0_rgba(0,0,0,0.02),0_30px_60px_-28px_rgba(30,30,60,0.22)]"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground uppercase">
            Report · 04 Nov 2025
          </div>
          <div className="mt-[6px] font-serif text-[22px] leading-tight font-medium tracking-[-0.01em]">
            Quarterly all-hands — opening segment
          </div>
          <div className="mt-[6px] flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <span>8:24</span>
            <span className="size-[3px] rounded-full bg-current opacity-50" />
            <span>1,247 words</span>
            <span className="size-[3px] rounded-full bg-current opacity-50" />
            <span>148 wpm</span>
          </div>
        </div>
        <div
          className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full border-[3px]"
          style={{
            borderColor: "var(--score-good)",
            color: "var(--score-good)",
          }}
        >
          <b className="text-[20px] leading-none font-semibold tabular-nums">
            4.1
          </b>
          <span className="mt-0.5 font-mono text-[9px] tracking-[0.08em] uppercase opacity-80">
            Overall
          </span>
        </div>
      </header>

      {/* Static waveform */}
      <ReportWave />

      {/* Rubric meters */}
      <div className="grid gap-3">
        <RubRow
          name="Fillers"
          color="var(--score-low)"
          filled={2}
          total={5}
          value="2 / 5"
        />
        <RubRow
          name="Pacing"
          color="var(--score-mid)"
          filled={3}
          total={5}
          value="3 / 5"
        />
        <RubRow
          name="Vocal variety"
          color="var(--chart-5)"
          filled={4}
          total={5}
          value="4 / 5"
        />
        <RubRow
          name="Structure"
          color="var(--primary)"
          filled={5}
          total={5}
          value="5 / 5"
        />
      </div>

      {/* Top action */}
      <div className="flex items-start gap-3 rounded-xl bg-[oklch(0.97_0.005_264)] p-[14px]">
        <span className="mt-[1px] flex size-[22px] shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
          1
        </span>
        <div>
          <b className="text-[13.5px] font-semibold">
            Cut &quot;kind of&quot; from the opening.
          </b>
          <p className="mt-1 text-[13px] leading-[1.5] text-[oklch(0.35_0.01_264)]">
            It appears 14 times in the first two minutes — soften nowhere,
            sharpen everywhere.
          </p>
        </div>
      </div>
    </article>
  );
}

const HERO_WAVE_BARS: { h: number; kind?: "hot" | "pause" }[] = [
  { h: 30 },
  { h: 55 },
  { h: 42 },
  { h: 68 },
  { h: 80, kind: "hot" },
  { h: 74, kind: "hot" },
  { h: 36 },
  { h: 48 },
  { h: 72 },
  { h: 62 },
  { h: 34 },
  { h: 50 },
  { h: 18, kind: "pause" },
  { h: 16, kind: "pause" },
  { h: 66 },
  { h: 78 },
  { h: 55 },
  { h: 84 },
  { h: 46 },
  { h: 30 },
  { h: 60 },
  { h: 88, kind: "hot" },
  { h: 78, kind: "hot" },
  { h: 38 },
  { h: 68 },
  { h: 82 },
  { h: 44 },
  { h: 58 },
  { h: 36 },
  { h: 50 },
  { h: 42 },
  { h: 62 },
  { h: 55 },
  { h: 48 },
  { h: 30 },
];

function ReportWave() {
  return (
    <div className="relative rounded-xl bg-[oklch(0.97_0.005_264)] px-3 pt-[14px] pb-[10px]">
      <div className="flex h-16 items-center gap-[2px]">
        {HERO_WAVE_BARS.map((b, i) => {
          const bg =
            b.kind === "hot"
              ? "var(--score-low)"
              : b.kind === "pause"
                ? "var(--muted-foreground)"
                : "var(--foreground)";
          const opacity =
            b.kind === "hot" ? 0.9 : b.kind === "pause" ? 0.25 : 0.7;
          return (
            <span
              key={i}
              className="flex-1 rounded-[2px]"
              style={{
                height: `${b.h}%`,
                minHeight: 4,
                background: bg,
                opacity,
              }}
            />
          );
        })}
      </div>
      <div
        className="absolute top-[6px] -translate-x-1/2 rounded-full border bg-card px-[7px] py-[2px] font-mono text-[9.5px] tracking-[0.04em] whitespace-nowrap"
        style={{
          left: "60%",
          color: "var(--score-low)",
          borderColor:
            "color-mix(in oklch, var(--score-low) 30%, var(--border))",
        }}
      >
        filler cluster · 3:42
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>0:00</span>
        <span>2:00</span>
        <span>4:00</span>
        <span>6:00</span>
        <span>8:24</span>
      </div>
    </div>
  );
}

function RubRow({
  name,
  color,
  filled,
  total,
  value,
}: {
  name: string;
  color: string;
  filled: number;
  total: number;
  value: string;
}) {
  return (
    <div
      className="grid grid-cols-[14px_1fr_36px] items-center gap-3"
      style={{ color }}
    >
      <span
        className="ml-[3px] size-2 rounded-full"
        style={{ background: "currentColor" }}
      />
      <div className="grid gap-[6px]">
        <span className="text-[13.5px] font-medium text-foreground">
          {name}
        </span>
        <div className="flex gap-[4px]">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-[5px] flex-1 rounded-[3px]"
              style={{
                background:
                  i < filled ? "currentColor" : "oklch(0.95 0.005 264)",
              }}
            />
          ))}
        </div>
      </div>
      <span className="text-right font-mono text-[12px] text-muted-foreground">
        {value}
      </span>
    </div>
  );
}

function ListeningBand() {
  return (
    <section
      id="measure"
      className="relative overflow-hidden bg-foreground py-[72px] pb-16 text-[oklch(0.96_0_0)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 18% 35%, oklch(0.4 0.18 277 / 0.22), transparent 55%),radial-gradient(ellipse at 82% 65%, oklch(0.45 0.16 320 / 0.16), transparent 60%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-9 grid grid-cols-1 items-end gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-[10px] font-mono text-[11px] tracking-[0.12em] text-[oklch(0.7_0.08_277)] uppercase">
              <span
                className="size-2 rounded-full"
                style={{
                  background: "oklch(0.75 0.18 142)",
                  animation: "speakgrade-pulse-green 1.6s infinite",
                }}
              />
              Listening · analysis in progress
            </span>
            <h2 className="mt-[18px] max-w-[18ch] text-balance font-serif text-[clamp(36px,4vw,48px)] leading-[1.02] font-medium tracking-[-0.018em]">
              An ear for every{" "}
              <em className="font-medium text-[oklch(0.85_0.1_277)]">um,</em>{" "}
              pause, and beat.
            </h2>
          </div>
          <p className="max-w-[46ch] text-[16px] leading-[1.55] text-[oklch(0.78_0.01_264)]">
            SpeakGrade measures four things you can act on. Each one is scored,
            timestamped, and explained in plain language — not a wall of
            numbers.
          </p>
        </div>

        <LiveWaveform />

        <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {RUBRIC_TILES.map((tile) => (
            <RubricTile key={tile.key} tile={tile} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RubricTile({ tile }: { tile: (typeof RUBRIC_TILES)[number] }) {
  const Icon = tile.icon;
  return (
    <div
      className="relative rounded-2xl border border-white/[0.07] px-[22px] pt-6 pb-[26px]"
      style={{ background: "oklch(0.22 0.005 264)", color: tile.accent }}
    >
      <span
        className="absolute top-0 right-[22px] left-[22px] h-[2px] rounded-b-[2px]"
        style={{ background: "currentColor" }}
      />
      <span
        className="inline-flex size-9 items-center justify-center rounded-[10px]"
        style={{ background: tile.iconAccent, color: tile.accent }}
      >
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>
      <div className="mt-4 font-mono text-[10.5px] tracking-[0.1em] text-[oklch(0.65_0_0)] uppercase">
        {tile.label}
      </div>
      <h3 className="mt-1 mb-2 text-[17px] font-semibold tracking-[-0.005em] text-[oklch(0.97_0_0)]">
        {tile.title}
      </h3>
      <p className="text-[13.5px] leading-[1.5] text-[oklch(0.72_0.005_264)]">
        {tile.body}
      </p>
      <div
        className="mt-4 flex items-baseline justify-between border-t border-dashed border-white/10 pt-[14px]"
        style={{ color: tile.accent }}
      >
        <span className="text-[22px] font-medium tabular-nums tracking-[-0.01em]">
          {tile.reading}
        </span>
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-[oklch(0.55_0_0)] uppercase">
          {tile.unit}
        </span>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="bg-background py-[88px] pb-16">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              <span className="h-px w-7 bg-current opacity-50" />
              How it works
            </span>
            <h2 className="mt-3 max-w-[22ch] text-balance font-serif text-[clamp(32px,3.5vw,42px)] leading-[1.1] font-medium tracking-[-0.015em]">
              Three steps. Roughly{" "}
              <em className="font-medium text-primary">three minutes.</em>
            </h2>
          </div>
          <p className="max-w-[42ch] text-right text-sm leading-[1.55] text-muted-foreground sm:text-right">
            No install, no waiting room, no setup. SpeakGrade runs a
            transcription, an acoustic pass, and an evaluator-style synthesis in
            parallel.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-0">
          <div
            aria-hidden
            className="absolute top-[30px] right-[8.33%] left-[8.33%] hidden h-px sm:block"
            style={{
              background:
                "repeating-linear-gradient(to right, var(--border) 0 6px, transparent 6px 12px)",
            }}
          />
          {[
            {
              num: "i",
              title: "Upload a recording",
              body: "An MP3, WAV, or M4A of any talk — up to twenty minutes.",
              timing: "≈ 5 sec",
            },
            {
              num: "ii",
              title: "SpeakGrade analyses it",
              body: "Transcription, acoustic measurement, and an AI evaluator run together, not in sequence.",
              timing: "≈ 3 min",
            },
            {
              num: "iii",
              title: "Get coached",
              body: "An evaluator-style report with rubric scores, a pitch-and-pace timeline, and your top three actions.",
              timing: "read in 90 sec",
            },
          ].map((s, i, arr) => (
            <div
              key={s.num}
              className={`relative px-6 ${i === 0 ? "sm:pl-0" : ""} ${
                i === arr.length - 1 ? "sm:pr-0" : ""
              }`}
            >
              <span className="relative z-10 inline-flex size-[60px] items-center justify-center rounded-full border border-border bg-card font-serif text-[28px] font-medium text-foreground italic">
                {s.num}
              </span>
              <h3 className="mt-[22px] mb-2 text-[18px] font-semibold tracking-[-0.005em]">
                {s.title}
              </h3>
              <p className="max-w-[30ch] text-[14.5px] leading-[1.6] text-[oklch(0.35_0.01_264)]">
                {s.body}
              </p>
              <div className="mt-[14px] font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
                {s.timing}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeyondTheScore() {
  return (
    <section id="beyond" className="bg-background py-[72px] pb-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              <span className="h-px w-7 bg-current opacity-50" />
              Beyond the score
            </span>
            <h2 className="mt-3 max-w-[22ch] text-balance font-serif text-[clamp(32px,3.5vw,42px)] leading-[1.1] font-medium tracking-[-0.015em]">
              Pitch &amp; pace over time. And{" "}
              <em className="font-medium text-primary">better words</em> to say
              next.
            </h2>
          </div>
          <p className="max-w-[42ch] text-right text-sm leading-[1.55] text-muted-foreground">
            Scores tell you where you stand. The chart and the rewrites tell you
            what to change — at which second, in which sentence.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.35fr_1fr]">
          <ChartCard />
          <RewriteCard />
        </div>

        <div
          className="mt-7 flex flex-col items-start justify-between gap-4 rounded-[14px] border border-dashed border-border px-6 py-5 sm:flex-row sm:items-center"
          style={{ background: "color-mix(in oklch, var(--primary) 3%, var(--background))" }}
        >
          <div className="max-w-[56ch] text-sm text-[oklch(0.35_0.01_264)]">
            <b className="font-semibold text-foreground">
              See the full sample report.
            </b>{" "}
            Rubric, top 3 actions, all rewrites, the live chart, by-the-numbers
            — the entire surface a real upload returns.
          </div>
          <Link
            href={SAMPLE_REPORT_HREF}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[11px] bg-foreground px-[18px] text-sm font-medium text-background transition-colors hover:bg-[oklch(0.22_0.01_264)]"
          >
            Open sample report
            <ArrowRight className="size-[14px]" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ChartCard() {
  return (
    <article className="flex flex-col rounded-[22px] border border-border bg-card px-7 pt-[26px] pb-6 shadow-[0_1px_0_rgba(0,0,0,0.02),0_18px_40px_-28px_rgba(20,20,40,0.15)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-[7px] font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">
            <ClipboardList className="size-3" strokeWidth={2} />
            Pitch &amp; pace
          </div>
          <h3 className="font-serif text-2xl leading-tight font-medium tracking-[-0.01em]">
            Pitch &amp; pace, second by second.
          </h3>
        </div>
        <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">
          <b className="font-medium text-foreground">8:24</b> · 4 pauses
        </span>
      </div>
      <p className="mb-[18px] max-w-[46ch] text-sm leading-[1.55] text-[oklch(0.35_0.01_264)]">
        A two-line chart over the length of your talk: pitch in Hz, words per
        minute, and grey bands where you paused. Hover any peak to see what you
        were saying.
      </p>

      <div className="flex-1 rounded-2xl border border-[oklch(0.95_0.005_264)] bg-[oklch(0.985_0.003_264)] px-[14px] pt-4 pb-[10px]">
        <svg
          viewBox="0 0 540 220"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Pitch and words-per-minute chart"
          className="block h-auto w-full"
        >
          <defs>
            <linearGradient id="pitchFillMini" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="oklch(0.515 0.214 277)"
                stopOpacity="0.22"
              />
              <stop
                offset="100%"
                stopColor="oklch(0.515 0.214 277)"
                stopOpacity="0"
              />
            </linearGradient>
            <linearGradient id="wpmFillMini" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="oklch(0.52 0.14 152)"
                stopOpacity="0.14"
              />
              <stop
                offset="100%"
                stopColor="oklch(0.52 0.14 152)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <rect
            x="108"
            y="24"
            width="10"
            height="150"
            fill="oklch(0.92 0.005 264)"
            opacity="0.7"
          />
          <rect
            x="248"
            y="24"
            width="22"
            height="150"
            fill="oklch(0.92 0.005 264)"
            opacity="0.7"
          />
          <rect
            x="346"
            y="24"
            width="8"
            height="150"
            fill="oklch(0.92 0.005 264)"
            opacity="0.7"
          />
          <rect
            x="452"
            y="24"
            width="16"
            height="150"
            fill="oklch(0.92 0.005 264)"
            opacity="0.7"
          />

          <g
            stroke="oklch(0.93 0.005 264)"
            strokeWidth="1"
            strokeDasharray="2 4"
          >
            <line x1="40" y1="44" x2="520" y2="44" />
            <line x1="40" y1="84" x2="520" y2="84" />
            <line x1="40" y1="124" x2="520" y2="124" />
            <line x1="40" y1="164" x2="520" y2="164" />
          </g>

          <g
            fontFamily="var(--font-mono)"
            fontSize="9"
            fill="oklch(0.51 0.01 264)"
          >
            <text x="34" y="48" textAnchor="end">
              240
            </text>
            <text x="34" y="88" textAnchor="end">
              180
            </text>
            <text x="34" y="128" textAnchor="end">
              120
            </text>
            <text x="34" y="168" textAnchor="end">
              80
            </text>

            <text x="526" y="48" textAnchor="start">
              200
            </text>
            <text x="526" y="88" textAnchor="start">
              160
            </text>
            <text x="526" y="128" textAnchor="start">
              120
            </text>
            <text x="526" y="168" textAnchor="start">
              80
            </text>
          </g>

          <path
            d="M 40 102 L 75 96 L 110 110 L 145 88 L 180 100 L 215 116 L 250 132 L 285 148 L 320 138 L 355 116 L 390 100 L 425 108 L 460 92 L 495 96 L 520 124"
            fill="none"
            stroke="oklch(0.52 0.14 152)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 40 102 L 75 96 L 110 110 L 145 88 L 180 100 L 215 116 L 250 132 L 285 148 L 320 138 L 355 116 L 390 100 L 425 108 L 460 92 L 495 96 L 520 124 L 520 174 L 40 174 Z"
            fill="url(#wpmFillMini)"
          />

          <path
            d="M 40 128 L 75 92 L 110 110 L 145 64 L 180 88 L 215 108 L 250 144 L 285 162 L 320 144 L 355 112 L 390 88 L 425 116 L 460 56 L 495 80 L 520 116"
            fill="none"
            stroke="oklch(0.515 0.214 277)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 40 128 L 75 92 L 110 110 L 145 64 L 180 88 L 215 108 L 250 144 L 285 162 L 320 144 L 355 112 L 390 88 L 425 116 L 460 56 L 495 80 L 520 116 L 520 174 L 40 174 Z"
            fill="url(#pitchFillMini)"
          />

          <circle
            cx="145"
            cy="64"
            r="3.5"
            fill="white"
            stroke="oklch(0.515 0.214 277)"
            strokeWidth="1.8"
          />
          <circle
            cx="285"
            cy="162"
            r="3.5"
            fill="white"
            stroke="oklch(0.55 0.2 27)"
            strokeWidth="1.8"
          />
          <circle
            cx="460"
            cy="56"
            r="3.5"
            fill="white"
            stroke="oklch(0.515 0.214 277)"
            strokeWidth="1.8"
          />

          <line
            x1="285"
            y1="24"
            x2="285"
            y2="174"
            stroke="oklch(0.55 0.2 27)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          <rect
            x="244"
            y="8"
            width="84"
            height="18"
            rx="9"
            fill="oklch(0.96 0.04 27)"
            stroke="oklch(0.55 0.2 27)"
            strokeWidth="1"
          />
          <text
            x="286"
            y="20"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="9.5"
            fill="oklch(0.55 0.2 27)"
          >
            filler cluster · 3:42
          </text>

          <line
            x1="40"
            y1="174"
            x2="520"
            y2="174"
            stroke="oklch(0.85 0.005 264)"
            strokeWidth="1"
          />
          <g
            fontFamily="var(--font-mono)"
            fontSize="9.5"
            fill="oklch(0.51 0.01 264)"
          >
            <text x="40" y="192" textAnchor="middle">
              0:00
            </text>
            <text x="160" y="192" textAnchor="middle">
              2:00
            </text>
            <text x="280" y="192" textAnchor="middle">
              4:00
            </text>
            <text x="400" y="192" textAnchor="middle">
              6:00
            </text>
            <text x="520" y="192" textAnchor="middle">
              8:24
            </text>
          </g>
        </svg>

        <div className="mt-3 flex flex-wrap gap-[18px] px-1 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground uppercase">
          <span className="inline-flex items-center gap-[7px]">
            <span className="size-[10px] rounded-[3px] bg-primary" />
            Pitch · Hz
          </span>
          <span className="inline-flex items-center gap-[7px]">
            <span
              className="size-[10px] rounded-[3px]"
              style={{ background: "var(--score-good)" }}
            />
            Words / min
          </span>
          <span className="inline-flex items-center gap-[7px]">
            <span
              className="size-[10px] rounded-[3px]"
              style={{
                background:
                  "color-mix(in oklch, var(--muted-foreground) 30%, var(--border))",
              }}
            />
            Pauses
          </span>
        </div>
      </div>
    </article>
  );
}

function RewriteCard() {
  return (
    <article className="flex flex-col rounded-[22px] border border-border bg-card px-7 pt-[26px] pb-6 shadow-[0_1px_0_rgba(0,0,0,0.02),0_18px_40px_-28px_rgba(20,20,40,0.15)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-serif text-2xl leading-tight font-medium tracking-[-0.01em]">
          Better words to say{" "}
          <em className="font-medium text-primary">next time.</em>
        </h3>
        <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">
          <b className="font-medium text-foreground">3</b> rewrites
        </span>
      </div>
      <p className="mb-[18px] max-w-[46ch] text-sm leading-[1.55] text-[oklch(0.35_0.01_264)]">
        Side-by-side phrasing edits at the exact second they happened — with a
        one-line explanation of why the new version lands.
      </p>

      <div className="flex flex-1 flex-col gap-3">
        <div>
          <div className="inline-flex items-center gap-[7px] font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">
            <MessageSquareDashed className="size-3" strokeWidth={2} />
            What you said · 00:34
          </div>
          <p className="mt-[6px] font-serif text-[16px] leading-[1.45] text-muted-foreground italic line-through decoration-muted-foreground/40">
            &quot;I think this is kind of an important point, you know, that we
            should sort of pay attention to.&quot;
          </p>
        </div>
        <div>
          <div className="inline-flex items-center gap-[7px] font-mono text-[10.5px] tracking-[0.1em] text-primary uppercase">
            <PencilLine className="size-3" strokeWidth={2} />
            Try instead
          </div>
          <p className="mt-1 rounded-xl border-l-[3px] border-primary bg-accent px-4 py-[14px] font-serif text-[18px] leading-[1.4] font-medium tracking-[-0.005em] text-foreground">
            &quot;This is the point. Pay attention to it.&quot;
          </p>
        </div>
        <p className="mt-[2px] text-[13px] leading-[1.55] text-[oklch(0.35_0.01_264)]">
          <b className="font-medium text-foreground">Why.</b> You&apos;re at the
          climax of the open. Every hedge tells the room the speaker
          doesn&apos;t believe it either — strip them all.
        </p>
      </div>
    </article>
  );
}

function Faq() {
  return (
    <section id="faq" className="bg-background py-14 pb-24">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-start gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <span className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
            <span className="h-px w-7 bg-current opacity-50" />
            Common questions
          </span>
          <h2 className="mt-3 max-w-[22ch] text-balance font-serif text-[clamp(32px,3.5vw,42px)] leading-[1.1] font-medium tracking-[-0.015em]">
            A few things worth knowing{" "}
            <em className="font-medium text-primary">upfront.</em>
          </h2>
        </div>
        <div className="border-t border-border">
          {FAQ_ITEMS.map(({ q, a, open }) => (
            <details
              key={q}
              open={open}
              className="group cursor-pointer border-b border-border py-[22px]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {q}
                <span className="font-mono text-lg leading-none text-muted-foreground group-open:hidden">
                  +
                </span>
                <span className="hidden font-mono text-lg leading-none text-muted-foreground group-open:inline">
                  −
                </span>
              </summary>
              <p className="mt-[10px] max-w-[64ch] text-[14.5px] leading-[1.6] text-[oklch(0.35_0.01_264)]">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
