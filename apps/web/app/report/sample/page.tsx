import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SAMPLES = [
  {
    href: "/report/sample/clean",
    title: "Clean speech",
    subtitle: "Prepared · 8:24 · overall 4.7",
    body: "Every category lands 4 or 5. Walk-through reads as praise; no delivery-habit deep-dives; no rewrites. Use this to sanity-check the “quiet” branches of the layout.",
  },
  {
    href: "/report/sample/messy",
    title: "Messy speech",
    subtitle: "Prepared · 4:42 · overall 2.0",
    body: "Eighteen fillers, one pause, flat pitch, trailing close. Every delivery-habit section is non-null, four rewrites land, priorities all critique. The full deep-dive branch.",
  },
];

export default function SampleIndexPage() {
  return (
    <main className="flex-1">
      <section className="py-12 pb-6">
        <div className="mx-auto w-full max-w-[920px] px-8">
          <div className="mb-[18px] flex items-center gap-[10px] font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            <Link href="/" className="transition-colors hover:text-foreground">
              SpeakGrade
            </Link>
            <span className="opacity-50">/</span>
            <span>Sample reports</span>
          </div>

          <h1 className="my-[6px] mb-[22px] text-balance font-serif text-[clamp(36px,4vw,48px)] leading-[1.05] font-medium tracking-[-0.02em]">
            Two fixtures, two{" "}
            <em className="font-medium text-primary italic">branches</em>.
          </h1>
          <p className="max-w-[640px] text-[15px] leading-[1.6] text-[oklch(0.35_0.01_264)]">
            Stage 32 fixtures for visual QA. The clean speech hits the
            short-circuit paths (no delivery habits, no rewrites). The messy
            speech hits every conditional branch.
          </p>
        </div>
      </section>

      <section className="py-6 pb-20">
        <div className="mx-auto grid w-full max-w-[920px] gap-3 px-8 sm:grid-cols-2">
          {SAMPLES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-[18px] border border-border bg-card px-6 py-[22px] transition-colors hover:border-primary/40"
            >
              <div className="mb-[10px] font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">
                {s.subtitle}
              </div>
              <h2 className="mb-[10px] font-serif text-[24px] leading-[1.15] font-medium tracking-[-0.01em] text-foreground">
                {s.title}
              </h2>
              <p className="text-[14px] leading-[1.6] text-[oklch(0.35_0.01_264)]">
                {s.body}
              </p>
              <div className="mt-4 inline-flex items-center gap-[6px] text-[13px] font-medium text-primary">
                Open
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-[2px]"
                  strokeWidth={2.2}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
