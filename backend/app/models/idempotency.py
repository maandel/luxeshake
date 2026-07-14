from datetime import datetime, UTC
from sqlalchemy import String, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    __table_args__ = (
        Index("ix_idempotency_keys_created_at", created_at),
    )
