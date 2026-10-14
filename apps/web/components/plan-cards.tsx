"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2.5 text-[17px]">
          <Lamp tone="good" />
          You&apos;re on a plan — every feature is unlocked.
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
      cadence: "/month",
      note: "Billed monthly",
      featured: false,
    },
    yearly && {
      price: yearly,
      name: "Yearly",
      cadence: "/year",
      note: `${formatMoney(Math.round(yearly.amount / 12), yearly.currency)}/month, billed yearly`,
      featured: true,
    },
  ].filter((c) => !!c);

  return (
    <div>
      {prices === null && !error ? (
        <p className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading plans…
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map(({ price, name, cadence, note, featured }) => (
            <div
              key={price.plan}
              className={`flex flex-col border-[1.5px] p-5 ${
                featured ? "border-foreground bg-muted" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[26px] leading-none font-bold">
                  {name}
                </h2>
                {featured && savePct > 0 && (
                  <span className="inline-flex items-center gap-2 text-[14.5px] font-medium text-go-ink">
                    <Lamp tone="good" />
                    Save {savePct}%
                  </span>
                )}
              </div>
              <p className="mt-4 font-display text-[44px] leading-none font-bold">
                {formatMoney(price.amount, price.currency)}
                <span className="text-[20px] font-semibold text-muted-foreground">
                  {cadence}
                </span>
              </p>
              <p className="mt-2 text-[15px] text-muted-foreground">{note}</p>
              <button
                type="button"
                onClick={() => choose(price.plan)}
                disabled={!isLoaded || pending !== null}
                className={`btn mt-6 ${featured ? "btn-ink" : "btn-line"}`}
              >
                {pending === price.plan && <Loader2 className="size-4 animate-spin" />}
                Start 7-day free trial
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 border-l-[3px] border-stop bg-stop/10 px-4 py-3 text-[15.5px] text-stop-ink"
        >
          {error}
        </p>
      )}
    </div>
  );
}
