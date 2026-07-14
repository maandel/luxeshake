"""
Audit logging helper.
Writes structured audit records to the database for security-sensitive events.
The audit_logs table should only allow INSERT (no UPDATE/DELETE) for the app user.

Usage:
    await audit(db, "LOGIN", user_id=user.id, ip_address=request.client.host)
    await audit(db, "ROLE_CHANGE", user_id=admin.id, resource="user",
                resource_id=str(target_user.id), metadata={"old_role": "staff", "new_role": "manager"})
"""

import uuid
from typing import Any

from app.models.audit_log import AuditLog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger

logger = get_logger(__name__)

# Action constants — use these to avoid typos
LOGIN = "LOGIN"
LOGIN_FAILED = "LOGIN_FAILED"
LOGOUT = "LOGOUT"
REGISTER = "REGISTER"
EMAIL_VERIFIED = "EMAIL_VERIFIED"
PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED"
PASSWORD_RESET_COMPLETE = "PASSWORD_RESET_COMPLETE"
PASSWORD_CHANGED = "PASSWORD_CHANGED"
ROLE_CHANGED = "ROLE_CHANGED"
USER_DEACTIVATED = "USER_DEACTIVATED"
USER_DELETED = "USER_DELETED"
USER_CREATED_BY_ADMIN = "USER_CREATED_BY_ADMIN"
PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
PAYMENT_FAILED = "PAYMENT_FAILED"
PAYMENT_WEBHOOK = "PAYMENT_WEBHOOK"
ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED"
DATA_EXPORT = "DATA_EXPORT"
REFRESH_TOKEN_REUSE = "REFRESH_TOKEN_REUSE"
GOOGLE_AUTH = "GOOGLE_AUTH"


async def audit(
    db: AsyncSession,
    action: str,
    *,
    user_id: uuid.UUID | None = None,
    resource: str | None = None,
    resource_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Write an audit log entry to the database. Silently fails on error."""
    try:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            event_metadata=metadata,
        )
        db.add(entry)
        await db.flush()  # Write to DB within current transaction without committing
    except Exception as exc:
        # Audit failures must NEVER break the main flow
        logger.error("audit_log_failed", action=action, error=str(exc))
