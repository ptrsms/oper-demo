from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


_url = settings.normalized_database_url
_connect_args: dict = {}
# Neon and other hosted Postgres providers require TLS. Local dev to localhost doesn't.
if "localhost" not in _url and "127.0.0.1" not in _url:
    _connect_args["ssl"] = True

# Conservative pool for serverless: each warm instance keeps a tiny pool.
engine = create_async_engine(
    _url,
    echo=False,
    pool_pre_ping=True,
    pool_size=1,
    max_overflow=2,
    connect_args=_connect_args,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
