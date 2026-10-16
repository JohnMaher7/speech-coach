"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import { fetchBillingStatus, type BillingStatus } from "@/lib/api";
import { ManageBillingButton } from "@/components/manage-billing-button";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function describe(s: BillingStatus): string | null {
  if (s.source === "legacy") return "Manage your plan from the account menu (top right).";
  if (s.source !== "stripe") return null;
  if (s.cancel_at) return `Your plan ends on ${formatDate(s.cancel_at)}.`;
  if (s.status === "past_due") return "Your last payment failed — please update your card.";
  if (!s.current_period_end) return null;
  const when = formatDate(s.current_period_end);
  return s.status === "trialing" ? `Free trial ends on ${when}.` : `Renews on ${when}.`;
}

export function BillingSummary() {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const s = await fetchBillingStatus(token);
      if (!cancelled) setStatus(s);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  if (!status || status.source === "comp") return null;
  const text = status.active ? describe(status) : "You don't have an active plan.";

  return (
    <div className="surface mt-8 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      {text && <p className="text-[14.5px] text-ink-2">{text}</p>}
      <div className="flex gap-3">
        {status.can_manage && <ManageBillingButton className="btn btn-line btn-sm" />}
        {!status.active && (
          <Link href="/pricing" className="btn btn-ink btn-sm">
            See plans
          </Link>
        )}
      </div>
    </div>
  );
}
