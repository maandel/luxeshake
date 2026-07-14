import hmac
import hashlib
import uuid
from datetime import datetime, UTC
from typing import Annotated
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Header,
    Request,
    BackgroundTasks,
    Query,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import httpx

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.order import Order
from app.models.transaction import Transaction
from app.services.email_service import EmailService
from app.dependencies.auth_deps import get_optional_user, require_manager_or_above
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Payments"])


@router.post("/payments/initialize")
async def initialize_payment(
    payload: dict,
    current_user: Annotated[User | None, Depends(get_optional_user)],
    db: AsyncSession = Depends(get_db),
):
    order_id_str = payload.get("order_id")
    if not order_id_str:
        raise HTTPException(status_code=400, detail="order_id is required")

    try:
        order_id = uuid.UUID(order_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order_id format")

    # Fetch order
    ord_res = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    order = ord_res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # 1. Idempotency Flow: Check if a successful or pending transaction already exists
    tx_res = await db.execute(
        select(Transaction).where(Transaction.order_id == order.id)
    )
    existing_txs = tx_res.scalars().all()
    for tx in existing_txs:
        if tx.status == "success":
            return {
                "detail": "Order already paid successfully",
                "status": "success",
                "reference": tx.paystack_reference,
            }
        elif tx.status == "pending":
            # Return existing pending transaction reference to avoid duplicate initialization on Paystack
            return {
                "detail": "Payment already initialized",
                "status": "pending",
                "reference": tx.paystack_reference,
                "amount": order.total,
            }

    # Initialize Paystack transaction
    # Amount in kobo (multiply by 100)
    paystack_amount = order.total * 100
    reference = str(uuid.uuid4())

    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }

    data = {
        "email": order.customer_email,
        "amount": paystack_amount,
        "reference": reference,
        "callback_url": f"{settings.FRONTEND_URL}/payments/verify",
        "metadata": {
            "order_id": str(order.id),
            "customer_name": f"{order.customer_first_name} {order.customer_last_name}",
        },
    }

    # If running with mock test key, return mock auth details directly without calling Paystack API
    if settings.PAYSTACK_SECRET_KEY == "sk_test_mock_secret_key":
        new_tx = Transaction(
            order_id=order.id,
            paystack_reference=reference,
            amount=order.total,
            status="pending",
        )
        db.add(new_tx)
        await db.commit()
        return {
            "authorization_url": f"https://checkout.paystack.com/mock-{reference}",
            "reference": reference,
            "access_code": f"mock-code-{reference}",
        }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "https://api.paystack.co/transaction/initialize",
                headers=headers,
                json=data,
                timeout=10.0,
            )
            resp_data = resp.json()
        except Exception as e:
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"Failed to initialize payment gateway: {str(e)}")
            raise HTTPException(
                status_code=500, detail="Failed to initialize payment gateway"
            )

    if not resp_data.get("status"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=resp_data.get("message", "Paystack payment initialization failed"),
        )

    # Save transaction
    new_tx = Transaction(
        order_id=order.id,
        paystack_reference=reference,
        amount=order.total,
        status="pending",
    )
    db.add(new_tx)

    # Associate reference to order
    order.paystack_reference = reference
    await db.commit()

    return resp_data["data"]


@router.get("/payments/verify/{reference}")
async def verify_payment(
    reference: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # Fetch transaction
    tx_res = await db.execute(
        select(Transaction).where(Transaction.paystack_reference == reference)
    )
    tx = tx_res.scalars().first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction reference not found")

    if tx.status == "success":
        return {"status": "success", "detail": "Transaction verified successfully"}

    ord_res = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == tx.order_id)
    )
    order = ord_res.scalars().first()

    # Mock success path for testing
    if (
        settings.PAYSTACK_SECRET_KEY == "sk_test_mock_secret_key"
        or reference.startswith("mock")
    ):
        tx.status = "success"
        tx.paid_at = datetime.now(UTC)
        tx.gateway_response = "Approved"
        tx.channel = "card"

        order.payment_status = "paid"
        order.status = "confirmed"
        await db.commit()

        # Trigger background notifications
        background_tasks.add_task(
            EmailService.send_order_confirmation,
            email=order.customer_email,
            order=order,
        )
        background_tasks.add_task(EmailService.send_admin_order_alert, order=order)
        return {"status": "success", "detail": "Mock payment verification complete"}

    headers = {"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers=headers,
                timeout=10.0,
            )
            resp_data = resp.json()
        except Exception as e:
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"Failed to verify payment gateway: {str(e)}")
            raise HTTPException(
                status_code=500, detail="Failed to verify payment gateway"
            )

    if not resp_data.get("status"):
        raise HTTPException(
            status_code=400, detail="Paystack verification request failed"
        )

    data = resp_data["data"]
    if data["status"] == "success" and data["amount"] == tx.amount * 100:
        tx.status = "success"
        tx.paystack_transaction_id = str(data["id"])
        tx.paid_at = datetime.fromisoformat(data["paid_at"].replace("Z", "+00:00"))
        tx.gateway_response = data["gateway_response"]
        tx.channel = data["channel"]
        tx.ip_address = data["ip_address"]

        order.payment_status = "paid"
        order.status = "confirmed"
        await db.commit()

        # Send emails
        background_tasks.add_task(
            EmailService.send_order_confirmation,
            email=order.customer_email,
            order=order,
        )
        background_tasks.add_task(EmailService.send_admin_order_alert, order=order)
        return {"status": "success", "detail": "Payment verified successfully"}
    else:
        tx.status = "failed"
        order.payment_status = "failed"
        await db.commit()
        return {
            "status": "failed",
            "detail": data.get("gateway_response", "Payment failed"),
        }


@router.post("/webhooks/paystack")
async def paystack_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_paystack_signature: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
):
    # 1. Read body ONCE — must not call request.json() after this
    body = await request.body()

    # 2. Verify Webhook Signature
    if not x_paystack_signature:
        raise HTTPException(status_code=400, detail="Missing signature header")

    computed_sig = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode("utf-8"), body, hashlib.sha512
    ).hexdigest()

    if not hmac.compare_digest(computed_sig, x_paystack_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # 3. Parse JSON from already-read bytes (avoid second .body() read)
    import json

    try:
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = payload.get("event")

    if event == "charge.success":
        data = payload.get("data", {})
        reference = data.get("reference")

        # Fetch transaction by reference
        tx_res = await db.execute(
            select(Transaction).where(Transaction.paystack_reference == reference)
        )
        tx = tx_res.scalars().first()

        if tx and tx.status != "success":
            # 4. Amount verification — prevent tampered webhook from marking unpaid orders as paid
            webhook_amount_kobo = data.get("amount", 0)  # Paystack sends in kobo
            expected_amount_kobo = int(tx.amount * 100)  # tx.amount is in Naira
            if webhook_amount_kobo != expected_amount_kobo:
                logger.warning(
                    "paystack_webhook_amount_mismatch",
                    reference=reference,
                    expected=expected_amount_kobo,
                    received=webhook_amount_kobo,
                )
                return {"detail": "Webhook amount mismatch — event ignored"}

            ord_res = await db.execute(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.id == tx.order_id)
            )
            order = ord_res.scalars().first()

            tx.status = "success"
            tx.paystack_transaction_id = str(data.get("id"))
            tx.paid_at = datetime.now(UTC)
            tx.gateway_response = data.get("gateway_response")
            tx.channel = data.get("channel")
            tx.ip_address = data.get("ip_address")

            if order:
                order.payment_status = "paid"
                order.status = "confirmed"

            from app.core.audit import PAYMENT_WEBHOOK, audit

            await audit(
                db,
                PAYMENT_WEBHOOK,
                resource="transaction",
                resource_id=reference,
                ip_address=request.client.host if request.client else None,
                metadata={"event": event, "amount_kobo": webhook_amount_kobo},
            )
            await db.commit()

            if order:
                # Send emails
                background_tasks.add_task(
                    EmailService.send_order_confirmation,
                    email=order.customer_email,
                    order=order,
                )
                background_tasks.add_task(
                    EmailService.send_admin_order_alert, order=order
                )

    return {"detail": "Webhook received"}


# ----------------- ADMIN TRANS ROUTES (Manager+) -----------------


@router.get("/admin/transactions")
async def admin_list_transactions(
    current_user: Annotated[User, Depends(require_manager_or_above)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    query = select(Transaction).order_by(Transaction.created_at.desc())

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_res.scalar() or 0

    result = await db.execute(query.offset(offset).limit(page_size))
    transactions = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size
    return {
        "items": transactions,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
