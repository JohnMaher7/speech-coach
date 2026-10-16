import type { Metadata } from "next";
import { CalendarX2, Lock, ShieldCheck } from "lucide-react";

import { Lamp } from "@/components/signal";
import { PlanCards } from "@/components/plan-cards";
import { fetchPlanPrices } from "@/lib/api";

export const metadata: Metadata = {
  title: "Pricing — SpeakGrade",
  description:
    "Start a 7-day free trial. Unlimited evaluator-style speech reports. Cancel anytime.",
};

const REASSURANCE = [
  {
    icon: CalendarX2,
    title: "Cancel any time",
    body: "Manage or cancel your plan yourself, straight from your dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    body: "Payments are handled by Stripe. We never see your card details.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Your audio is deleted as soon as your report is ready.",
  },
];

// Prices are baked into the static page and refreshed in the background at
// most every 5 minutes, so the page never waits on a cold API.
export const revalidate = 300;

export default async function PricingPage() {
  const prices = await fetchPlanPrices(revalidate).catch(() => null);

  return (
    <main className="flex-1">
      <section className="wrap pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3.5 pl-2.5 text-[13.5px] font-medium text-ink-2 shadow-soft">
            <Lamp tone="good" />
            7 days free · cancel anytime
          </p>
          <h1 className="display mt-6 text-[clamp(48px,6.4vw,84px)] leading-[0.98] tracking-[-0.02em]">
            Coaching for every talk you give.
          </h1>
          <p className="mt-6 max-w-[50ch] text-[17px] leading-[1.6] text-ink-2">
            One plan, unlimited reports. We ask for a card up front, but
            you&apos;re only charged after the trial, and you can cancel any
            time before then.
          </p>
        </div>

        <div className="mt-14">
          <PlanCards initialPrices={prices} />
        </div>

        <ul className="mx-auto mt-12 grid max-w-[880px] gap-6 border-t border-border pt-10 text-[14px] sm:grid-cols-3">
          {REASSURANCE.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 leading-[1.55] text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
