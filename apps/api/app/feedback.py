"""Email new feedback to the owner through Resend.

https://resend.com/docs/api-reference/emails/send-email
"""

import logging

import httpx

from app.config import settings
from app.models import FeedbackRow

logger = logging.getLogger("uvicorn.error")

KIND_LABELS = {
    "feedback": "Feedback",
    "bug": "Bug report",
    "support": "Help request",
}


def _subject(row: FeedbackRow) -> str:
    first_line = row.message.strip().splitlines()[0]
    if len(first_line) > 60:
        first_line = first_line[:57].rstrip() + "…"
    return f"[SpeakGrade] {KIND_LABELS.get(row.kind, row.kind)}: {first_line}"


def _body(row: FeedbackRow) -> str:
    details = [
        f"Type: {KIND_LABELS.get(row.kind, row.kind)}",
        f"Email: {row.email or 'not given'}",
        f"User: {row.user_id or 'signed out'}",
        f"Page: {row.page or 'unknown'}",
        f"Browser: {row.user_agent or 'unknown'}",
        f"Sent: {row.created_at:%Y-%m-%d %H:%M} UTC",
        f"Feedback id: {row.feedback_id}",
    ]
    return f"{row.message.strip()}\n\n---\n" + "\n".join(details)


async def email_feedback(row: FeedbackRow) -> None:
    if not (settings.resend_api_key and settings.feedback_to_email):
        return
    payload: dict[str, object] = {
        "from": settings.feedback_from_email,
        "to": [settings.feedback_to_email],
        "subject": _subject(row),
        "text": _body(row),
    }
    if row.email:
        payload["reply_to"] = row.email
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json=payload,
            )
            res.raise_for_status()
    except httpx.HTTPError:
        logger.exception("feedback email failed; row %s is still saved", row.feedback_id)
