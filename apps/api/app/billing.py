"""Stripe subscriptions: plan prices, Checkout, the billing portal, the
webhook that mirrors subscription state into Postgres, and the paid-plan gate.

Clerk still owns identity. Each Clerk user maps to one Stripe customer
(`subscriptions` table); the webhook keeps that row in sync with the
customer's newest Stripe subscription.

Docs: https://docs.stripe.com/billing/subscriptions/build-subscriptions
      https://docs.stripe.com/billing/subscriptions/webhooks
      https://docs.stripe.com/customer-management/integrate-customer-portal
"""

import asyncio
import logging
import time
from datetime import UTC, datetime
from typing import Annotated, Literal

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select

from app.auth import AuthState, CurrentUser, _clerk, claim_has_slug, has_comp_access
from app.config import settings
from app.db import SessionDep
from app.models import SubscriptionRow
from app.schemas import (
    BillingPlan,
    BillingStatus,
    CheckoutRequest,
    PlanPrice,
    RedirectResponse,
)

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/billing", tags=["billing"])

# Prices are found by lookup key, not id. To change a price, create a new one
# in the Stripe dashboard and transfer the lookup key to it: new checkouts
# pick it up within PRICE_CACHE_SEC, existing subscribers keep their price.
PLAN_LOOKUP_KEYS: dict[BillingPlan, str] = {
    "monthly": "speakgrade_monthly",
    "yearly": "speakgrade_yearly",
}
PRICE_CACHE_SEC = 300
TRIAL_DAYS = 7

# past_due keeps access while Stripe retries a failed renewal; Stripe moves
# the subscription to canceled/unpaid once its retries run out.
ACTIVE_STATUSES = ("trialing", "active", "past_due")

SYNC_EVENTS = {
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
    "invoice.paid",
    "invoice.payment_failed",
}

_stripe_client = (
    stripe.StripeClient(settings.stripe_secret_key, http_client=stripe.HTTPXClient())
    if settings.stripe_secret_key
    else None
)
_price_cache: tuple[float, dict[BillingPlan, stripe.Price]] | None = None


def _client() -> stripe.StripeClient:
    if _stripe_client is None:
        raise HTTPException(status_code=503, detail="Billing isn't configured.")
    return _stripe_client


def _access_source(
    payload: dict, row: SubscriptionRow | None
) -> Literal["comp", "stripe", "legacy"] | None:
    if has_comp_access(payload):
        return "comp"
    if row is not None and row.status in ACTIVE_STATUSES:
        return "stripe"
    if claim_has_slug(payload.get("pla"), settings.billing_plan_slug):
        return "legacy"
    return None


async def _resolve_access(
    payload: dict, user: str, session: SessionDep
) -> tuple[Literal["comp", "stripe", "legacy"] | None, SubscriptionRow | None]:
    """The user's access source and row. The row is only as fresh as the last
    webhook, so a user who'd be refused is re-checked against Stripe first:
    a late or failing webhook must never hide a live subscription."""

    row = await session.get(SubscriptionRow, user)
    source = _access_source(payload, row)
    if source is None and row is not None:
        try:
            row = await _sync_customer(session, row.stripe_customer_id) or row
        except stripe.StripeError:
            logger.exception("Stripe re-check failed for %s", row.stripe_customer_id)
        source = _access_source(payload, row)
    return source, row


async def require_active_plan(
    state: AuthState, user: CurrentUser, session: SessionDep
) -> None:
    """Reject (402) a user with no comp account, Stripe subscription/trial, or
    legacy Clerk Billing plan."""

    source, _ = await _resolve_access(state.payload or {}, user, session)
    if source is None:
        raise HTTPException(
            status_code=402,
            detail="A subscription is required to analyze speeches.",
        )


# Add `_plan: RequireActivePlan` to a route to require an active plan/trial.
RequireActivePlan = Annotated[None, Depends(require_active_plan)]


async def _plan_prices() -> dict[BillingPlan, stripe.Price]:
    global _price_cache
    if _price_cache and time.monotonic() - _price_cache[0] < PRICE_CACHE_SEC:
        return _price_cache[1]
    result = await _client().v1.prices.list_async(
        params={"lookup_keys": list(PLAN_LOOKUP_KEYS.values()), "active": True}
    )
    by_key = {p.lookup_key: p for p in result.data}
    prices: dict[BillingPlan, stripe.Price] = {
        plan: by_key[key] for plan, key in PLAN_LOOKUP_KEYS.items() if key in by_key
    }
    _price_cache = (time.monotonic(), prices)
    return prices


async def _primary_email(user_id: str) -> str | None:
    user = await _clerk.users.get_async(user_id=user_id)
    for email in user.email_addresses or []:
        if email.id == user.primary_email_address_id:
            return email.email_address
    return None


async def _subscriptions_for_email(
    email: str, exclude: str | None
) -> list[stripe.Subscription]:
    """Every subscription on the other Stripe customers that share this email."""

    client = _client()
    customers = await client.v1.customers.list_async(
        params={"email": email, "limit": 10}
    )
    pages = await asyncio.gather(
        *(
            client.v1.subscriptions.list_async(
                params={"customer": c.id, "status": "all", "limit": 10}
            )
            for c in customers.data
            if c.id != exclude
        )
    )
    return [sub for page in pages for sub in page.data]


@router.get("/prices")
async def prices() -> list[PlanPrice]:
    return [
        PlanPrice(
            plan=plan,
            amount=price.unit_amount,
            currency=price.currency,
            interval=price.recurring.interval,
        )
        for plan, price in (await _plan_prices()).items()
    ]


@router.get("/status")
async def status(
    state: AuthState, user: CurrentUser, session: SessionDep
) -> BillingStatus:
    source, row = await _resolve_access(state.payload or {}, user, session)
    return BillingStatus(
        active=source is not None,
        source=source,
        status=row.status if row else None,
        current_period_end=row.current_period_end if row else None,
        cancel_at=row.cancel_at if row else None,
        can_manage=bool(row and row.stripe_subscription_id),
        trial_available=not (row and row.stripe_subscription_id),
    )


@router.post("/checkout")
async def checkout(
    req: CheckoutRequest, state: AuthState, user: CurrentUser, session: SessionDep
) -> RedirectResponse:
    client = _client()
    source, row = await _resolve_access(state.payload or {}, user, session)
    if source is not None:
        raise HTTPException(status_code=409, detail="You already have an active plan.")
    price = (await _plan_prices()).get(req.plan)
    if price is None:
        raise HTTPException(status_code=503, detail="That plan isn't available right now.")

    # One plan and one trial per email, even across separate logins.
    email = await _primary_email(user)
    other_subs = (
        await _subscriptions_for_email(
            email, exclude=row.stripe_customer_id if row else None
        )
        if email
        else []
    )
    if any(s.status in ACTIVE_STATUSES for s in other_subs):
        raise HTTPException(
            status_code=409,
            detail="This email already has an active plan. Sign in with the account you subscribed with.",
        )

    if row is None:
        customer = await client.v1.customers.create_async(
            params={"email": email, "metadata": {"clerk_user_id": user}},
            # Two checkouts racing for one user share a customer instead of
            # creating two.
            options={"idempotency_key": f"customer-{user}"},
        )
        row = SubscriptionRow(
            clerk_user_id=user,
            stripe_customer_id=customer.id,
            updated_at=datetime.now(UTC),
        )
        session.add(row)
        await session.commit()

    # Only one Checkout may be open per customer, so an old tab can't start a
    # second subscription alongside this one.
    open_sessions = await client.v1.checkout.sessions.list_async(
        params={"customer": row.stripe_customer_id, "status": "open"}
    )
    await asyncio.gather(
        *(client.v1.checkout.sessions.expire_async(s.id) for s in open_sessions.data)
    )

    # One free trial per user and per email: anyone who has had a Stripe
    # subscription pays from day one. The row was just re-read from Stripe,
    # so this holds even when webhooks are failing.
    subscription_data: dict = {"metadata": {"clerk_user_id": user}}
    if row.stripe_subscription_id is None and not other_subs:
        subscription_data["trial_period_days"] = TRIAL_DAYS

    checkout_session = await client.v1.checkout.sessions.create_async(
        params={
            "mode": "subscription",
            "customer": row.stripe_customer_id,
            "client_reference_id": user,
            "line_items": [{"price": price.id, "quantity": 1}],
            "subscription_data": subscription_data,
            "success_url": f"{settings.web_base_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": f"{settings.web_base_url}/pricing",
            "integration_identifier": "speakgrade_pricing_qkvbxtmr",
        }
    )
    return RedirectResponse(url=checkout_session.url)


@router.post("/portal")
async def portal(user: CurrentUser, session: SessionDep) -> RedirectResponse:
    row = await session.get(SubscriptionRow, user)
    if row is None or row.stripe_subscription_id is None:
        raise HTTPException(status_code=404, detail="No subscription to manage.")
    portal_session = await _client().v1.billing_portal.sessions.create_async(
        params={
            "customer": row.stripe_customer_id,
            "return_url": f"{settings.web_base_url}/dashboard",
        }
    )
    return RedirectResponse(url=portal_session.url)


async def _sync_customer(
    session: SessionDep, customer_id: str
) -> SubscriptionRow | None:
    """Copy the customer's live subscription (else their newest) onto their row.

    Re-reading from Stripe instead of trusting the event payload makes this
    safe against retried and out-of-order deliveries."""

    client = _client()
    row = (
        await session.execute(
            select(SubscriptionRow).where(
                SubscriptionRow.stripe_customer_id == customer_id
            )
        )
    ).scalar_one_or_none()
    if row is None:
        customer = await client.v1.customers.retrieve_async(customer_id)
        user_id = getattr(customer.metadata, "clerk_user_id", None)
        if not user_id:
            logger.warning("Stripe customer %s has no clerk_user_id", customer_id)
            return None
        row = SubscriptionRow(
            clerk_user_id=user_id,
            stripe_customer_id=customer_id,
            updated_at=datetime.now(UTC),
        )

    subs = await client.v1.subscriptions.list_async(
        params={"customer": customer_id, "status": "all", "limit": 10}
    )
    live = [s for s in subs.data if s.status in ACTIVE_STATUSES]
    if len(live) > 1:
        logger.error(
            "DUPLICATE SUBSCRIPTIONS: Stripe customer %s has %d live: %s",
            customer_id,
            len(live),
            ", ".join(s.id for s in live),
        )
    sub = live[0] if live else (subs.data[0] if subs.data else None)
    if sub is not None:
        item = sub.items.data[0]
        row.stripe_subscription_id = sub.id
        row.status = sub.status
        row.price_id = item.price.id
        row.current_period_end = datetime.fromtimestamp(item.current_period_end, UTC)
        row.cancel_at = (
            datetime.fromtimestamp(sub.cancel_at, UTC) if sub.cancel_at else None
        )
        logger.info(
            "Stripe sync %s: %s status=%s cancel_at=%s",
            customer_id,
            sub.id,
            sub.status,
            row.cancel_at,
        )
    row.updated_at = datetime.now(UTC)
    session.add(row)
    await session.commit()
    return row


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, session: SessionDep) -> dict[str, bool]:
    """Public route (no Clerk auth): Stripe calls it server-to-server, and the
    signature check on the raw body is what proves the request is genuine."""

    client = _client()
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Billing isn't configured.")
    try:
        event = client.construct_event(
            await request.body(),
            request.headers.get("stripe-signature"),
            settings.stripe_webhook_secret,
        )
    except (ValueError, stripe.SignatureVerificationError) as e:
        logger.error("Rejected Stripe webhook: %s: %s", type(e).__name__, e)
        raise HTTPException(status_code=400, detail="Invalid Stripe signature.")

    if event.type in SYNC_EVENTS:
        customer_id = getattr(event.data.object, "customer", None)
        if customer_id:
            await _sync_customer(session, customer_id)
    return {"received": True}
