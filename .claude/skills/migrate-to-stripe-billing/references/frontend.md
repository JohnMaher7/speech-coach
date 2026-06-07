# Frontend migration — direct Stripe

All paths under `apps/web/`. The app calls the FastAPI backend directly through
`lib/api.ts` (`API_URL = process.env.NEXT_PUBLIC_API_URL`, Bearer token from
Clerk). Mirror that for every new call. Clerk stays for sign-in only.

> This repo runs a newer Next.js than training data — read
> `node_modules/next/dist/docs/` before writing route/handler code (see
> `apps/web/AGENTS.md`).

## §1 `lib/api.ts` — add three calls

```ts
export async function createCheckout(
  plan: "weekly" | "monthly" | "yearly",
  token: string,
): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/billing/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) throw new Error(`Checkout failed (${res.status}).`);
  return res.json();
}

export async function createPortalSession(token: string): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/billing/portal`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Portal failed (${res.status}).`);
  return res.json();
}

export async function fetchBillingStatus(
  token: string,
): Promise<{ active: boolean; status: string | null }> {
  const res = await fetch(`${API_URL}/billing/status`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  if (!res.ok) return { active: false, status: null };
  return res.json();
}
```

## §2 Pricing page — custom cards (replaces `<PricingTable/>`)

`app/pricing/page.tsx` becomes a client component (it needs `getToken` + a click
handler). Keep the existing heading/section styling; swap the Clerk component for
your own three cards. Now you can show **weekly/monthly/yearly** and price in
**EUR** (Stripe supports it; Clerk Billing didn't).

```tsx
"use client";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createCheckout } from "@/lib/api";

const PLANS = [
  { id: "weekly",  name: "Weekly",  price: "€6.99", cadence: "/week" },
  { id: "monthly", name: "Monthly", price: "€15",   cadence: "/month", featured: true },
  { id: "yearly",  name: "Yearly",  price: "€99",   cadence: "/year" },
] as const;

// On click: const { url } = await createCheckout(plan.id, await getToken());
//           window.location.href = url;
```
Render `PLANS.map(...)` with the existing `Card`/`Button` components and oklch
tokens. Each CTA: "Start 7-day free trial". Add the trial/cancel/card copy and
"Secure checkout by Stripe" line that the current page already has.

## §3 Success / cancel pages + Manage billing

- `app/billing/success/page.tsx` — "You're all set" confirmation, link to
  `/#upload` or `/dashboard`. (`billing_success_url` in the backend points here.)
- Cancel returns to `/pricing` (already the `billing_cancel_url`), so no new page
  needed unless you want a dedicated one.
- **Manage billing** button (cancel / change card / switch plan) on
  `app/dashboard/page.tsx` or in the user menu: on click,
  `const { url } = await createPortalSession(token); window.location.href = url;`.
  This replaces Clerk's built-in billing tab, which no longer exists once you
  leave Clerk Billing.

## §4 Swap the upload gate

`components/upload-form.tsx` currently gates on `useAuth().has({ plan: "pro" })`.
Replace with a backend status check (the `pla` claim is gone):

```tsx
const { isSignedIn, getToken } = useAuth();        // drop `has`
const [isSubscribed, setIsSubscribed] = useState(false);

useEffect(() => {
  if (!isSignedIn) return;
  let cancelled = false;
  (async () => {
    const token = await getToken();
    if (!token) return;
    const { active } = await fetchBillingStatus(token);
    if (!cancelled) setIsSubscribed(active);
  })().catch(() => {});
  return () => { cancelled = true; };
}, [isSignedIn, getToken]);
```
Keep the rest of `handleAnalyze` (the `if (!isSubscribed) router.push("/pricing")`
guard) and the `buttonLabel` logic unchanged — they already read `isSubscribed`.
The backend 402 on `/analyze` and `/uploads/sign` remains the real enforcement;
this check is just the friendly redirect.

## Notes
- Right after checkout the success page loads before the webhook may have written
  the row — `fetchBillingStatus` can briefly return `active:false`. Either poll
  once on the success page, or trust the next dashboard/upload load. The backend
  402 guarantees no unpaid analysis regardless.
- Don't gate `/reports*` — viewing existing reports should stay free, same as the
  current Clerk-Billing setup.
