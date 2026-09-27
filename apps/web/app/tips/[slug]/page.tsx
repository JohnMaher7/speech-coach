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
      <p className="text-[15px] font-medium text-muted-foreground">
        Section {String(number).padStart(2, "0")} /{" "}
        {String(TIPS_SECTIONS.length).padStart(2, "0")}
      </p>
      <h1 className="mt-2 text-balance font-display text-[clamp(42px,5.4vw,64px)] leading-[0.92] font-bold">
        {section.title}
      </h1>
      <p className="mt-5 max-w-[60ch] text-[18px] leading-[1.55] text-[#2D302D]">
        {section.intro}
      </p>

      <ol className="mt-8 divide-y divide-border border-t-[3px] border-foreground bg-card">
        {section.tips.map((tip, i) => (
          <li
            key={tip.heading}
            className="grid grid-cols-[40px_1fr] gap-x-4 px-4 py-6 sm:grid-cols-[56px_1fr] sm:px-6"
          >
            <span className="font-display text-[34px] leading-[0.9] font-bold text-muted-foreground">
              {i + 1}
            </span>
            <div>
              <h2 className="font-display text-[26px] leading-[1.05] font-bold">
                {tip.heading}
              </h2>
              <p className="mt-2 max-w-[64ch] text-[16.5px] leading-[1.6] text-[#2D302D]">
                {tip.body}
              </p>
              {tip.attribution && (
                <p className="mt-3 text-[14.5px] font-medium text-muted-foreground">
                  {tip.attribution}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-5 bg-foreground px-5 py-6 text-card sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-[28px] leading-none font-bold">
            Reading is 10% of it.
          </p>
          <p className="mt-2 max-w-[46ch] text-[15.5px] leading-[1.55] text-[#B9BDB8]">
            The other 90% is reps with feedback. Upload a talk and see your
            fillers, pacing, and vocal variety measured.
          </p>
        </div>
        <Link
          href="/#upload"
          className="btn shrink-0 self-start bg-card text-foreground hover:bg-muted sm:self-auto"
        >
          Analyze a speech
        </Link>
      </div>

      <nav
        aria-label="Adjacent sections"
        className="mt-10 grid grid-cols-2 gap-[3px]"
      >
        {prev ? (
          <Link
            href={`/tips/${prev.slug}`}
            className="group bg-card px-4 py-4 transition-colors hover:bg-muted sm:px-5"
          >
            <span className="flex items-center gap-1.5 text-[14.5px] font-medium text-muted-foreground">
              <ArrowLeft className="size-4" />
              Previous
            </span>
            <span className="mt-1 block font-display text-[22px] leading-tight font-bold">
              {prev.navLabel}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/tips/${next.slug}`}
            className="group bg-card px-4 py-4 text-right transition-colors hover:bg-muted sm:px-5"
          >
            <span className="flex items-center justify-end gap-1.5 text-[14.5px] font-medium text-muted-foreground">
              Next
              <ArrowRight className="size-4" />
            </span>
            <span className="mt-1 block font-display text-[22px] leading-tight font-bold">
              {next.navLabel}
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
