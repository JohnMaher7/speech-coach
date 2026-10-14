---
name: migrate-to-stripe-billing
description: How SpeakGrade's direct-Stripe billing works (Clerk for auth only; Stripe Checkout, webhook, subscriptions table, billing portal) and how to change it — prices, plans, trial, legacy Clerk Billing subscribers. Use when touching billing, changing prices, or finishing the Clerk Billing → Stripe cutover.
---

# Direct Stripe billing (Clerk = auth only)

The migration off Clerk Billing was implemented 2026-10-14. This skill now
describes the built system. Verified against: stripe-python 16.0.0 (API
`2026-09-30.endive`), Clerk pricing page (Clerk Billing = +0.7%, USD only).

## Where things live

- `apps/api/app/billing.py` — `/billing/prices` (public), `/billing/status`,
  `/billing/checkout`, `/billing/portal`, `/billing/webhooks/stripe` (public,
  signature-verified), and the `RequireActivePlan` gate on `/uploads/sign` + `/analyze`.
- `apps/api/app/models.py` `SubscriptionRow` — one row per Clerk user →
  Stripe customer; created by `create_all` on boot.
- `apps/web/components/plan-cards.tsx` (pricing), `billing-summary.tsx`
  (dashboard), `manage-billing-button.tsx`, `app/billing/success/page.tsx`.

## Rules that are easy to get wrong

- **Access = comp OR Stripe status in (trialing, active, past_due) OR legacy
  Clerk `pla` claim.** Don't drop the legacy path while any Clerk Billing
  subscriber remains, and don't disable Clerk Billing in the Clerk dashboard
  until they've all gone.
- **Prices are found by lookup key** (`speakgrade_monthly`, `speakgrade_yearly`),
  never by id. Price change = new Price in the dashboard + "transfer lookup
  key". Existing subscribers keep their old Price. No deploy needed (5-min cache).
- **Subscription period end lives on the item:** `sub.items.data[0].current_period_end`
  (removed from Subscription in API 2025-03-31.basil).
- **Use `StripeClient` + `*_async` methods** (`stripe[async]`, httpx). Never the
  global `stripe.api_key`. `StripeObject` is not a dict — use attributes/`getattr`.
- **Webhook re-reads the customer's newest subscription from Stripe** instead
  of trusting the payload — order- and retry-safe. Events map by
  `customer` id → `subscriptions.stripe_customer_id`; metadata is a fallback.
- **One trial per user**: no `trial_period_days` once the row has a
  `stripe_subscription_id`.
- **Modal deps drift:** `stripe[async]` must be in both `pyproject.toml` and
  `modal_app.py`. Prod keys live in Modal secret `speech-coach-stripe-prod`
  (deploy fails if it doesn't exist).
- Never pass `payment_method_types` to Checkout; don't enable `automatic_tax`
  without an active Stripe Tax registration.

## Verify (Stripe sandbox)

1. `stripe listen --forward-to localhost:8000/billing/webhooks/stripe` → put
   the `whsec_…` in `.env` as `STRIPE_WEBHOOK_SECRET`.
2. Signed-in user, no plan: `/analyze` → 402; `/pricing` shows two cards.
3. Checkout with `4242 4242 4242 4242` → €0 today → `/billing/success` turns
   "You're all set"; `subscriptions` row is `trialing`.
4. Dashboard → Manage billing → cancel → row gets `cancel_at`; access lasts
   until then.
