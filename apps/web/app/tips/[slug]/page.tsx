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
      <p className="eyebrow">
        Section {String(number).padStart(2, "0")} of{" "}
        {String(TIPS_SECTIONS.length).padStart(2, "0")}
      </p>
      <h1 className="display mt-4 text-[clamp(42px,5.4vw,66px)] leading-[1.0] tracking-[-0.02em]">
        {section.title}
      </h1>
      <p className="mt-6 max-w-[60ch] text-[17.5px] leading-[1.65] text-ink-2">
        {section.intro}
      </p>

      <ol className="mt-12 border-t border-border">
        {section.tips.map((tip, i) => (
          <li
            key={tip.heading}
            className="grid grid-cols-[36px_1fr] gap-x-4 border-b border-border py-8 sm:grid-cols-[56px_1fr]"
          >
            <span className="pt-2 text-[13px] font-medium text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="display text-[30px] leading-[1.08]">
                {tip.heading}
              </h2>
              <p className="mt-3 max-w-[64ch] text-[16px] leading-[1.7] text-ink-2">
                {tip.body}
              </p>
              {tip.attribution && (
                <p className="mt-4 text-[13px] text-muted-foreground">
                  {tip.attribution}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-col gap-6 rounded-[24px] bg-night px-7 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-9">
        <div>
          <p className="display text-[34px] leading-none">
            Reading is 10% of it.
          </p>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-white/60">
            The other 90% is reps with feedback. Upload a talk and see your
            fillers, pacing, and vocal variety measured.
          </p>
        </div>
        <Link
          href="/#upload"
          className="btn btn-light shrink-0 self-start sm:self-auto"
        >
          Analyze a speech
        </Link>
      </div>

      <nav
        aria-label="Adjacent sections"
        className="mt-8 grid grid-cols-2 gap-4"
      >
        {prev ? (
          <Link
            href={`/tips/${prev.slug}`}
            className="group surface px-5 py-5 transition-shadow hover:shadow-lift sm:px-6"
          >
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <ArrowLeft className="size-3.5" />
              Previous
            </span>
            <span className="display mt-2 block text-[24px] leading-tight">
              {prev.navLabel}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/tips/${next.slug}`}
            className="group surface px-5 py-5 text-right transition-shadow hover:shadow-lift sm:px-6"
          >
            <span className="flex items-center justify-end gap-1.5 text-[13px] text-muted-foreground">
              Next
              <ArrowRight className="size-3.5" />
            </span>
            <span className="display mt-2 block text-[24px] leading-tight">
              {next.navLabel}
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
