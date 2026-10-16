import Link from "next/link";

import { ScoreRing, SignalBar } from "@/components/signal";
import { verdict } from "@/lib/scores";
import type { ScoreTone } from "@/lib/scores";

const SAMPLES: {
  href: string;
  title: string;
  meta: string;
  score: number;
  tone: ScoreTone;
  body: string;
}[] = [
  {
    href: "/report/sample/clean",
    title: "A polished talk",
    meta: "Prepared · 4:35",
    score: 4.6,
    tone: "good",
    body: "Every category lands a 4 or 5. The walk-through reads mostly as praise, with a few hedges to trim and three small phrasing rewrites.",
  },
  {
    href: "/report/sample/messy",
    title: "A talk that needs work",
    meta: "Prepared · 4:42",
    score: 2.0,
    tone: "low",
    body: "Eighteen fillers, one pause, flat pitch and a trailing close. You get the full treatment: ranked priorities, drills and four phrasing rewrites.",
  },
];

export default function SampleIndexPage() {
  return (
    <main className="flex-1">
      <section className="wrap pt-12 pb-24 sm:pt-16 sm:pb-32">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            SpeakGrade
          </Link>
          <span className="text-border-strong">/</span>
          <span>Sample reports</span>
        </nav>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <h1 className="display max-w-[14ch] text-[clamp(48px,6.4vw,84px)] leading-[0.98] tracking-[-0.02em]">
            See a report before you record.
          </h1>
          <p className="max-w-[46ch] text-[17px] leading-[1.6] text-ink-2">
            Two real-format reports from two very different talks. Open either
            one to see every section a SpeakGrade report returns.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {SAMPLES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group surface flex flex-col p-7 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-float sm:p-8"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="eyebrow">{s.meta}</p>
                  <h2 className="display mt-3 text-[38px] leading-[1.02]">
                    {s.title}
                  </h2>
                </div>
                <ScoreRing
                  score={s.score}
                  tone={s.tone}
                  size={88}
                  stroke={5}
                  label={
                    <div className="text-[10.5px] font-medium text-muted-foreground">
                      {verdict(s.score)}
                    </div>
                  }
                />
              </div>
              <SignalBar
                filled={Math.round(s.score)}
                tone={s.tone}
                className="mt-7"
              />
              <p className="mt-6 flex-1 text-[15.5px] leading-[1.65] text-muted-foreground">
                {s.body}
              </p>
              <span className="btn btn-ink mt-8 self-start">Open report</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
