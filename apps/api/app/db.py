from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.config import settings

_engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={"statement_cache_size": 0, "ssl": "require"},
)

_session_factory = async_sessionmaker(
    _engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db() -> None:
    import app.models  # noqa: F401  registers ReportRow on SQLModel.metadata

    async with _engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    await _add_user_id_column()


async def _add_user_id_column() -> None:
    """Add `reports.user_id` to a table that predates accounts.

    `SQLModel.metadata.create_all` only ever CREATEs missing tables — it
    never ALTERs an existing one. So a new column on an existing table needs
    an explicit DDL statement. `IF NOT EXISTS` makes this a harmless no-op on
    every boot after the first. (When there are real users, replace this with
    Alembic migrations.)"""

    from sqlalchemy import text

    async with _engine.begin() as conn:
        await conn.execute(
            text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id VARCHAR")
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_reports_user_id "
                "ON reports (user_id)"
            )
        )


async def wipe_reports() -> int:
    """Truncate the `reports` table. Stage 29 bumped the report schema to v2
    with no compat shim; this is the one-shot run on deploy to drop all v1
    rows. Returns the number of rows that were deleted."""

    import app.models  # noqa: F401  registers ReportRow on SQLModel.metadata
    from sqlalchemy import text

    async with _engine.begin() as conn:
        result = await conn.execute(text("DELETE FROM reports"))
        return result.rowcount or 0


async def get_session() -> AsyncIterator[AsyncSession]:
    async with _session_factory() as session:
        yield session
