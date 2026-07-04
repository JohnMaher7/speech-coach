import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { TIPS_SECTIONS } from "@/lib/tips-content";

export const metadata: Metadata = {
  title: "Public Speaking Tips — SpeakGrade",
  description:
    "A research-backed field guide to public speaking: beating the fear, delivery, prepared speeches, impromptu speaking, presentations, speaking online, and the myths to unlearn.",
};

export default function TipsIndexPage() {
  return (
    <main className="flex-1">
      <section className="py-[72px]">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
          <div className="mx-auto max-w-[640px] text-center">
            <span className="inline-flex h-7 items-center gap-[9px] rounded-full border border-[color-mix(in_oklch,var(--primary)_18%,transparent)] bg-accent px-[13px] text-xs font-medium text-primary">
              <span className="size-[6px] rounded-full bg-primary" />
              Research-backed · zero folklore
            </span>

            <h1 className="my-[18px] text-balance font-serif text-[clamp(36px,4.4vw,52px)] leading-[1.02] font-medium tracking-[-0.022em]">
              A field guide to better speaking
            </h1>

            <p className="mx-auto max-w-[54ch] text-[16.5px] leading-relaxed text-muted-foreground">
              Eight short sections of advice that survives scrutiny, from
              beating the fear to landing an impromptu answer. Sourced from
              research and expert consensus, not recycled listicles.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-[860px] grid-cols-1 gap-4 sm:grid-cols-2">
            {TIPS_SECTIONS.map((section, i) => (
              <Link
                key={section.slug}
                href={`/tips/${section.slug}`}
                className="group rounded-[14px] border border-border bg-card p-6 transition-colors hover:border-[color-mix(in_oklch,var(--primary)_32%,transparent)]"
              >
                <p className="font-mono text-[10.5px] tracking-[0.14em] text-primary uppercase">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-[15.5px] font-medium">
                  {section.navLabel}
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {section.summary}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
                  Read section
                  <ArrowRight className="size-[13px] transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-[52ch] text-center font-mono text-[11.5px] tracking-wide text-muted-foreground">
            Every claim traces to published research or expert consensus ·
            famous advice that failed replication lives in section 08
          </p>
        </div>
      </section>
    </main>
  );
}
