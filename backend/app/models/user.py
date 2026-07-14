import uuid
from datetime import UTC, datetime

from app.database import Base
from sqlalchemy import Boolean, DateTime, Enum, Index, String
from sqlalchemy.orm import Mapped, mapped_column


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    role: Mapped[str] = mapped_column(
        Enum("superadmin", "manager", "staff", "customer", name="user_role"),
        default="customer",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    # Indexed for fast lookup during email verification flow
    email_verification_token: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    # Stores SHA-256 hex digest of OTP (not plaintext)
    password_reset_otp: Mapped[str | None] = mapped_column(
        String(64),  # SHA-256 hex = 64 chars
        nullable=True,
        index=True,
    )
    password_reset_otp_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    must_reset_password: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
    # Soft delete — preserves referential integrity for orders/transactions
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Composite index for soft-delete queries
    __table_args__ = (Index("ix_users_active_email", "email", "deleted_at"),)
