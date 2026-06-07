---
name: migrate-to-stripe-billing
description: Replace this repo's Clerk Billing integration with Clerk-for-auth-only plus direct Stripe billing (custom Checkout, webhooks, a subscriptions table, billing portal). Use when migrating SpeakGrade off Clerk Billing — e.g. to add weekly or EUR/multi-currency pricing, to drop Clerk's 0.7% billing fee, to control the full subscription lifecycle, or when the user asks to switch to "Stripe-only" billing.
---

# Migrate: Clerk Billing → Clerk auth + direct Stripe

## When this applies / why migrate

Current state: auth is **Clerk**; billing is **Clerk Billing** (USD-only, monthly/annual only, +0.7% on top of Stripe). Migrate to direct Stripe when you need any of:

- **Weekly** plans (Clerk Billing only does monthly/annual), or **EUR / multi-currency** (Clerk Billing is USD-only — a real issue for an Irish/EU audience paying FX fees on USD),
- to drop the 0.7% Clerk fee once volume makes it matter,
- full control of the subscription lifecycle (proration, coupons, custom dunning).

Tradeoff: ~5× more code, and you now own a webhook + a subscriptions table. **Clerk stays — for sign-in only.** The card-required 7-day trial UX is identical (Stripe Checkout handles trial + SCA).

## Read the references before editing

- Backend (deps, config, model, `billing.py`, webhook, gate): [references/backend.md](references/backend.md)
- Frontend (pricing cards, checkout/portal, gate swap): [references/frontend.md](references/frontend.md)

## Teardown — remove the Clerk Billing pieces

- `apps/api/app/auth.py`: delete `_claim_has_slug`, `require_active_plan`, `RequireActivePlan`. **Keep** `get_auth_state` + `get_current_user` (still your auth).
- `apps/api/app/main.py`: remove `RequireActivePlan` from `/uploads/sign` and `/analyze` (the new subscription dep replaces it).
- `apps/api/app/config.py`: drop or repurpose `billing_plan_slug`.
- `apps/web/app/pricing/page.tsx`: remove `<PricingTable/>` (replaced by custom plan cards).
- `apps/web/components/upload-form.tsx`: remove the `useAuth().has({ plan: "pro" })` gate (replaced by a backend status check).
- Clerk dashboard: Billing can be left enabled or disabled — it no longer drives access.

## Build checklist

1. ☐ Backend deps + config + subscriptions model — backend.md §1–3
2. ☐ `billing.py`: checkout + portal + webhook endpoints — backend.md §4
3. ☐ `require_active_subscription` dep on the two paid routes — backend.md §5
4. ☐ Frontend pricing cards + success/cancel pages — frontend.md §1–2
5. ☐ "Manage billing" button + `lib/api.ts` calls — frontend.md §3
6. ☐ Swap the upload gate to a backend status check — frontend.md §4
7. ☐ Stripe dashboard: products/prices (weekly/monthly/yearly, EUR ok), trial, webhook URL
8. ☐ Verify end-to-end in Stripe test mode — backend.md §6

## Project-specific gotchas

- **Modal deps drift:** add `stripe` to BOTH `pyproject.toml` and the hand-maintained pip list in `modal_app.py`, or the API crash-loops on deploy and it masquerades as a browser CORS error. Check `modal app logs` first if so.
- **Webhook route is public:** `/webhooks/stripe` must NOT take `CurrentUser`, and must read the **raw** request body (`await request.body()`) for signature verification.
- **No Alembic yet:** add the subscriptions table via idempotent DDL in `db.py` (mirror the existing `_add_user_id_column()`), unless you choose to set up Alembic as part of this.
- **Async style:** the `stripe` SDK calls are sync — wrap them in `await asyncio.to_thread(...)` to match the codebase's `async def` I/O convention.
- **Card-required trial:** Stripe Checkout `mode="subscription"` + `subscription_data.trial_period_days=7` collects the card by default and charges $0 up front — same behaviour as the current Clerk trial.
