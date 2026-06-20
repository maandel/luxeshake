import uuid
from datetime import UTC, datetime

from app.database import Base
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id"), index=True, nullable=False
    )
    paystack_reference: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    paystack_transaction_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # in Naira
    status: Mapped[str] = mapped_column(
        Enum("pending", "success", "failed", name="transaction_status"),
        default="pending",
        nullable=False,
    )
    gateway_response: Mapped[str | None] = mapped_column(String(500), nullable=True)
    channel: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(100), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    order: Mapped["Order"] = relationship(back_populates="transactions")
