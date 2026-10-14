from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class ReportRow(SQLModel, table=True):
    __tablename__ = "reports"

    report_id: str = Field(primary_key=True)
    audio_key: str = Field(index=True)
    # Clerk user id of the owner. Nullable so pre-auth rows survive; every
    # report created after Stage with accounts always sets it. Indexed
    # because the dashboard query filters on it.
    user_id: str | None = Field(default=None, index=True)
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    duration_sec: float
    payload: dict[str, Any] = Field(sa_column=Column(JSONB, nullable=False))


class SubscriptionRow(SQLModel, table=True):
    __tablename__ = "subscriptions"

    # One row per Clerk user. The Stripe fields mirror the user's newest
    # Stripe subscription and are rewritten by the webhook on every change.
    clerk_user_id: str = Field(primary_key=True)
    stripe_customer_id: str = Field(index=True, unique=True)
    stripe_subscription_id: str | None = None
    status: str | None = None
    price_id: str | None = None
    current_period_end: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    cancel_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class FeedbackRow(SQLModel, table=True):
    __tablename__ = "feedback"

    feedback_id: str = Field(primary_key=True)
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    kind: str
    message: str
    email: str | None = None
    # Clerk user id when the sender was signed in; None for visitors.
    user_id: str | None = None
    page: str | None = None
    user_agent: str | None = None
