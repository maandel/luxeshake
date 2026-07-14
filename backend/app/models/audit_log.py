"""
Audit log model — append-only log of security-sensitive events.
Tracks: logins, password resets, role changes, payment events, admin actions.
"""

import uuid
from datetime import UTC, datetime

from app.database import Base
from sqlalchemy import DateTime, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column


class AuditLog(Base):
    """Immutable audit trail. App DB user must NOT have UPDATE/DELETE on this table."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # user_id may be None for unauthenticated events (e.g., failed login attempts)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # e.g. LOGIN, LOGOUT, PASSWORD_RESET, ROLE_CHANGE, PAYMENT_SUCCESS
    resource: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # e.g. "order", "user"
    resource_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )  # e.g. the order UUID
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Additional context as JSON — never store PII (no passwords, tokens, full emails)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        index=True,
    )

    __table_args__ = (Index("ix_audit_logs_action_created", "action", "created_at"),)
