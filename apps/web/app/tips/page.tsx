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
      <section className="wrap py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2.5 text-[15px] font-medium text-muted-foreground">
              <Lamp tone="good" />
              Research-backed · zero folklore
            </p>
            <h1 className="mt-3 max-w-[13ch] font-display text-[clamp(48px,6.4vw,84px)] leading-[0.9] font-bold">
              A field guide to better speaking
            </h1>
          </div>
          <p className="max-w-[54ch] text-[18px] leading-[1.55] text-[#2D302D]">
            Eight short sections of advice that survives scrutiny, from beating
            the fear to landing an impromptu answer. Sourced from research and
            expert consensus, not recycled listicles.
          </p>
        </div>

        <ol className="mt-10 divide-y divide-border border-t-[3px] border-foreground bg-card">
          {TIPS_SECTIONS.map((section, i) => (
            <li key={section.slug}>
              <Link
                href={`/tips/${section.slug}`}
                className="group grid grid-cols-[48px_1fr] items-baseline gap-x-4 gap-y-1 px-4 py-5 transition-colors hover:bg-muted sm:grid-cols-[72px_minmax(0,300px)_1fr] sm:px-6"
              >
                <span className="font-display text-[40px] leading-none font-bold text-muted-foreground group-hover:text-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-[28px] leading-[1.02] font-bold underline-offset-4 group-hover:underline">
                  {section.navLabel}
                </h2>
                <p className="col-start-2 text-[16px] leading-[1.5] text-muted-foreground sm:col-start-3">
                  {section.summary}
                </p>
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-[14.5px] text-muted-foreground">
          Every claim traces to published research or expert consensus · famous
          advice that failed replication lives in section 08
        </p>
      </section>
    </main>
  );
}
