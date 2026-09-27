import type { Metadata } from "next";
import { PricingTable } from "@clerk/nextjs";
import { Lamp } from "@/components/signal";

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
      <section className="wrap py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2.5 text-[15px] font-medium text-muted-foreground">
              <Lamp tone="good" />
              7 days free · cancel anytime
            </p>
            <h1 className="mt-3 max-w-[14ch] font-display text-[clamp(48px,6.4vw,84px)] leading-[0.9] font-bold">
              Coaching for every talk you give
            </h1>
          </div>
          <p className="max-w-[52ch] text-[18px] leading-[1.55] text-[#2D302D]">
            Start with a 7-day free trial. We&apos;ll ask for a card up front,
            but you&apos;re only charged after the trial — and you can cancel
            any time before then.
          </p>
        </div>

        {/* Plans — Monthly / Yearly toggle + trial CTA are rendered by Clerk
            from the plan configured in the dashboard. */}
        <div className="mt-10 border-t-[3px] border-foreground bg-card px-4 py-6 sm:px-6">
          <PricingTable />
        </div>

        <div className="mt-[3px] bg-card px-4 py-6 sm:px-6">
          <h2 className="font-display text-[26px] leading-none font-bold">
            Every plan includes
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-baseline gap-3 text-[16px]">
                <Lamp tone="good" className="translate-y-[1px]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-[14.5px] text-muted-foreground">
          Secure checkout by Stripe · manage or cancel your plan anytime from
          your account menu
        </p>
      </section>
    </main>
  );
}
