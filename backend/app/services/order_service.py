import logging
import secrets
from typing import Optional

from app.models.delivery_area import DeliveryArea
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate
from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger("app.orders.service")


class OrderService:
    @staticmethod
    async def generate_order_number(db: AsyncSession) -> str:
        while True:
            random_suffix = secrets.token_hex(4).upper()
            order_number = f"LXS-{random_suffix}"
            result = await db.execute(
                select(Order.id).where(Order.order_number == order_number)
            )
            if not result.scalars().first():
                return order_number

    @staticmethod
    async def process_checkout(
        db: AsyncSession, order_in: OrderCreate, current_user: Optional[User]
    ) -> Order:
        # Validate delivery area
        delivery_fee = 0
        delivery_area_name = None
        if order_in.fulfillment_type == "delivery":
            if not order_in.delivery_area_id:
                raise HTTPException(
                    status_code=400,
                    detail="Delivery area ID is required for delivery",
                )

            area_res = await db.execute(
                select(DeliveryArea).where(DeliveryArea.id == order_in.delivery_area_id)
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

        # Fetch products in a single query to fix N+1 issue
        product_ids = [item.product_id for item in order_in.items]
        prod_res = await db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.id.in_(product_ids))
        )
        products = {p.id: p for p in prod_res.scalars().all()}

        subtotal = 0
        order_items = []

        for item in order_in.items:
            product = products.get(item.product_id)
            if not product or not product.is_active:
                raise HTTPException(
                    status_code=400,
                    detail=f"Product {item.product_id} not found or inactive",
                )

            unit_price = (
                product.small_price if item.size == "small" else product.big_price
            )
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
                raise HTTPException(status_code=404, detail="Existing order not found")
            if existing_order.payment_status == "paid":
                raise HTTPException(
                    status_code=400, detail="Order has already been paid"
                )

        if existing_order:
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
            order_number = await OrderService.generate_order_number(db)
            order_user_id = current_user.id if current_user else None

            # Link to existing user by email if not logged in
            if not order_user_id:
                user_res = await db.execute(
                    select(User).where(
                        func.lower(User.email)
                        == order_in.customer_email.lower().strip()
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
