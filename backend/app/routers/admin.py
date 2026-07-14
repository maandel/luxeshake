import csv
import io
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

from app.core.audit import (
    DATA_EXPORT,
    ROLE_CHANGED,
    USER_CREATED_BY_ADMIN,
    USER_DEACTIVATED,
    USER_DELETED,
    audit,
)
from app.core.logging import get_logger
from app.database import get_db
from app.dependencies.auth_deps import (
    require_manager_or_above,
    require_superadmin,
)
from app.models.audit_log import AuditLog
from app.models.order import Order
from app.models.store_settings import StoreSettings
from app.models.user import User
from app.schemas.audit import AuditLogResponse
from app.schemas.order import StoreSettingsResponse, StoreSettingsUpdate
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.cache import cache_get, cache_invalidate, cache_set
from app.services.email_service import EmailService
from app.utils.security import get_password_hash
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = get_logger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin Management"])


@router.get("/audit-logs", response_model=dict[str, Any])
async def list_audit_logs(
    superadmin: Annotated[User, Depends(require_superadmin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    action: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    query = select(AuditLog).order_by(AuditLog.created_at.desc())

    if action:
        query = query.where(AuditLog.action == action)

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_res.scalar() or 0

    result = await db.execute(query.offset(offset).limit(page_size))
    logs = result.scalars().all()

    return {
        "items": [AuditLogResponse.model_validate(log) for log in logs],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    superadmin: Annotated[User, Depends(require_superadmin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)  # noqa: E501
    )
    return result.scalars().all()


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_admin_user(
    request: Request,
    user_in: UserCreate,
    superadmin: Annotated[User, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=get_password_hash(user_in.password),
        role="staff",
        is_email_verified=True,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()
    await audit(
        db,
        USER_CREATED_BY_ADMIN,
        user_id=superadmin.id,
        resource="user",
        resource_id=str(new_user.id),
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/users/{id}", response_model=UserResponse)
async def get_user_detail(
    id: uuid.UUID,
    superadmin: Annotated[User, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{id}", response_model=UserResponse)
async def update_user_detail(
    id: uuid.UUID,
    user_in: UserUpdate,
    superadmin: Annotated[User, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.email is not None:
        user.email = user_in.email

    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{id}/role", response_model=UserResponse)
async def change_user_role(
    id: uuid.UUID,
    role: str,
    request: Request,
    superadmin: Annotated[User, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db),
):
    if role not in ["superadmin", "manager", "staff", "customer"]:
        raise HTTPException(status_code=400, detail="Invalid role value")

    result = await db.execute(select(User).where(User.id == id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.role
    user.role = role
    await audit(
        db,
        ROLE_CHANGED,
        user_id=superadmin.id,
        resource="user",
        resource_id=str(id),
        ip_address=request.client.host if request.client else None,
        metadata={"old_role": old_role, "new_role": role},
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{id}/deactivate", response_model=UserResponse)
async def toggle_user_activation(
    id: uuid.UUID,
    request: Request,
    superadmin: Annotated[User, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == superadmin.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate yourself",
        )

    user.is_active = not user.is_active
    await audit(
        db,
        USER_DEACTIVATED,
        user_id=superadmin.id,
        resource="user",
        resource_id=str(id),
        ip_address=request.client.host if request.client else None,
        metadata={"is_active": user.is_active},
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{id}")
async def delete_user(
    id: uuid.UUID,
    request: Request,
    superadmin: Annotated[User, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == superadmin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # Soft delete — preserves referential integrity for orders and transactions
    user.deleted_at = datetime.now(UTC)
    user.is_active = False
    await audit(
        db,
        USER_DELETED,
        user_id=superadmin.id,
        resource="user",
        resource_id=str(id),
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
    return {"detail": "User soft-deleted successfully"}


@router.post("/users/{id}/reset-password")
async def reset_user_password(
    id: uuid.UUID,
    superadmin: Annotated[User, Depends(require_superadmin)],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == superadmin.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot reset your own password. Use the Change Password page.",  # noqa: E501
        )

    import secrets
    import string

    alphabet = string.ascii_letters + string.digits
    temp_password = "".join(secrets.choice(alphabet) for _ in range(12))

    user.password_hash = get_password_hash(temp_password)
    user.must_reset_password = True
    await db.commit()

    background_tasks.add_task(
        EmailService.send_admin_password_reset,
        email=user.email,
        temp_password=temp_password,
    )

    return {
        "detail": "Password reset successfully. Email sent to user with credentials."  # noqa: E501
    }


@router.get("/analytics/summary")
async def get_analytics_summary(
    manager: Annotated[User, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    cached = await cache_get("analytics:summary")
    if cached is not None:
        return cached

    today_start = datetime.now(UTC).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    rev_res = await db.execute(
        select(func.sum(Order.total)).where(
            and_(
                Order.payment_status == "paid",
                Order.created_at >= today_start,
            )
        )
    )
    today_revenue = rev_res.scalar() or 0

    ord_res = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= today_start)
    )
    today_orders = ord_res.scalar() or 0

    pending_res = await db.execute(
        select(func.count(Order.id)).where(Order.status == "pending")
    )
    pending_orders = pending_res.scalar() or 0

    paid_res = await db.execute(
        select(func.count(Order.id)).where(Order.payment_status == "paid")
    )
    paid_orders = paid_res.scalar() or 0

    recent_ord_res = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(10)
    )
    recent_orders = recent_ord_res.scalars().all()

    result = {
        "today_revenue": today_revenue,
        "today_orders": today_orders,
        "pending_orders": pending_orders,
        "paid_orders": paid_orders,
        "recent_orders": recent_orders,
    }
    await cache_set("analytics:summary", result, ttl_seconds=30)
    return result


@router.get("/analytics/revenue")
async def get_revenue_chart(
    manager: Annotated[User, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    cached = await cache_get("analytics:revenue")
    if cached is not None:
        return cached

    now = datetime.now(UTC)
    window_start = (now - timedelta(days=6)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    from sqlalchemy import Date as SADate
    from sqlalchemy import cast, text

    rows = await db.execute(
        select(
            cast(Order.created_at, SADate).label("day"),
            func.coalesce(func.sum(Order.total), 0).label("revenue"),
        )
        .where(
            and_(
                Order.payment_status == "paid",
                Order.created_at >= window_start,
            )
        )
        .group_by(text("day"))
        .order_by(text("day"))
    )
    row_map = {str(r.day): float(r.revenue) for r in rows}
    daily_revenue = []
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_str = day_date.strftime("%Y-%m-%d")
        daily_revenue.append(
            {
                "date": day_str,
                "revenue": row_map.get(day_str, 0),
            }
        )

    await cache_set("analytics:revenue", daily_revenue, ttl_seconds=60)
    return daily_revenue


@router.get("/analytics/export")
async def export_orders_csv(
    request: Request,
    manager: Annotated[User, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    await audit(
        db,
        DATA_EXPORT,
        user_id=manager.id,
        ip_address=request.client.host if request.client else None,
        metadata={"export_type": "orders_csv", "count": len(orders)},
    )
    await db.commit()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(
        [
            "Order Number",
            "Customer Name",
            "Email",
            "Phone",
            "Fulfillment Type",
            "Delivery Area",
            "Subtotal",
            "Delivery Fee",
            "Total Paid",
            "Status",
            "Payment Status",
            "Order Date",
        ]
    )

    for o in orders:
        writer.writerow(
            [
                o.order_number,
                f"{o.customer_first_name} {o.customer_last_name}",
                o.customer_email,
                o.customer_phone,
                o.fulfillment_type,
                o.delivery_area_name or "N/A",
                o.subtotal,
                o.delivery_fee,
                o.total,
                o.status,
                o.payment_status,
                o.created_at.strftime("%Y-%m-%d %H:%M"),
            ]
        )

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=luxeshake_orders.csv"},  # noqa: E501
    )  # noqa: E501


@router.put("/store-settings", response_model=StoreSettingsResponse)
async def update_store_settings(
    settings_in: StoreSettingsUpdate,
    superadmin: Annotated[User, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(StoreSettings))
    settings = result.scalars().first()
    if not settings:
        settings = StoreSettings()
        db.add(settings)

    settings.pickup_address = settings_in.pickup_address
    settings.pickup_phone = settings_in.pickup_phone

    await db.commit()
    await db.refresh(settings)
    await cache_invalidate("store_settings")
    return settings
