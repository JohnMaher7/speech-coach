# Backend migration — direct Stripe

All paths are under `apps/api/`. The `stripe` Python SDK calls are synchronous;
wrap them in `await asyncio.to_thread(...)` to keep handlers `async`.

Stripe docs to follow (don't paraphrase from memory):
- Checkout + trials: https://docs.stripe.com/payments/checkout/free-trials
- Customer portal: https://docs.stripe.com/customer-management/integrate-customer-portal
- Verify webhook signatures: https://docs.stripe.com/webhooks#verify-events

## §1 Dependencies

Add `stripe` to **both** files (the Modal list is hand-maintained and drifts):
- `pyproject.toml` → `dependencies` array: `"stripe>=11.0.0"`
- `modal_app.py` → the `.uv_pip_install(...)` list: `"stripe>=11.0.0"`

Then `cd apps/api && uv sync`.

## §2 Config + env

`app/config.py` — add to `Settings`:
```python
stripe_secret_key: str
stripe_webhook_secret: str
stripe_price_weekly: str
stripe_price_monthly: str
stripe_price_yearly: str
# Where Stripe sends the user back after hosted checkout / portal:
billing_success_url: str = "http://localhost:3000/billing/success"
billing_cancel_url: str = "http://localhost:3000/pricing"
```
Add the same keys (names only) to `.env.example`, and real values to `.env`.
Create the prices in the Stripe dashboard (you can now use **EUR** and a
**weekly** interval) and paste the `price_…` ids here.

## §3 Subscriptions table

`app/models.py` — new table keyed by the Clerk user id (Clerk still owns identity):
```python
class SubscriptionRow(SQLModel, table=True):
    __tablename__ = "subscriptions"

    clerk_user_id: str = Field(primary_key=True)
    stripe_customer_id: str = Field(index=True)
    stripe_subscription_id: str | None = Field(default=None, index=True)
    status: str = Field(default="incomplete")  # trialing|active|past_due|canceled|...
    price_id: str | None = None
    current_period_end: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    cancel_at_period_end: bool = False
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
```
`app/db.py` — `SQLModel.metadata.create_all` creates the new table on boot
(it's CREATE-only, so the existing `reports` table is untouched). No extra DDL
needed unless you later add columns — then mirror `_add_user_id_column()`.

## §4 `app/billing.py` — checkout, portal, webhook

Reuse the Clerk client to fetch the user's email:
`from app.auth import _clerk` (or instantiate a new `Clerk`).

```python
import asyncio, stripe
from fastapi import APIRouter, Request, HTTPException
from app.config import settings
from app.auth import CurrentUser, _clerk
from app.db import SessionDep
from app.models import SubscriptionRow

stripe.api_key = settings.stripe_secret_key
router = APIRouter(prefix="/billing", tags=["billing"])

PRICES = {
    "weekly": settings.stripe_price_weekly,
    "monthly": settings.stripe_price_monthly,
    "yearly": settings.stripe_price_yearly,
}

async def _get_or_create_customer(user_id: str, session) -> str:
    row = await session.get(SubscriptionRow, user_id)
    if row:
        return row.stripe_customer_id
    clerk_user = await asyncio.to_thread(_clerk.users.get, user_id=user_id)
    email = clerk_user.email_addresses[0].email_address if clerk_user.email_addresses else None
    customer = await asyncio.to_thread(
        stripe.Customer.create, email=email, metadata={"clerk_user_id": user_id}
    )
    return customer.id

@router.post("/checkout")
async def checkout(req: CheckoutRequest, user: CurrentUser, session: SessionDep):
    price_id = PRICES.get(req.plan)
    if not price_id:
        raise HTTPException(400, "Unknown plan.")
    customer_id = await _get_or_create_customer(user, session)
    s = await asyncio.to_thread(
        stripe.checkout.Session.create,
        mode="subscription",
        customer=customer_id,
        client_reference_id=user,
        line_items=[{"price": price_id, "quantity": 1}],
        subscription_data={"trial_period_days": 7},  # card collected, $0 now
        success_url=settings.billing_success_url,
        cancel_url=settings.billing_cancel_url,
    )
    return {"url": s.url}

@router.post("/portal")
async def portal(user: CurrentUser, session: SessionDep):
    row = await session.get(SubscriptionRow, user)
    if not row:
        raise HTTPException(404, "No subscription.")
    s = await asyncio.to_thread(
        stripe.billing_portal.Session.create,
        customer=row.stripe_customer_id,
        return_url=settings.billing_success_url,
    )
    return {"url": s.url}

@router.get("/status")
async def status(user: CurrentUser, session: SessionDep):
    row = await session.get(SubscriptionRow, user)
    active = bool(row and row.status in ("trialing", "active"))
    return {"active": active, "status": row.status if row else None}
```

### Webhook (public — no `CurrentUser`, raw body)
```python
@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, session: SessionDep):
    payload = await request.body()                      # RAW bytes — required
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig, settings.stripe_webhook_secret
        )
    except Exception:
        raise HTTPException(400, "Bad signature.")

    t = event["type"]
    obj = event["data"]["object"]
    if t in ("customer.subscription.created", "customer.subscription.updated",
             "customer.subscription.deleted"):
        user_id = (obj.get("metadata") or {}).get("clerk_user_id")
        # fall back to the customer's metadata if the sub has none:
        if not user_id:
            cust = await asyncio.to_thread(stripe.Customer.retrieve, obj["customer"])
            user_id = (cust.get("metadata") or {}).get("clerk_user_id")
        if user_id:
            await _upsert_subscription(session, user_id, obj)
    return {"received": True}
```
`_upsert_subscription` writes `status`, `stripe_subscription_id`, `price_id`,
`current_period_end` (`datetime.fromtimestamp(obj["current_period_end"], UTC)`),
and `cancel_at_period_end`. **Be idempotent** — Stripe retries; upsert by
`clerk_user_id`. Tip: set `metadata.clerk_user_id` in `subscription_data` on the
checkout session so subscription events carry it directly.

Register the router in `main.py`: `app.include_router(billing.router)`.
**Do not** put the webhook behind auth, and make sure the path is reachable
server-to-server (CORS doesn't apply to Stripe's POST, but the route must not
require a Bearer token).

## §5 Replace the gate

`app/billing.py` (or `auth.py`) — DB-backed gate to swap in for the old
`RequireActivePlan`:
```python
async def require_active_subscription(user: CurrentUser, session: SessionDep) -> None:
    row = await session.get(SubscriptionRow, user)
    if not row or row.status not in ("trialing", "active"):
        raise HTTPException(402, "A subscription is required to analyze speeches.")

RequireActiveSubscription = Annotated[None, Depends(require_active_subscription)]
```
`main.py` — on `/uploads/sign` and `/analyze`, replace `_plan: RequireActivePlan`
with `_sub: RequireActiveSubscription`.

## §6 Verify (Stripe test mode)

1. `stripe listen --forward-to localhost:8000/billing/webhooks/stripe` (gives a
   `whsec_…` for `stripe_webhook_secret` in dev).
2. As a signed-in user with no sub, `/analyze` → **402**.
3. Hit a plan's checkout, pay with `4242 4242 4242 4242` → `$0` due, returns to
   success url. Webhook fires → `subscriptions` row appears as `trialing`.
4. `/analyze` now succeeds. Stripe shows the sub `trialing`, period end ≈ 7 days.
5. Open `/billing/portal`, cancel → webhook flips `cancel_at_period_end`/`canceled`;
   `/analyze` returns 402 again after the period ends.
