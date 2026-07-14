import logging
import secrets
import uuid
from typing import Annotated

from app.database import get_db
from app.dependencies.auth_deps import (
    get_current_active_user,
    get_optional_user,
    require_staff_or_above,
)
from app.models.delivery_area import DeliveryArea
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.store_settings import StoreSettings
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    StoreSettingsResponse,
)
from app.services.email_service import EmailService
from app.services.cache import cache_get, cache_set
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger("app.orders")

router = APIRouter(tags=["Orders"])


_STORE_SETTINGS_TTL = 120


@router.get("/store-settings", response_model=StoreSettingsResponse)
async def get_store_settings(db: AsyncSession = Depends(get_db)):
    cached = await cache_get("store_settings")
    if cached is not None:
        return cached
    result = await db.execute(select(StoreSettings))
    settings = result.scalars().first()
    if not settings:
        fallback = StoreSettings(
            pickup_address="LuxeShake Boutique, 12 Presidential Road, Enugu, Nigeria",  # noqa: E501
            pickup_phone="+234 812 345 6789",
        )
        return fallback
    await cache_set("store_settings", settings, _STORE_SETTINGS_TTL)
    return settings


async def generate_order_number(db: AsyncSession) -> str:
    while True:
        random_suffix = secrets.token_hex(4).upper()
        order_number = f"LXS-{random_suffix}"
        result = await db.execute(
            select(Order.id).where(Order.order_number == order_number)
        )
        if not result.scalars().first():
            return order_number


@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_order(
    order_in: OrderCreate,
    current_user: Annotated[User | None, Depends(get_optional_user)],
    db: AsyncSession = Depends(get_db),
):
    delivery_fee = 0
    delivery_area_name = None
    if order_in.fulfillment_type == "delivery":
        if not order_in.delivery_area_id:
            raise HTTPException(
                status_code=400,
                detail="Delivery area ID is required for delivery",
            )

        area_res = await db.execute(
            select(DeliveryArea).where(DeliveryArea.id == order_in.delivery_area_id)  # noqa: E501
        )
        area = area_res.scalars().first()
        if not area or not area.is_active:
            raise HTTPException(
                status_code=400, detail="Invalid or inactive delivery area"
            )
        delivery_fee = area.fee
        delivery_area_name = area.name
    elif order_in.fulfillment_type != "pickup":
        raise HTTPException(status_code=400, detail="Invalid fulfillment type")

    subtotal = 0
    order_items = []

    for item in order_in.items:
        prod_res = await db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.id == item.product_id)
        )
        product = prod_res.scalars().first()
        if not product or not product.is_active:
            raise HTTPException(
                status_code=400,
                detail=f"Product {item.product_id} not found or inactive",
            )

        unit_price = product.small_price if item.size == "small" else product.big_price  # noqa: E501
        line_total = unit_price * item.quantity
        subtotal += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                product_category=product.category.display_name,
                size=item.size,
                unit_price=unit_price,
                quantity=item.quantity,
                line_total=line_total,
            )
        )

    total = subtotal + delivery_fee
    existing_order = None
    if order_in.existing_order_id:
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order_in.existing_order_id)
        )
        existing_order = result.scalars().first()
        if not existing_order:
            raise HTTPException(status_code=404, detail="Existing order not found")  # noqa: E501
        if existing_order.payment_status == "paid":
            raise HTTPException(status_code=400, detail="Order has already been paid")  # noqa: E501

    if existing_order:
        from sqlalchemy import delete

        await db.execute(
            delete(OrderItem).where(OrderItem.order_id == existing_order.id)
        )

        existing_order.customer_first_name = order_in.customer_first_name
        existing_order.customer_last_name = order_in.customer_last_name
        existing_order.customer_email = order_in.customer_email
        existing_order.customer_phone = order_in.customer_phone
        existing_order.customer_note = order_in.customer_note
        existing_order.fulfillment_type = order_in.fulfillment_type
        existing_order.delivery_area_id = (
            order_in.delivery_area_id
            if order_in.fulfillment_type == "delivery"
            else None
        )
        existing_order.delivery_area_name = delivery_area_name
        existing_order.delivery_fee = delivery_fee
        existing_order.subtotal = subtotal
        existing_order.total = total
        existing_order.items = order_items

        await db.commit()
        order_to_return_id = existing_order.id
    else:
        order_number = await generate_order_number(db)
        order_user_id = current_user.id if current_user else None
        if not order_user_id:
            from app.models.user import User
            from sqlalchemy import func

            user_res = await db.execute(
                select(User).where(
                    func.lower(User.email) == order_in.customer_email.lower().strip()  # noqa: E501
                )
            )
            existing_user = user_res.scalars().first()
            if existing_user:
                order_user_id = existing_user.id

        new_order = Order(
            order_number=order_number,
            user_id=order_user_id,
            customer_first_name=order_in.customer_first_name,
            customer_last_name=order_in.customer_last_name,
            customer_email=order_in.customer_email,
            customer_phone=order_in.customer_phone,
            customer_note=order_in.customer_note,
            fulfillment_type=order_in.fulfillment_type,
            delivery_area_id=order_in.delivery_area_id
            if order_in.fulfillment_type == "delivery"
            else None,
            delivery_area_name=delivery_area_name,
            delivery_fee=delivery_fee,
            subtotal=subtotal,
            total=total,
            status="pending",
            payment_status="unpaid",
            items=order_items,
        )
        db.add(new_order)
        await db.commit()
        order_to_return_id = new_order.id

    res = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_to_return_id)
    )
    return res.scalars().first()


@router.get("/orders/track/{order_number}", response_model=OrderResponse)
async def track_order(order_number: str, db: AsyncSession = Depends(get_db)):
    import uuid

    query_filter = Order.order_number == order_number
    try:
        order_uuid = uuid.UUID(order_number)
        query_filter = (Order.order_number == order_number) | (Order.id == order_uuid)  # noqa: E501
    except ValueError:
        pass

    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(query_filter)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/orders/my-orders")
async def get_my_orders(
    current_user: Annotated[User, Depends(get_current_active_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    query = (
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))  # noqa: E501
    total = count_res.scalar() or 0

    result = await db.execute(query.offset(offset).limit(page_size))
    items = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/orders/my-orders/{id}", response_model=OrderResponse)
async def get_my_order_detail(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == id, Order.user_id == current_user.id)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/admin/orders")
async def admin_list_orders(
    current_user: Annotated[User, Depends(require_staff_or_above)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    _VALID_STATUSES = {
        "pending",
        "confirmed",
        "processing",
        "out_for_delivery",
        "delivered",
        "cancelled",
    }
    if status and status not in _VALID_STATUSES:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(_VALID_STATUSES))}",
        )

    offset = (page - 1) * page_size
    query = select(Order).order_by(Order.created_at.desc())
    if status:
        query = query.where(Order.status == status)

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))  # noqa: E501
    total = count_res.scalar() or 0

    result = await db.execute(
        query.options(selectinload(Order.items)).offset(offset).limit(page_size)  # noqa: E501
    )
    orders = result.scalars().all()

    if current_user.role == "staff":
        for o in orders:
            o.subtotal = 0
            o.total = 0
            o.delivery_fee = 0
            for item in o.items:
                item.unit_price = 0
                item.line_total = 0

    total_pages = (total + page_size - 1) // page_size
    return {
        "items": orders,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/admin/orders/{id}", response_model=OrderResponse)
async def admin_get_order(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(require_staff_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == id)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == "staff":
        order.subtotal = 0
        order.total = 0
        order.delivery_fee = 0
        for item in order.items:
            item.unit_price = 0
            item.line_total = 0

    return order


@router.patch("/admin/orders/{id}/status", response_model=OrderResponse)
async def admin_update_order_status(
    id: uuid.UUID,
    status_in: OrderStatusUpdate,
    current_user: Annotated[User, Depends(require_staff_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == id)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    new_status = status_in.status

    if order.payment_status != "paid" and new_status != "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Order actions are blocked for unpaid orders. "
            "Fulfillments require successful payment.",
        )

    order.status = new_status
    if status_in.driver_phone is not None:
        order.driver_phone = status_in.driver_phone

    await db.commit()
    await db.refresh(order)

    if old_status != "out_for_delivery" and new_status == "out_for_delivery":
        try:
            if order.fulfillment_type == "pickup":
                settings_res = await db.execute(select(StoreSettings))
                store_settings = settings_res.scalars().first()
                pickup_address = (
                    store_settings.pickup_address
                    if store_settings
                    else "LuxeShake Boutique, 12 Presidential Road, Enugu, Nigeria"  # noqa: E501
                )
                pickup_phone = (
                    store_settings.pickup_phone
                    if store_settings
                    else "+234 812 345 6789"
                )
                await EmailService.send_pickup_ready_email(
                    order.customer_email, order, pickup_address, pickup_phone
                )
            else:
                await EmailService.send_out_for_delivery_email(
                    order.customer_email, order
                )
        except Exception as e:
            logger.error(f"Failed to send status notification email: {str(e)}")

    return order
