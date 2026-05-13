from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class ReportRow(SQLModel, table=True):
    __tablename__ = "reports"

    report_id: str = Field(primary_key=True)
    audio_key: str = Field(index=True)
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    duration_sec: float
    payload: dict[str, Any] = Field(sa_column=Column(JSONB, nullable=False))
