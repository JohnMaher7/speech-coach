import Link from "next/link";

import { LiveWaveform } from "@/components/live-waveform";
import { Lamp, SectionHead, SignalBar } from "@/components/signal";
import { UploadForm } from "@/components/upload-form";
import type { ScoreTone } from "@/lib/scores";

const SAMPLE_REPORT_HREF = "/report/sample";

const RUBRIC_TILES: {
  key: "fillers" | "pacing" | "vocal" | "structure";
  title: string;
  body: string;
  reading: string;
  unit: string;
  tone: ScoreTone;
}[] = [
  {
    key: "fillers",
    title: "Fillers",
    body: 'Every "um", "uh", "like", "you know" — counted and timestamped to the second.',
    reading: "23",
    unit: "in 8:24",
    tone: "mid",
  },
  {
    key: "pacing",
    title: "Pacing",
    body: "Words per minute over the whole talk, plus where your deliberate pauses landed.",
    reading: "148",
    unit: "words / min",
    tone: "good",
  },
  {
    key: "vocal",
    title: "Vocal variety",
    body: "Pitch range and energy — are you landing emphasis, or droning in one note?",
    reading: "2.4",
    unit: "octaves",
    tone: "good",
  },
  {
    key: "structure",
    title: "Structure",
    body: "Opening, signposting, and whether the close actually closes the talk.",
    reading: "5 / 5",
    unit: "tight close",
    tone: "good",
  },
];

const STEPS: { title: string; body: string; timing: string }[] = [
  {
    title: "Upload a recording",
    body: "An MP3, WAV, or M4A of any talk — up to twenty minutes.",
    timing: "≈ 5 sec",
  },
  {
    title: "SpeakGrade analyses it",
    body: "Transcription, acoustic measurement, and an AI evaluator run together, not in sequence.",
    timing: "≈ 3 min",
  },
  {
    title: "Get coached",
    body: "An evaluator-style report with rubric scores, a pitch-and-pace timeline, and your top three actions.",
    timing: "read in 90 sec",
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
    <section className="pt-12 pb-16 sm:pt-16">
      <div className="wrap grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.08fr_1fr] lg:gap-14">
        <div>
          <p className="inline-flex items-center gap-2.5 text-[15px] font-medium text-muted-foreground">
            <Lamp tone="good" />
            7-day free trial · cancel anytime · ~3 minute turnaround
          </p>

          <h1 className="mt-4 mb-5 max-w-[12ch] font-display text-[clamp(54px,7.4vw,98px)] leading-[0.9] font-bold">
            Get an evaluator&apos;s notes on any speech.
          </h1>

          <p className="mb-8 max-w-[44ch] text-[19px] leading-[1.5] text-[#2D302D]">
            Upload a recording. SpeakGrade returns a scored report on fillers,
            pacing, vocal variety, and structure — plus the three things to work
            on next.
          </p>

          <UploadForm />

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Lamp tone="good" />
              Audio never stored
            </span>
            <span className="inline-flex items-center gap-2">
              <Lamp tone="good" />
              Works in any browser
            </span>
            <Link
              href={SAMPLE_REPORT_HREF}
              className="font-semibold text-foreground underline decoration-[1.5px] underline-offset-4 hover:decoration-[3px]"
            >
              See a sample report
            </Link>
          </div>
        </div>

        <div>
          <HeroReport />
          <Link
            href={SAMPLE_REPORT_HREF}
            className="mt-3 inline-block text-[15px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            See the full sample report
          </Link>
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
    <Link
      href={SAMPLE_REPORT_HREF}
      aria-label="Sample report preview — open the full sample report"
      className="block border-t-[3px] border-foreground bg-card transition-[outline] hover:outline-2 hover:outline-foreground"
    >
      <header className="grid grid-cols-[1fr_auto] items-start gap-4 px-5 pt-5 pb-4">
        <div>
          <div className="text-[14px] font-medium text-muted-foreground">
            Report · 04 Nov 2025
          </div>
          <div className="mt-1 font-display text-[28px] leading-[1.02] font-bold">
            Quarterly all-hands — opening segment
          </div>
          <div className="mt-2 text-[14.5px] text-muted-foreground">
            8:24 · 1,247 words · 148 wpm
          </div>
        </div>
        <div className="grid grid-cols-[auto_auto] items-center gap-3 bg-foreground px-3.5 py-3 text-card">
          <div className="grid gap-1.5" aria-hidden>
            <span className="block size-3 rounded-full bg-go shadow-[0_0_0_3px_rgb(14_159_91/0.25)]" />
            <span className="block size-3 rounded-full bg-[#2C2E2C]" />
            <span className="block size-3 rounded-full bg-[#2C2E2C]" />
          </div>
          <div>
            <div className="font-display text-[40px] leading-[0.9] font-bold">4.1</div>
            <div className="text-[12.5px] text-[#B9BDB8]">Overall</div>
          </div>
        </div>
      </header>

      <ReportWave />

      <div className="grid gap-3 px-5 py-4">
        {HERO_RUBRIC.map((r) => (
          <div key={r.name} className="grid grid-cols-[112px_1fr_38px] items-center gap-3">
            <span className="text-[15px] font-semibold">{r.name}</span>
            <SignalBar filled={r.score} tone={r.tone} />
            <span className="text-right font-display text-[18px] font-bold">
              {r.score} / 5
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[34px_1fr] gap-3 border-t border-border px-5 pt-4 pb-5">
        <span className="font-display text-[44px] leading-[0.8] font-bold">1</span>
        <div>
          <b className="font-display text-[21px] leading-tight font-bold">
            Cut &ldquo;kind of&rdquo; from the opening.
          </b>
          <p className="mt-1 text-[14.5px] leading-[1.5] text-muted-foreground">
            It appears 14 times in the first two minutes — soften nowhere,
            sharpen everywhere.
          </p>
        </div>
      </div>
    </Link>
  );
}

const HERO_WAVE_BARS: { h: number; kind?: "hot" | "pause" }[] = [
  { h: 30 }, { h: 55 }, { h: 42 }, { h: 68 }, { h: 80, kind: "hot" },
  { h: 74, kind: "hot" }, { h: 36 }, { h: 48 }, { h: 72 }, { h: 62 },
  { h: 34 }, { h: 50 }, { h: 18, kind: "pause" }, { h: 16, kind: "pause" },
  { h: 66 }, { h: 78 }, { h: 55 }, { h: 84 }, { h: 46 }, { h: 30 },
  { h: 60 }, { h: 88, kind: "hot" }, { h: 78, kind: "hot" }, { h: 38 },
  { h: 68 }, { h: 82 }, { h: 44 }, { h: 58 }, { h: 36 }, { h: 50 },
  { h: 42 }, { h: 62 }, { h: 55 }, { h: 48 }, { h: 30 },
];

function ReportWave() {
  return (
    <div className="border-y border-border bg-muted px-5 pt-3 pb-2.5">
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="font-medium text-muted-foreground">Delivery</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-stop-ink">
          <Lamp tone="low" className="size-2" />
          filler cluster · 3:42
        </span>
      </div>
      <div className="flex h-14 items-center gap-[2px]" aria-hidden>
        {HERO_WAVE_BARS.map((b, i) => (
          <span
            key={i}
            className={`flex-1 ${
              b.kind === "hot"
                ? "bg-stop"
                : b.kind === "pause"
                  ? "bg-lamp-off"
                  : "bg-foreground"
            }`}
            style={{ height: `${b.h}%`, minHeight: 4 }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] text-muted-foreground">
        <span>0:00</span>
        <span>2:00</span>
        <span>4:00</span>
        <span>6:00</span>
        <span>8:24</span>
      </div>
    </div>
  );
}

function ListeningBand() {
  return (
    <section id="measure" className="scroll-mt-16 bg-foreground py-16 text-card sm:py-20">
      <div className="wrap">
        <div className="mb-10 grid grid-cols-1 items-end gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2.5 text-[15px] font-medium text-[#B9BDB8]">
              <Lamp tone="good" className="[animation:lamp-blink_1.6s_ease-in-out_infinite]" />
              Listening · analysis in progress
            </p>
            <h2 className="mt-3 max-w-[16ch] text-balance font-display text-[clamp(40px,5vw,60px)] leading-[0.95] font-bold">
              An ear for every um, pause, and beat.
            </h2>
          </div>
          <p className="max-w-[46ch] text-[17px] leading-[1.55] text-[#B9BDB8]">
            SpeakGrade measures four things you can act on. Each one is scored,
            timestamped, and explained in plain language — not a wall of
            numbers.
          </p>
        </div>

        <LiveWaveform />

        <div className="grid grid-cols-1 gap-px border-y border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {RUBRIC_TILES.map((tile) => (
            <div key={tile.key} className="bg-foreground py-6 sm:px-6">
              <h3 className="flex items-center gap-2.5 font-display text-[28px] leading-none font-bold">
                <Lamp tone={tile.tone} />
                {tile.title}
              </h3>
              <p className="mt-2.5 max-w-[34ch] text-[15px] leading-[1.5] text-[#B9BDB8]">
                {tile.body}
              </p>
              <div className="mt-4 flex items-baseline gap-2.5">
                <span className="font-display text-[46px] leading-none font-bold">
                  {tile.reading}
                </span>
                <span className="text-[14.5px] text-[#8C928B]">{tile.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 py-16 sm:py-20">
      <div className="wrap">
        <SectionHead
          label="How it works"
          title="Three steps. Roughly three minutes."
          aside="No install, no waiting room, no setup. SpeakGrade runs a transcription, an acoustic pass, and an evaluator-style synthesis in parallel."
        />
        <ol className="grid grid-cols-1 gap-[3px] sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="grid grid-rows-[auto_auto_1fr_auto] border-t-[3px] border-foreground bg-card px-5 pt-5 pb-5"
            >
              <span className="font-display text-[72px] leading-[0.8] font-bold">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-[28px] leading-none font-bold">
                {s.title}
              </h3>
              <p className="mt-2 max-w-[32ch] text-[16px] leading-[1.55] text-[#2D302D]">
                {s.body}
              </p>
              <div className="mt-5 border-t border-border pt-3 font-display text-[22px] font-semibold text-muted-foreground">
                {s.timing}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function BeyondTheScore() {
  return (
    <section id="beyond" className="pb-16 sm:pb-20">
      <div className="wrap">
        <SectionHead
          label="Beyond the score"
          title="Pitch & pace over time. And better words to say next."
          aside="Scores tell you where you stand. The chart and the rewrites tell you what to change — at which second, in which sentence."
        />

        <div className="grid grid-cols-1 items-stretch gap-[3px] lg:grid-cols-[1.35fr_1fr]">
          <ChartCard />
          <RewriteCard />
        </div>

        <div className="mt-[3px] flex flex-col items-start justify-between gap-4 bg-card px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <p className="max-w-[60ch] text-[16px] text-muted-foreground">
            <b className="font-semibold text-foreground">
              See the full sample report.
            </b>{" "}
            Rubric, top 3 actions, all rewrites, the live chart, by-the-numbers
            — the entire surface a real upload returns.
          </p>
          <Link href={SAMPLE_REPORT_HREF} className="btn btn-ink shrink-0">
            Open sample report
          </Link>
        </div>
      </div>
    </section>
  );
}

function ChartCard() {
  return (
    <article className="flex flex-col border-t-[3px] border-foreground bg-card px-5 pt-5 pb-5 sm:px-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <p className="text-[14.5px] font-medium text-muted-foreground">
            Pitch &amp; pace
          </p>
          <h3 className="font-display text-[30px] leading-none font-bold">
            Pitch &amp; pace, second by second.
          </h3>
        </div>
        <span className="text-[14.5px] text-muted-foreground">
          <b className="font-semibold text-foreground">8:24</b> · 4 pauses
        </span>
      </div>
      <p className="mb-4 max-w-[52ch] text-[15.5px] leading-[1.55] text-[#2D302D]">
        A two-line chart over the length of your talk: pitch in Hz, words per
        minute, and grey bands where you paused. Hover any peak to see what you
        were saying.
      </p>

      <div className="flex-1">
        <svg
          viewBox="0 0 556 204"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Pitch and words-per-minute chart"
          className="block h-auto w-full"
        >
          {[
            [108, 10],
            [248, 22],
            [346, 8],
            [452, 16],
          ].map(([x, w]) => (
            <rect key={x} x={x} y={24} width={w} height={150} fill="#8C928B" opacity={0.22} />
          ))}
          <g stroke="#E3E6E0" strokeWidth="1">
            <line x1="40" y1="44" x2="520" y2="44" />
            <line x1="40" y1="84" x2="520" y2="84" />
            <line x1="40" y1="124" x2="520" y2="124" />
            <line x1="40" y1="164" x2="520" y2="164" />
          </g>
          <g fontSize="11" fill="#555A55">
            <text x="34" y="48" textAnchor="end">240</text>
            <text x="34" y="88" textAnchor="end">180</text>
            <text x="34" y="128" textAnchor="end">120</text>
            <text x="34" y="168" textAnchor="end">80</text>
          </g>
          <g fontSize="11" fill="#0A7A45">
            <text x="526" y="48">200</text>
            <text x="526" y="88">160</text>
            <text x="526" y="128">120</text>
            <text x="526" y="168">80</text>
          </g>
          <path
            d="M 40 102 L 75 96 L 110 110 L 145 88 L 180 100 L 215 116 L 250 132 L 285 148 L 320 138 L 355 116 L 390 100 L 425 108 L 460 92 L 495 96 L 520 124"
            fill="none"
            stroke="#0E9F5B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M 40 128 L 75 92 L 110 110 L 145 64 L 180 88 L 215 108 L 250 144 L 285 162 L 320 144 L 355 112 L 390 88 L 425 116 L 460 56 L 495 80 L 520 116"
            fill="none"
            stroke="#151515"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="145" cy="64" r="3.5" fill="#FFFFFF" stroke="#151515" strokeWidth="2" />
          <circle cx="460" cy="56" r="3.5" fill="#FFFFFF" stroke="#151515" strokeWidth="2" />
          <circle cx="285" cy="162" r="4" fill="#DA3A2B" />
          <line x1="285" y1="24" x2="285" y2="174" stroke="#DA3A2B" strokeWidth="1.5" />
          <rect x="236" y="4" width="98" height="20" fill="#DA3A2B" />
          <text x="285" y="18" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#FFFFFF">
            filler cluster · 3:42
          </text>
          <line x1="40" y1="174" x2="520" y2="174" stroke="#8C928B" strokeWidth="1" />
          <g fontSize="11" fill="#555A55">
            <text x="40" y="192" textAnchor="middle">0:00</text>
            <text x="160" y="192" textAnchor="middle">2:00</text>
            <text x="280" y="192" textAnchor="middle">4:00</text>
            <text x="400" y="192" textAnchor="middle">6:00</text>
            <text x="520" y="192" textAnchor="middle">8:24</text>
          </g>
        </svg>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 bg-foreground" />
            Pitch · Hz
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 bg-go" />
            Words / min
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 bg-[#8C928B]/40" />
            Pauses
          </span>
        </div>
      </div>
    </article>
  );
}

function RewriteCard() {
  return (
    <article className="flex flex-col border-t-[3px] border-foreground bg-card px-5 pt-5 pb-5 sm:px-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-[30px] leading-none font-bold">
          Better words to say next time.
        </h3>
        <span className="text-[14.5px] text-muted-foreground">
          <b className="font-semibold text-foreground">3</b> rewrites
        </span>
      </div>
      <p className="mb-5 max-w-[46ch] text-[15.5px] leading-[1.55] text-[#2D302D]">
        Side-by-side phrasing edits at the exact second they happened — with a
        one-line explanation of why the new version lands.
      </p>

      <div className="flex flex-1 flex-col gap-4">
        <div>
          <p className="text-[14.5px] font-medium text-muted-foreground">
            What you said · 00:34
          </p>
          <p className="mt-1 text-[17px] leading-[1.45] text-muted-foreground line-through decoration-stop decoration-2">
            &ldquo;I think this is kind of an important point, you know, that we
            should sort of pay attention to.&rdquo;
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-[14.5px] font-medium text-muted-foreground">
            Try instead
          </p>
          <p className="mt-1 font-display text-[32px] leading-[1.02] font-bold">
            &ldquo;This is the point. Pay attention to it.&rdquo;
          </p>
        </div>
        <p className="text-[15px] leading-[1.55] text-[#2D302D]">
          <b className="font-bold text-foreground">Why.</b> You&apos;re at the
          climax of the open. Every hedge tells the room the speaker
          doesn&apos;t believe it either — strip them all.
        </p>
      </div>
    </article>
  );
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 pb-20 sm:pb-24">
      <div className="wrap grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        <SectionHead
          label="Common questions"
          title="A few things worth knowing upfront."
          className="mb-0"
        />
        <div className="border-t-[3px] border-foreground">
          {FAQ_ITEMS.map(({ q, a, open }) => (
            <details key={q} open={open} className="group border-b border-border py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px] font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  aria-hidden
                  className="font-display text-[28px] leading-none font-bold group-open:hidden"
                >
                  +
                </span>
                <span
                  aria-hidden
                  className="hidden font-display text-[28px] leading-none font-bold group-open:inline"
                >
                  −
                </span>
              </summary>
              <p className="mt-2.5 max-w-[64ch] text-[16px] leading-[1.6] text-[#2D302D]">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
