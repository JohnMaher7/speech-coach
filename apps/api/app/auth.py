"""Clerk session verification + the Clerk-side access checks.

The browser holds a Clerk session and attaches a short-lived JWT to every
API call as `Authorization: Bearer <token>`. This module turns that header
into a verified Clerk user id (a `user_xxx` string) that route handlers can
depend on. The paid-plan gate itself lives in `billing.py`; it uses the claim
helpers here for comp accounts and legacy Clerk Billing subscribers.

`Clerk.authenticate_request` verifies the token's signature against Clerk's
public keys (JWKS) and checks expiry + the `authorized_parties` allowlist.
The SDK caches the JWKS after the first fetch, so this is effectively a
local check on the hot path. FastAPI caches `get_auth_state` per request, so
`get_current_user` and the billing gate share a single verification.
"""

from typing import Annotated

from clerk_backend_api import AuthenticateRequestOptions, Clerk
from clerk_backend_api.security import RequestState
from fastapi import Depends, HTTPException, Request

from app.config import settings

# One SDK client for the process. It holds the cached JWKS.
_clerk = Clerk(bearer_auth=settings.clerk_secret_key)


async def get_auth_state(request: Request) -> RequestState:
    """Verify the request's Clerk session. Raises 401 if it fails."""

    state = _clerk.authenticate_request(
        request,
        AuthenticateRequestOptions(
            authorized_parties=settings.clerk_authorized_party_list,
        ),
    )
    if not state.is_signed_in or state.payload is None:
        raise HTTPException(status_code=401, detail="Not signed in.")
    return state


AuthState = Annotated[RequestState, Depends(get_auth_state)]


async def get_current_user(request: Request, state: AuthState) -> str:
    """The verified Clerk user id from the session token's `sub` claim."""

    payload = state.payload or {}
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token has no subject.")
    # Stashed on request.state so the rate limiter can key on the verified
    # user instead of the client IP (which is Modal's proxy, not the user).
    request.state.user_id = user_id
    return user_id


# Annotated dependency — route handlers add `user: CurrentUser` to require auth.
CurrentUser = Annotated[str, Depends(get_current_user)]


def claim_has_slug(claim: str | None, slug: str) -> bool:
    """Whether `slug` is present in a Clerk `pla`/`fea` claim.

    Clerk encodes plans/features as a comma-separated string of `scope:slug`
    entries — `u:` user, `o:` org, `ou:`/`uo:` both — e.g. `"u:pro"`. This
    mirrors Clerk's own `has({ plan })` so the backend and frontend agree. A
    trialing user still carries the plan claim, so this covers trial + paid.
    """

    if not claim:
        return False
    for entry in claim.split(","):
        scope, sep, value = entry.strip().partition(":")
        if sep and scope in ("u", "o", "ou", "uo") and value == slug:
            return True
    return False


def has_comp_access(payload: dict) -> bool:
    """Whether the user is allowlisted for free access via Clerk public metadata.

    Set `{"compAccess": true}` on a user's public metadata in the Clerk
    dashboard to comp them. For this to be visible here, the session token must
    expose public metadata as a `metadata` claim (Clerk dashboard → Sessions →
    customize session token: `{"metadata": "{{user.public_metadata}}"}`).
    """

    meta = payload.get("metadata") or {}
    value = meta.get("compAccess")
    return value is True or (
        isinstance(value, str) and value.strip().lower() in ("true", "1", "yes")
    )
