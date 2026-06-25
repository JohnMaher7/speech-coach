import type { Metadata } from "next";
import { PricingTable } from "@clerk/nextjs";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — SpeakGrade",
  description:
    "Start a 7-day free trial. Unlimited evaluator-style speech reports. Cancel anytime.",
};

const INCLUDED: string[] = [
  "Unlimited speech analyses",
  "Full evaluator-style report — fillers, pacing, vocal variety, structure",
  "Pace & pitch timeline charts",
  "Report history across your devices",
];

export default function PricingPage() {
  return (
    <main className="flex-1">
      <section className="py-[72px]">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
          {/* Header */}
          <div className="mx-auto max-w-[640px] text-center">
            <span className="inline-flex h-7 items-center gap-[9px] rounded-full border border-[color-mix(in_oklch,var(--primary)_18%,transparent)] bg-accent px-[13px] text-xs font-medium text-primary">
              <span className="size-[6px] rounded-full bg-primary" />
              7 days free · cancel anytime
            </span>

            <h1 className="my-[18px] text-balance font-serif text-[clamp(36px,4.4vw,52px)] leading-[1.02] font-medium tracking-[-0.022em]">
              Coaching for every talk you give
            </h1>

            <p className="mx-auto max-w-[52ch] text-[16.5px] leading-relaxed text-muted-foreground">
              Start with a 7-day free trial. We&apos;ll ask for a card up front,
              but you&apos;re only charged after the trial — and you can cancel
              any time before then.
            </p>
          </div>

          {/* Plans — Monthly / Yearly toggle + trial CTA are rendered by Clerk
              from the plan configured in the dashboard. */}
          <div className="mx-auto mt-12 max-w-[900px]">
            <PricingTable />
          </div>

          {/* What's included */}
          <ul className="mx-auto mt-12 grid max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[14.5px] text-foreground"
              >
                <Check
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  strokeWidth={2.4}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-10 max-w-[52ch] text-center font-mono text-[11.5px] tracking-wide text-muted-foreground">
            Secure checkout by Stripe · manage or cancel your plan anytime from
            your account menu
          </p>
        </div>
      </section>
    </main>
  );
}
