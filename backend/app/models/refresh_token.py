"""
Refresh token model for secure token rotation with family-based reuse detection.
Each token has a family_id — if a revoked token in a family is presented,
the entire family is invalidated (detects token theft).
"""

import uuid
from datetime import UTC, datetime

from app.database import Base
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column


class RefreshToken(Base):
    """Stores hashed refresh tokens with rotation and family-based invalidation."""

    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # SHA-256 hash of the raw token — never store raw tokens
    token_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    # All tokens in the same rotation chain share a family_id.
    # If a revoked family member is seen, revoke the whole family.
    family_id: Mapped[uuid.UUID] = mapped_column(
        nullable=False, index=True, default=uuid.uuid4
    )
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_refresh_tokens_family_revoked", "family_id", "is_revoked"),
    )
