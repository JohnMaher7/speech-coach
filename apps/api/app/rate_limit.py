from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# One limiter for the whole app. `get_remote_address` keys by client IP
# (request.client.host). Modal forwards the real client IP, so this works
# behind their edge without extra config.
limiter = Limiter(key_func=get_remote_address)


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
