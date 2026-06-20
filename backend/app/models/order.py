import uuid
from datetime import UTC, datetime

from app.database import Base
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    customer_first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_note: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    fulfillment_type: Mapped[str] = mapped_column(
        Enum("delivery", "pickup", name="fulfillment_type"), nullable=False
    )
    delivery_area_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("delivery_areas.id"), nullable=True
    )
    delivery_area_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    delivery_fee: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    subtotal: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "confirmed",
            "processing",
            "out_for_delivery",
            "delivered",
            "cancelled",
            name="order_status",
        ),
        default="pending",
        nullable=False,
    )
    payment_status: Mapped[str] = mapped_column(
        Enum("unpaid", "paid", "failed", "refunded", name="payment_status"),
        default="unpaid",
        nullable=False,
    )

    paystack_reference: Mapped[str | None] = mapped_column(
        String(255), index=True, nullable=True
    )
    driver_phone: Mapped[str | None] = mapped_column(
        String(50), nullable=True
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

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("products.id"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_category: Mapped[str] = mapped_column(String(100), nullable=False)
    size: Mapped[str] = mapped_column(
        Enum("small", "big", name="drink_size"), nullable=False
    )
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
