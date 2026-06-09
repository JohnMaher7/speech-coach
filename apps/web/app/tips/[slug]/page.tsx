import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  TIPS_SECTIONS,
  getAdjacentSections,
  getTipsSection,
} from "@/lib/tips-content";

export function generateStaticParams() {
  return TIPS_SECTIONS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const section = getTipsSection(slug);
  if (!section) return {};
  return {
    title: `${section.title} — SpeakGrade`,
    description: section.summary,
  };
}

export default async function TipsSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = getTipsSection(slug);
  if (!section) notFound();

  const number = TIPS_SECTIONS.indexOf(section) + 1;
  const { prev, next } = getAdjacentSections(slug);

  return (
    <article>
      <p className="font-mono text-[10.5px] tracking-[0.14em] text-primary uppercase">
        Section {String(number).padStart(2, "0")} /{" "}
        {String(TIPS_SECTIONS.length).padStart(2, "0")}
      </p>
      <h1 className="mt-3 text-balance font-serif text-[clamp(30px,3.6vw,42px)] leading-[1.06] font-medium tracking-[-0.018em]">
        {section.title}
      </h1>
      <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-muted-foreground">
        {section.intro}
      </p>

      <ol className="mt-6 divide-y divide-border">
        {section.tips.map((tip, i) => (
          <li
            key={tip.heading}
            className="grid grid-cols-[auto_1fr] gap-x-5 py-7"
          >
            <span className="pt-[3px] font-mono text-[11px] text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="text-[16.5px] leading-snug font-medium">
                {tip.heading}
              </h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                {tip.body}
              </p>
              {tip.attribution && (
                <p className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground/80">
                  — {tip.attribution}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-[14px] border border-[color-mix(in_oklch,var(--primary)_18%,transparent)] bg-accent p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-[15px] font-medium">Reading is 10% of it.</p>
          <p className="mt-1 max-w-[46ch] text-[13.5px] leading-relaxed text-muted-foreground">
            The other 90% is reps with feedback. Upload a talk and see your
            fillers, pacing, and vocal variety measured.
          </p>
        </div>
        <Link
          href="/#upload"
          className="mt-4 inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] bg-foreground px-[14px] text-[13.5px] font-medium text-background transition-colors hover:bg-[oklch(0.22_0.01_264)] sm:mt-0"
        >
          Analyze a speech
          <ArrowRight className="size-[14px]" strokeWidth={2} />
        </Link>
      </div>

      <nav
        aria-label="Adjacent sections"
        className="mt-10 flex items-start justify-between gap-6 border-t border-border pt-6"
      >
        {prev ? (
          <Link
            href={`/tips/${prev.slug}`}
            className="group text-left text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase">
              Previous
            </span>
            <span className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
              <ArrowLeft className="size-[14px] transition-transform group-hover:-translate-x-0.5" />
              {prev.navLabel}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/tips/${next.slug}`}
            className="group text-right text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase">
              Next
            </span>
            <span className="mt-1 flex items-center justify-end gap-1.5 font-medium text-foreground">
              {next.navLabel}
              <ArrowRight className="size-[14px] transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
