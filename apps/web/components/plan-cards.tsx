"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check, Loader2 } from "lucide-react";

import {
  createCheckout,
  fetchBillingStatus,
  fetchPlanPrices,
  pingApi,
  type BillingPlan,
  type BillingStatus,
  type PlanPrice,
} from "@/lib/api";
import { Lamp } from "@/components/signal";
import { ManageBillingButton } from "@/components/manage-billing-button";

function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
}

const INCLUDED: string[] = [
  "Unlimited speech analyses",
  "Eight-category evaluator scorecard",
  "Top three actions with drills",
  "Phrasing rewrites, pinned to the second",
  "Pitch, pace and volume timelines",
  "Report history across your devices",
];

async function goToCheckout(plan: BillingPlan, token: string): Promise<void> {
  const { url } = await createCheckout(plan, token);
  window.location.assign(url);
}

export function PlanCards({ initialPrices }: { initialPrices: PlanPrice[] | null }) {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [prices, setPrices] = useState<PlanPrice[] | null>(initialPrices);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [pending, setPending] = useState<BillingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Wake the API now so checkout doesn't pay its cold start. Prices only
  // need fetching here if the server render couldn't get them.
  useEffect(() => {
    if (initialPrices) {
      pingApi();
      return;
    }
    fetchPlanPrices()
      .then(setPrices)
      .catch(() => setError("Couldn't load prices. Please refresh the page."));
  }, [initialPrices]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const s = await fetchBillingStatus(token);
      if (cancelled) return;
      setStatus(s);
      // Back from sign-up with ?plan=…: carry on to checkout without a
      // second click.
      const plan = new URLSearchParams(window.location.search).get("plan");
      if (s.active || (plan !== "monthly" && plan !== "yearly")) return;
      window.history.replaceState(null, "", "/pricing");
      setPending(plan);
      try {
        await goToCheckout(plan, token);
      } catch (err) {
        setPending(null);
        setError(err instanceof Error ? err.message : "Checkout failed.");
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  async function choose(plan: BillingPlan) {
    if (!isSignedIn) {
      const back = encodeURIComponent(`/pricing?plan=${plan}`);
      router.push(`/sign-up?redirect_url=${back}`);
      return;
    }
    setPending(plan);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      await goToCheckout(plan, token);
    } catch (err) {
      setPending(null);
      setError(err instanceof Error ? err.message : "Checkout failed.");
    }
  }

  if (status?.active) {
    return (
      <div className="surface mx-auto flex max-w-[880px] flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2.5 text-[16px] font-medium">
          <Lamp tone="good" />
          You&apos;re on a plan. Every feature is unlocked.
        </p>
        <div className="flex gap-3">
          {status.can_manage && <ManageBillingButton />}
          <Link href="/#upload" className="btn btn-ink">
            Analyze a speech
          </Link>
        </div>
      </div>
    );
  }

  // Returning subscribers are charged at checkout, so don't promise a trial.
  const trial = status?.trial_available ?? true;
  const afterTrial = trial ? " after your 7-day trial" : "";
  const monthly = prices?.find((p) => p.plan === "monthly");
  const yearly = prices?.find((p) => p.plan === "yearly");
  const savePct =
    monthly && yearly
      ? Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100)
      : 0;

  const cards = [
    monthly && {
      price: monthly,
      name: "Monthly",
      blurb: "Flexible. Cancel whenever you like.",
      headline: formatMoney(monthly.amount, monthly.currency),
      cadence: "/ month",
      note: `Billed monthly${afterTrial}`,
      featured: false,
    },
    yearly && {
      price: yearly,
      name: "Yearly",
      blurb: "For a season of talks. Best value.",
      headline: formatMoney(Math.round(yearly.amount / 12), yearly.currency),
      cadence: "/ month",
      note: `${formatMoney(yearly.amount, yearly.currency)} billed yearly${afterTrial}`,
      featured: true,
    },
  ].filter((c) => !!c);

  return (
    <div className="mx-auto max-w-[880px]">
      {prices === null && !error ? (
        <p className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading plans…
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {cards.map(({ price, name, blurb, headline, cadence, note, featured }) => (
            <div
              key={price.plan}
              className={`relative flex flex-col rounded-[24px] border p-7 sm:p-8 ${
                featured
                  ? "border-night bg-night text-white shadow-float"
                  : "border-border bg-card shadow-soft"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[17px] font-semibold tracking-[-0.005em]">{name}</h2>
                {featured && savePct > 0 && (
                  <span className="rounded-full bg-white/12 px-2.5 py-1 text-[12.5px] font-medium text-white ring-1 ring-white/15">
                    Save {savePct}%
                  </span>
                )}
              </div>
              <p className={`mt-1 text-[14px] ${featured ? "text-white/55" : "text-muted-foreground"}`}>
                {blurb}
              </p>
              <p className="mt-8 flex items-baseline gap-1.5">
                <span className="display text-[64px] leading-none tracking-[-0.02em]">
                  {headline}
                </span>
                <span className={`text-[15px] ${featured ? "text-white/55" : "text-muted-foreground"}`}>
                  {cadence}
                </span>
              </p>
              <p className={`mt-2 text-[13.5px] ${featured ? "text-white/55" : "text-muted-foreground"}`}>
                {note}
              </p>
              <button
                type="button"
                onClick={() => choose(price.plan)}
                disabled={!isLoaded || pending !== null}
                className={`btn btn-lg mt-8 w-full ${featured ? "btn-light" : "btn-ink"}`}
              >
                {pending === price.plan && <Loader2 className="size-4 animate-spin" />}
                {trial ? "Start 7-day free trial" : `Subscribe ${name.toLowerCase()}`}
              </button>
              <ul
                className={`mt-8 grid gap-3 border-t pt-7 text-[14.5px] ${
                  featured ? "border-white/10 text-white/80" : "border-border text-ink-2"
                }`}
              >
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      className={`mt-[3px] size-4 shrink-0 ${featured ? "text-go" : "text-go-ink"}`}
                      strokeWidth={2.2}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="alert-stop mt-4 px-4 py-3 text-[14.5px]">
          {error}
        </p>
      )}
    </div>
  );
}
