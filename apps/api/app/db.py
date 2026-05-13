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


async def get_session() -> AsyncIterator[AsyncSession]:
    async with _session_factory() as session:
        yield session
