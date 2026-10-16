import Image from "next/image";
import Link from "next/link";
import { Check, Clock3, Lock, Plus } from "lucide-react";

import sculpture from "@/public/art/voice-sculpture.webp";
import { Lamp, ScoreRing, SectionHead, SignalBar } from "@/components/signal";
import { UploadForm } from "@/components/upload-form";
import { fetchPlanPrices, type PlanPrice } from "@/lib/api";
import type { ScoreTone } from "@/lib/scores";

// Prices for the closing call-to-action are baked in and refreshed in the
// background, like the pricing page.
export const revalidate = 300;

const SAMPLE_REPORT_HREF = "/report/sample";

const MEASURES: {
  title: string;
  body: string;
  reading: string;
  unit: string;
  tone: ScoreTone;
}[] = [
  {
    title: "Fillers",
    body: "Every um, uh, like and you know, counted and timestamped to the second.",
    reading: "23",
    unit: "in 8:24",
    tone: "mid",
  },
  {
    title: "Pacing",
    body: "Words per minute across the talk, and where your deliberate pauses landed.",
    reading: "148",
    unit: "words / min",
    tone: "good",
  },
  {
    title: "Vocal variety",
    body: "Pitch and energy. Are you landing emphasis, or holding one note?",
    reading: "2.4",
    unit: "octaves",
    tone: "good",
  },
  {
    title: "Structure",
    body: "Your opening, your signposts, and whether the close really closes.",
    reading: "5/5",
    unit: "tight close",
    tone: "good",
  },
];

const STEPS: { title: string; body: string; timing: string }[] = [
  {
    title: "Upload or record",
    body: "An MP3, WAV or M4A of any talk up to twenty minutes, or record straight from your browser.",
    timing: "5 seconds",
  },
  {
    title: "We listen closely",
    body: "Transcription, an acoustic pass and an AI evaluator run side by side, not one after another.",
    timing: "About 3 minutes",
  },
  {
    title: "Read your evaluation",
    body: "Scores across eight categories, a pitch-and-pace timeline, rewrites and your top three actions.",
    timing: "A 90-second read",
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Is my recording stored anywhere?",
    a: "No. Audio is kept only while your report is being generated, then deleted. We keep the report itself so you can come back to it from your dashboard; you can delete it at any time.",
  },
  {
    q: "What languages does SpeakGrade support?",
    a: "English transcription is the most accurate today. We can analyze most major European languages, but the rubric prompts are tuned for English speech-coaching conventions for now.",
  },
  {
    q: "How long can a recording be?",
    a: "Up to twenty minutes per upload, or 100 MB of audio, whichever you hit first. Most talks under fifteen minutes return a report in about three minutes.",
  },
  {
    q: "What models is this built on?",
    a: "A single adaptive-thinking Claude Sonnet call handles synthesis; Deepgram does transcription; Parselmouth and librosa handle the acoustic pass.",
  },
  {
    q: "How much does it cost?",
    a: "Every plan starts with a 7-day free trial. We ask for a card up front, but you're only charged after the trial and you can cancel any time before then. After that it's a simple monthly or yearly subscription for unlimited analyses.",
  },
  {
    q: "Do I need an account?",
    a: "Yes. You sign in so your reports stay together across devices and your subscription follows you. Start the free trial, upload a recording, and your report is saved to your dashboard.",
  },
];

export default async function Home() {
  const prices = await fetchPlanPrices(revalidate).catch(() => null);

  return (
    <main className="flex-1">
      <Hero />
      <Measures />
      <HowItWorks />
      <BeyondTheScore />
      <Faq />
      <ClosingCta prices={prices} />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(60%_60%_at_75%_10%,#ffffff_0%,transparent_70%)]"
      />
      <div className="wrap relative grid grid-cols-1 items-center gap-14 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1fr_1.02fr] lg:gap-16 lg:pt-24 lg:pb-28">
        <div className="[animation:rise_.6s_ease-out_both]">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3.5 pl-2.5 text-[13.5px] font-medium text-ink-2 shadow-soft">
            <Lamp tone="good" />
            7-day free trial · cancel anytime
          </p>

          <h1 className="display mt-6 max-w-[11ch] text-[clamp(54px,7vw,92px)] leading-[0.96] tracking-[-0.02em]">
            Hear what your audience hears.
          </h1>

          <p className="mt-6 max-w-[44ch] text-[18px] leading-[1.6] text-ink-2">
            Upload or record any talk. In about three minutes you get an
            evaluator&apos;s report on your fillers, pacing, vocal variety and
            structure, with the three changes that will matter most.
          </p>

          <div className="mt-9 max-w-[520px]">
            <UploadForm />
          </div>

          <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-muted-foreground">
            <li className="inline-flex items-center gap-2">
              <Lock className="size-3.5" strokeWidth={2} />
              Audio deleted after analysis
            </li>
            <li className="inline-flex items-center gap-2">
              <Clock3 className="size-3.5" strokeWidth={2} />
              Report in about 3 minutes
            </li>
            <li>
              <Link href={SAMPLE_REPORT_HREF} className="link text-[13.5px]">
                See a sample report
              </Link>
            </li>
          </ul>
        </div>

        <div className="[animation:rise_.7s_.08s_ease-out_both]">
          <HeroReport />
        </div>
      </div>
    </section>
  );
}

const HERO_RUBRIC: { name: string; score: number; tone: ScoreTone }[] = [
  { name: "Fillers", score: 2, tone: "low" },
  { name: "Pacing", score: 3, tone: "mid" },
  { name: "Vocal variety", score: 4, tone: "good" },
  { name: "Structure", score: 5, tone: "good" },
];

function HeroReport() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div
        aria-hidden
        className="absolute inset-x-8 -bottom-4 top-6 rounded-[28px] border border-border bg-card/70 shadow-soft"
      />
      <Link
        href={SAMPLE_REPORT_HREF}
        aria-label="Sample report preview: open the sample reports"
        className="group relative block overflow-hidden rounded-[24px] border border-border bg-card shadow-float transition-[transform,box-shadow] duration-300 hover:-translate-y-1"
      >
        <header className="flex items-start justify-between gap-6 px-6 pt-6 sm:px-7 sm:pt-7">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[12.5px] font-medium whitespace-nowrap text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 text-ink-2">
                Sample report
              </span>
              04 Nov 2025
            </p>
            <h2 className="display mt-3 text-[26px] leading-[1.05] sm:text-[30px]">
              Quarterly all-hands, opening segment
            </h2>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              8:24 · 1,247 words · 148 wpm · Prepared
            </p>
          </div>
          <ScoreRing
            className="origin-top-right max-sm:-mb-4 max-sm:scale-[0.78]"
            score={4.1}
            tone="good"
            size={92}
            stroke={5}
            label={<div className="text-[11px] font-medium text-muted-foreground">Strong</div>}
          />
        </header>

        <div className="mx-6 mt-6 rounded-2xl border border-border bg-background px-4 pt-3.5 pb-3 sm:mx-7">
          <div className="mb-2.5 flex items-center justify-between text-[12px]">
            <span className="font-medium text-muted-foreground">Delivery</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-stop-ink">
              <Lamp tone="low" className="size-1.5" />
              Filler cluster · 3:42
            </span>
          </div>
          <MiniWave />
          <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
            <span>0:00</span>
            <span>2:00</span>
            <span>4:00</span>
            <span>6:00</span>
            <span>8:24</span>
          </div>
        </div>

        <div className="grid gap-3 px-6 pt-5 pb-5 sm:px-7">
          {HERO_RUBRIC.map((r) => (
            <div key={r.name} className="grid grid-cols-[104px_1fr_36px] items-center gap-4">
              <span className="text-[13.5px] font-medium text-ink-2">{r.name}</span>
              <SignalBar filled={r.score} tone={r.tone} />
              <span className="text-right text-[13px] font-medium text-muted-foreground">
                {r.score}/5
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-4 border-t border-border bg-background/60 px-6 py-5 sm:px-7">
          <span className="display text-[34px] leading-[0.85] text-muted-foreground">1</span>
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.005em]">
              Cut &ldquo;kind of&rdquo; from the opening.
            </p>
            <p className="mt-1 text-[13.5px] leading-[1.55] text-muted-foreground">
              It appears 14 times in the first two minutes. Soften nowhere,
              sharpen everywhere.
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

const MINI_WAVE: { h: number; kind?: "hot" | "pause" }[] = Array.from(
  { length: 58 },
  (_, i) => {
    if (i >= 19 && i <= 21) return { h: 10, kind: "pause" as const };
    const h = Math.round(
      26 + 58 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21)) + ((i * 37) % 13),
    );
    if (i >= 25 && i <= 29) return { h, kind: "hot" as const };
    return { h };
  },
);

function MiniWave() {
  return (
    <div className="flex h-12 items-center gap-[3px]" aria-hidden>
      {MINI_WAVE.map((b, i) => (
        <span
          key={i}
          className={`flex-1 rounded-full ${
            b.kind === "hot"
              ? "bg-stop"
              : b.kind === "pause"
                ? "bg-lamp-off"
                : "bg-foreground/80"
          }`}
          style={{ height: `${b.h}%`, minHeight: 3 }}
        />
      ))}
    </div>
  );
}

function Measures() {
  return (
    <section id="measure" className="scroll-mt-16 bg-night text-white">
      <div className="wrap pt-24 pb-20 sm:pt-32">
        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-[1.2fr_1fr] md:gap-12">
          <div>
            <p className="eyebrow mb-3 text-white/55">What we measure</p>
            <h2 className="display max-w-[16ch] text-[clamp(38px,5vw,64px)] leading-[1.02]">
              An ear for every um, pause and beat.
            </h2>
          </div>
          <p className="max-w-[42ch] text-[16px] leading-[1.6] text-white/60 md:justify-self-end">
            Four things you can act on. Each one scored, timestamped and
            explained in plain language, never a wall of numbers.
          </p>
        </div>

        <figure className="relative mt-14 -mx-5 sm:mx-0">
          <Image
            src={sculpture}
            alt="A recorded talk rendered as a row of ceramic capsules: a short pause, then a cluster of filler words glazed red."
            sizes="(min-width: 1200px) 1136px, 100vw"
            placeholder="blur"
            className="h-auto w-full sm:rounded-[28px] sm:ring-1 sm:ring-white/10"
          />
          <figcaption className="pointer-events-none absolute inset-0 hidden sm:block">
            <span
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{ left: "48.3%", top: "9%", height: "37%" }}
            >
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12.5px] font-medium whitespace-nowrap text-white/85 backdrop-blur-md">
                Pause · 1.8s
              </span>
              <span className="mt-1 w-px flex-1 bg-gradient-to-b from-white/45 to-white/0" />
            </span>
            <span
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{ left: "69.7%", top: "9%", height: "29%" }}
            >
              <span className="rounded-full bg-white px-3 py-1 text-[12.5px] font-medium whitespace-nowrap text-foreground shadow-lift">
                <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-stop align-middle" />
                Filler cluster · 3:42
              </span>
              <span className="mt-1 w-px flex-1 bg-gradient-to-b from-white/70 to-white/0" />
            </span>
          </figcaption>
        </figure>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-[22px] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {MEASURES.map((m) => (
            <div key={m.title} className="bg-night p-6 sm:p-7">
              <h3 className="flex items-center gap-2.5 text-[15px] font-medium">
                <Lamp tone={m.tone} />
                {m.title}
              </h3>
              <p className="mt-3 text-[14.5px] leading-[1.6] text-white/55">{m.body}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="display text-[48px]">{m.reading}</span>
                <span className="text-[13px] text-white/45">{m.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 py-24 sm:py-32">
      <div className="wrap">
        <SectionHead
          label="How it works"
          title="Three steps. Roughly three minutes."
          aside="No install and no waiting room. Upload a talk and SpeakGrade runs a transcription, an acoustic pass and an evaluator-style synthesis in parallel."
        />
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="surface flex flex-col p-7">
              <span className="grid size-9 place-items-center rounded-full border border-border bg-background text-[13px] font-medium text-ink-2">
                {i + 1}
              </span>
              <h3 className="display mt-8 text-[30px] leading-[1.05]">{s.title}</h3>
              <p className="mt-3 flex-1 text-[15px] leading-[1.6] text-muted-foreground">
                {s.body}
              </p>
              <p className="mt-8 inline-flex items-center gap-2 border-t border-border pt-4 text-[13.5px] font-medium text-ink-2">
                <Clock3 className="size-3.5 text-muted-foreground" strokeWidth={2} />
                {s.timing}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function BeyondTheScore() {
  return (
    <section id="beyond" className="pb-24 sm:pb-32">
      <div className="wrap">
        <SectionHead
          label="Beyond the score"
          title="Know which second to fix, and what to say instead."
          aside="Scores tell you where you stand. The timeline and the rewrites tell you what to change, down to the sentence."
        />

        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.4fr_1fr]">
          <ChartCard />
          <RewriteCard />
        </div>

        <div className="surface mt-4 flex flex-col items-start justify-between gap-5 px-7 py-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-[16px] font-semibold tracking-[-0.005em]">
              See everything a real upload returns.
            </p>
            <p className="mt-1 text-[14.5px] text-muted-foreground">
              Scorecard, top three actions, every rewrite, the live chart and the
              numbers. Two full sample reports, no sign-up.
            </p>
          </div>
          <Link href={SAMPLE_REPORT_HREF} className="btn btn-ink shrink-0">
            Open sample reports
          </Link>
        </div>
      </div>
    </section>
  );
}

function ChartCard() {
  return (
    <article className="surface flex flex-col p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="display text-[30px] leading-[1.05]">Pitch and pace, second by second</h3>
        <span className="text-[13px] text-muted-foreground">8:24 · 4 pauses</span>
      </div>
      <p className="mt-3 max-w-[54ch] text-[15px] leading-[1.6] text-muted-foreground">
        Your pitch movement, words per minute and every pause on one timeline.
        Hover any peak to see the moment.
      </p>

      <div className="mt-6 flex flex-1 flex-col justify-center">
        <svg
          viewBox="0 0 556 204"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Pitch and words-per-minute chart"
          className="block h-auto w-full"
        >
          <rect x="40" y="84" width="480" height="40" fill="var(--go)" opacity="0.06" />
          {[
            [108, 10],
            [248, 22],
            [346, 8],
            [452, 16],
          ].map(([x, w]) => (
            <rect key={x} x={x} y={24} width={w} height={150} rx={3} fill="#A3A39C" opacity={0.16} />
          ))}
          <g stroke="#EEEDE9" strokeWidth="1">
            <line x1="40" y1="44" x2="520" y2="44" />
            <line x1="40" y1="84" x2="520" y2="84" />
            <line x1="40" y1="124" x2="520" y2="124" />
            <line x1="40" y1="164" x2="520" y2="164" />
          </g>
          <g fontSize="10.5" fill="#8A8A84">
            <text x="32" y="48" textAnchor="end">+6</text>
            <text x="32" y="88" textAnchor="end">+2</text>
            <text x="32" y="128" textAnchor="end">−2</text>
            <text x="32" y="168" textAnchor="end">−6</text>
          </g>
          <g fontSize="10.5" fill="var(--go-ink)">
            <text x="528" y="48">200</text>
            <text x="528" y="88">160</text>
            <text x="528" y="128">120</text>
            <text x="528" y="168">80</text>
          </g>
          <path
            d="M 40 102 C 60 98, 90 104, 110 108 S 130 90, 145 88 S 170 98, 180 100 S 205 112, 215 116 S 240 128, 250 132 S 275 146, 285 148 S 310 140, 320 138 S 345 120, 355 116 S 380 102, 390 100 S 415 106, 425 108 S 450 94, 460 92 S 485 94, 495 96 S 512 116, 520 124"
            fill="none"
            stroke="var(--go)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 40 128 C 55 110, 65 94, 75 92 S 100 108, 110 110 S 135 66, 145 64 S 170 84, 180 88 S 205 104, 215 108 S 240 140, 250 144 S 275 160, 285 162 S 310 148, 320 144 S 345 116, 355 112 S 380 90, 390 88 S 415 114, 425 116 S 450 58, 460 56 S 485 76, 495 80 S 512 108, 520 116"
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="145" cy="64" r="3.5" fill="#fff" stroke="var(--foreground)" strokeWidth="2" />
          <circle cx="460" cy="56" r="3.5" fill="#fff" stroke="var(--foreground)" strokeWidth="2" />
          <line x1="285" y1="30" x2="285" y2="174" stroke="var(--stop)" strokeWidth="1.25" strokeDasharray="3 3" />
          <circle cx="285" cy="162" r="4.5" fill="var(--stop)" stroke="#fff" strokeWidth="2" />
          <rect x="231" y="6" width="108" height="22" rx="11" fill="var(--foreground)" />
          <text x="285" y="21" textAnchor="middle" fontSize="11" fontWeight="500" fill="#fff">
            Filler cluster · 3:42
          </text>
          <line x1="40" y1="174" x2="520" y2="174" stroke="#D4D3CD" strokeWidth="1" />
          <g fontSize="10.5" fill="#8A8A84">
            <text x="40" y="194" textAnchor="middle">0:00</text>
            <text x="160" y="194" textAnchor="middle">2:00</text>
            <text x="280" y="194" textAnchor="middle">4:00</text>
            <text x="400" y="194" textAnchor="middle">6:00</text>
            <text x="520" y="194" textAnchor="middle">8:24</text>
          </g>
        </svg>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full bg-foreground" />
            Pitch
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full bg-go" />
            Words per minute
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-[3px] bg-[#A3A39C]/40" />
            Pauses
          </span>
        </div>
      </div>
    </article>
  );
}

function RewriteCard() {
  return (
    <article className="surface flex flex-col p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="display text-[30px] leading-[1.05]">Better words for next time</h3>
        <span className="text-[13px] text-muted-foreground">3 rewrites</span>
      </div>
      <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-muted-foreground">
        Phrasing edits pinned to the second they happened, with a line on why
        the new version lands.
      </p>

      <div className="mt-6 flex flex-1 flex-col gap-4">
        <div className="rounded-2xl bg-background px-5 py-4">
          <p className="text-[12.5px] font-medium text-muted-foreground">What you said · 0:34</p>
          <p className="mt-1.5 text-[15.5px] leading-[1.5] text-muted-foreground line-through decoration-stop/50">
            &ldquo;I think this is kind of an important point, you know, that we
            should sort of pay attention to.&rdquo;
          </p>
        </div>
        <div className="rounded-2xl border border-border px-5 py-4">
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-go-ink">
            <Check className="size-3.5" strokeWidth={2.4} />
            Try instead
          </p>
          <p className="display mt-1.5 text-[30px] leading-[1.08]">
            &ldquo;This is the point. Pay attention to it.&rdquo;
          </p>
        </div>
        <p className="mt-auto text-[14px] leading-[1.6] text-muted-foreground">
          <span className="font-medium text-foreground">Why it works.</span>{" "}
          You&apos;re at the climax of the open. Every hedge tells the room you
          don&apos;t quite believe it either.
        </p>
      </div>
    </article>
  );
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-border bg-card py-24 sm:py-32">
      <div className="wrap grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <SectionHead
            label="Questions"
            title="A few things worth knowing."
            className="mb-0"
          />
          <p className="mt-5 max-w-[36ch] text-[15px] leading-[1.6] text-muted-foreground">
            Anything else? Use the feedback button in the corner. A real person
            reads every message.
          </p>
        </div>
        <div className="border-t border-border">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <details key={q} open={i === 0} className="group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[17px] font-medium tracking-[-0.005em] [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                >
                  <Plus className="size-4" strokeWidth={1.8} />
                </span>
              </summary>
              <p className="-mt-1 max-w-[62ch] pr-12 pb-6 text-[15.5px] leading-[1.65] text-muted-foreground">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
}

function ClosingCta({ prices }: { prices: PlanPrice[] | null }) {
  const yearly = prices?.find((p) => p.plan === "yearly");
  const monthly = prices?.find((p) => p.plan === "monthly");
  const priceLine = yearly
    ? `Then ${formatMoney(Math.round(yearly.amount / 12), yearly.currency)} a month, billed yearly${
        monthly ? `, or ${formatMoney(monthly.amount, monthly.currency)} monthly` : ""
      }.`
    : "Then a simple monthly or yearly plan.";

  return (
    <section className="bg-night text-white">
      <div className="wrap flex flex-col items-center py-24 text-center sm:py-32">
        <h2 className="display max-w-[16ch] text-[clamp(42px,6vw,76px)] leading-[0.98] tracking-[-0.02em]">
          Your next talk can be your best one.
        </h2>
        <p className="mt-6 max-w-[48ch] text-[17px] leading-[1.6] text-white/60">
          {`Unlimited reports, free for seven days. ${priceLine} Cancel any time before the trial ends and you won't be charged.`}
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/pricing" className="btn btn-light btn-lg">
            Start your free trial
          </Link>
          <Link
            href={SAMPLE_REPORT_HREF}
            className="btn btn-lg border-white/20 text-white hover:bg-white/10"
          >
            See a sample report
          </Link>
        </div>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-2 text-[13.5px] text-white/50">
          {["Unlimited analyses", "Eight-category scorecard", "Pitch and pace timeline", "Secure checkout by Stripe"].map(
            (item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <Check className="size-3.5 text-go" strokeWidth={2.4} />
                {item}
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
