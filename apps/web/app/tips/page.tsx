import type { Metadata } from "next";
import Link from "next/link";
import { Lamp } from "@/components/signal";

import { TIPS_SECTIONS } from "@/lib/tips-content";

export const metadata: Metadata = {
  title: "Public Speaking Tips — SpeakGrade",
  description:
    "A research-backed field guide to public speaking: beating the fear, delivery, prepared speeches, impromptu speaking, presentations, speaking online, and the myths to unlearn.",
};

export default function TipsIndexPage() {
  return (
    <main className="flex-1">
      <section className="wrap pt-12 pb-24 sm:pt-16 sm:pb-32">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3.5 pl-2.5 text-[13.5px] font-medium text-ink-2 shadow-soft">
              <Lamp tone="good" />
              Research-backed · zero folklore
            </p>
            <h1 className="display mt-6 max-w-[13ch] text-[clamp(48px,6.4vw,84px)] leading-[0.98] tracking-[-0.02em]">
              A field guide to better speaking
            </h1>
          </div>
          <p className="max-w-[48ch] text-[17px] leading-[1.6] text-ink-2">
            Eight short sections of advice that survives scrutiny, from beating
            the fear to landing an impromptu answer. Sourced from research and
            expert consensus, not recycled listicles.
          </p>
        </div>

        <ol className="surface mt-14 divide-y divide-border overflow-hidden">
          {TIPS_SECTIONS.map((section, i) => (
            <li key={section.slug}>
              <Link
                href={`/tips/${section.slug}`}
                className="group grid grid-cols-[40px_1fr] items-baseline gap-x-4 gap-y-1 px-5 py-6 transition-colors hover:bg-background sm:grid-cols-[64px_minmax(0,300px)_1fr] sm:gap-x-6 sm:px-8 sm:py-7"
              >
                <span className="text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="display text-[30px] leading-[1.05]">
                  {section.navLabel}
                </h2>
                <p className="col-start-2 text-[15px] leading-[1.6] text-muted-foreground sm:col-start-3">
                  {section.summary}
                </p>
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-[13px] text-muted-foreground">
          Every claim traces to published research or expert consensus · famous
          advice that failed replication lives in section 08
        </p>
      </section>
    </main>
  );
}
