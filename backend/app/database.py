import re
from collections.abc import AsyncGenerator

from app.config import settings
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

db_url = settings.DATABASE_URL
connect_args = {}

if "sslmode=" in db_url:
    db_url = re.sub(r"[?&]sslmode=[^&]+", "", db_url)
    db_url = db_url.rstrip("?").rstrip("&")
    connect_args["ssl"] = "require"

engine = create_async_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
