import Link from "next/link";

import { Lamp, SignalBar } from "@/components/signal";
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
      <section className="wrap py-12 sm:py-16">
        <div className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            SpeakGrade
          </Link>
          <span className="text-border">/</span>
          <span>Sample reports</span>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-14">
          <h1 className="max-w-[14ch] font-display text-[clamp(48px,6.4vw,84px)] leading-[0.9] font-bold">
            See a report before you record.
          </h1>
          <p className="max-w-[52ch] text-[18px] leading-[1.55] text-[#2D302D]">
            Two real-format reports from two very different talks. Open either
            one to see every section a SpeakGrade report returns.
          </p>
        </div>

        <div className="mt-10 grid gap-[3px] md:grid-cols-2">
          {SAMPLES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col border-t-[3px] border-foreground bg-card px-5 pt-5 pb-6 transition-colors hover:bg-muted sm:px-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[14.5px] font-medium text-muted-foreground">
                    {s.meta}
                  </p>
                  <h2 className="mt-1 font-display text-[34px] leading-none font-bold underline-offset-4 group-hover:underline">
                    {s.title}
                  </h2>
                </div>
                <span className="flex items-center gap-2 font-display text-[44px] leading-none font-bold">
                  <Lamp tone={s.tone} className="size-3" />
                  {s.score.toFixed(1)}
                </span>
              </div>
              <SignalBar
                filled={Math.round(s.score)}
                tone={s.tone}
                className="mt-4"
              />
              <p className="mt-4 flex-1 text-[16px] leading-[1.55] text-[#2D302D]">
                {s.body}
              </p>
              <span className="btn btn-ink mt-6 self-start">Open report</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
