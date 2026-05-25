"""Clerk session verification.

The browser holds a Clerk session and attaches a short-lived JWT to every
API call as `Authorization: Bearer <token>`. This module turns that header
into a verified Clerk user id (a `user_xxx` string) that route handlers can
depend on.

`Clerk.authenticate_request` verifies the token's signature against Clerk's
public keys (JWKS) and checks expiry + the `authorized_parties` allowlist.
The SDK caches the JWKS after the first fetch, so this is effectively a
local check on the hot path.
"""

from typing import Annotated

from clerk_backend_api import AuthenticateRequestOptions, Clerk
from fastapi import Depends, HTTPException, Request

from app.config import settings

# One SDK client for the process. It holds the cached JWKS.
_clerk = Clerk(bearer_auth=settings.clerk_secret_key)


async def get_current_user(request: Request) -> str:
    """Verify the request's Clerk session and return the user id.

    Raises 401 if the token is missing, expired, or fails verification.
    """

    state = _clerk.authenticate_request(
        request,
        AuthenticateRequestOptions(
            authorized_parties=settings.clerk_authorized_party_list,
        ),
    )
    if not state.is_signed_in or state.payload is None:
        raise HTTPException(status_code=401, detail="Not signed in.")

    user_id = state.payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token has no subject.")
    return user_id


# Annotated dependency — route handlers add `user: CurrentUser` to require auth.
CurrentUser = Annotated[str, Depends(get_current_user)]
