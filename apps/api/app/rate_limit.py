from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

def rate_limit_key(request: Request) -> str:
    """Key limits on the verified Clerk user id (set by `get_current_user`
    before the handler runs). Behind Modal's proxy `request.client.host` is
    the proxy address, so IP-based keying would lump all users into one
    bucket — the IP is only a fallback for unauthenticated routes.
    """
    user_id = getattr(request.state, "user_id", None)
    return user_id or get_remote_address(request)


# One limiter for the whole app.
limiter = Limiter(key_func=rate_limit_key)


async def rate_limit_handler(_request: Request, _exc: RateLimitExceeded) -> JSONResponse:
    """Return a friendly 429 in the same `{"detail": "..."}` shape as our
    other HTTP errors, so the frontend's existing detail-parsing path
    surfaces a real message instead of `HTTP 429`.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": (
                "You're going too fast — please wait a minute and try again. "
                "This is a free public tool, so usage is rate-limited."
            )
        },
    )
