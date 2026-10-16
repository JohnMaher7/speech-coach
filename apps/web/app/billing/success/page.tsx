"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { fetchBillingStatus } from "@/lib/api";
import { Lamp } from "@/components/signal";

const POLL_MS = 1500;
const MAX_POLLS = 8;

export default function BillingSuccessPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<"waiting" | "active" | "slow">("waiting");

  // Stripe's webhook activates the plan; it usually lands within a second or
  // two of the redirect, so poll briefly rather than trust the redirect.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < MAX_POLLS && !cancelled; i++) {
        const token = await getToken();
        if (token) {
          const s = await fetchBillingStatus(token).catch(() => null);
          if (s?.active) {
            if (!cancelled) setState("active");
            return;
          }
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      if (!cancelled) setState("slow");
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return (
    <main className="flex-1">
      <section className="mx-auto flex w-full max-w-[640px] flex-col items-center px-5 pt-20 pb-28 text-center sm:pt-28">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3.5 pl-2.5 text-[13.5px] font-medium text-ink-2 shadow-soft">
          {state === "waiting" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Lamp tone={state === "active" ? "good" : "mid"} />
          )}
          {state === "waiting" ? "Activating your plan…" : "Checkout complete"}
        </p>
        <h1 className="display mt-6 text-[clamp(48px,6.4vw,80px)] leading-[0.98] tracking-[-0.02em]">
          {state === "slow" ? "Almost there" : "You're all set"}
        </h1>
        <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.6] text-ink-2">
          {state === "slow"
            ? "Your payment went through, but activation is taking a moment. Refresh in a minute — if it still isn't active, get in touch."
            : "Upload a speech and get your first evaluator-style report."}
        </p>
        <div className="mt-9 flex gap-3">
          <Link href="/#upload" className="btn btn-ink">
            Analyze a speech
          </Link>
          <Link href="/dashboard" className="btn btn-line">
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
