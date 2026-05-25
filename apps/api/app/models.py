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
