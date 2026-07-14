import logging
import os

import httpx
from app.config import settings
from app.models.order import Order
from fastapi_mail import (
    ConnectionConfig,
    FastMail,
    MessageSchema,
    MessageType,
)
from tenacity import (
    AsyncRetrying,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

logger = logging.getLogger("app.email")

mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=bool(settings.MAIL_USERNAME and settings.MAIL_PASSWORD),
    VALIDATE_CERTS=True,
)


def _load_template(name: str) -> str:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(current_dir, "..", "templates", name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


class EmailService:
    @staticmethod
    def _is_configured() -> bool:
        return bool(settings.BREVO_API_KEY) or bool(
            settings.MAIL_USERNAME and settings.MAIL_PASSWORD
        )

    @staticmethod
    async def _send_via_http_api(
        email: str,
        subject: str,
        html_content: str,
    ) -> bool:
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": settings.BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        data = {
            "sender": {
                "name": settings.MAIL_FROM_NAME,
                "email": settings.MAIL_FROM,
            },
            "to": [{"email": email}],
            "subject": subject,
            "htmlContent": html_content,
        }

        async with httpx.AsyncClient() as client:
            try:
                async for attempt in AsyncRetrying(
                    wait=wait_exponential(multiplier=1, min=2, max=10),
                    stop=stop_after_attempt(3),
                    retry=retry_if_exception_type(
                        (httpx.RequestError, httpx.TimeoutException)
                    ),
                    reraise=True,
                ):
                    with attempt:
                        resp = await client.post(
                            url,
                            headers=headers,
                            json=data,
                            timeout=10.0,
                        )
                        resp.raise_for_status()

                if resp.status_code in [200, 201, 202]:
                    logger.info(
                        f"Email sent successfully to {email} via Brevo HTTP API."  # noqa: E501
                    )
                    return True
                else:
                    logger.error(
                        f"Failed to send email via Brevo HTTP API. "
                        f"Status: {resp.status_code}, "
                        f"Response: {resp.text}"
                    )
                    return False
            except Exception as e:
                logger.error(f"HTTP exception while calling Brevo API: {str(e)}")  # noqa: E501
                return False

    @staticmethod
    async def send_verification_email(email: str, token: str):
        subject = "Verify Your LuxeShake Email Address"
        verification_link = f"{settings.FRONTEND_URL}/auth/verify-email/{token}"  # noqa: E501
        html_content = _load_template("verification.html").replace(
            "{{verification_link}}", verification_link
        )

        if not EmailService._is_configured():
            logger.warning(
                f"Email service not configured. Verification email to {email} "
                f"was not sent. Link: {verification_link}"
            )
            print(
                f"\n[EMAIL MOCK] Verification email for {email}: {verification_link}\n"  # noqa: E501
            )
            return

        if settings.BREVO_API_KEY:
            success = await EmailService._send_via_http_api(
                email, subject, html_content
            )
            if success:
                return

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)

    @staticmethod
    async def send_password_reset_otp(email: str, otp: str):
        subject = "LuxeShake Password Reset OTP"
        html_content = _load_template("password_reset.html").replace(
            "{{otp}}",
            otp,
        )

        if not EmailService._is_configured():
            logger.warning(
                f"Email service not configured. Password Reset OTP to {email} "
                f"was not sent."
            )
            return

        if settings.BREVO_API_KEY:
            success = await EmailService._send_via_http_api(
                email, subject, html_content
            )
            if success:
                return

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)

    @staticmethod
    async def send_ticket_created_email(
        email: str, submitter_name: str, ticket_number: str, subject: str
    ):
        email_subject = f"Support Ticket Received — {ticket_number}"
        tracking_link = f"{settings.FRONTEND_URL}/track-complaint"
        html_content = (
            _load_template("ticket_created.html")
            .replace("{{submitter_name}}", submitter_name)
            .replace("{{ticket_number}}", ticket_number)
            .replace("{{subject}}", subject)
            .replace("{{tracking_link}}", tracking_link)
        )

        if not EmailService._is_configured():
            logger.warning(
                "Email service not configured. Ticket created email not sent."
            )
            print(f"\n[EMAIL MOCK] Ticket Created for {email}: {ticket_number}\n")  # noqa :E501
            return

        if settings.BREVO_API_KEY:
            success = await EmailService._send_via_http_api(
                email, email_subject, html_content
            )
            if success:
                return

        message = MessageSchema(
            subject=email_subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)

    @staticmethod
    async def send_ticket_reply_email(
        email: str,
        submitter_name: str,
        ticket_number: str,
        subject: str,
        reply_text: str,
    ):
        email_subject = f"Update on your Ticket — {ticket_number}"
        tracking_link = f"{settings.FRONTEND_URL}/track-complaint"
        html_content = (
            _load_template("ticket_replied.html")
            .replace("{{submitter_name}}", submitter_name)
            .replace("{{ticket_number}}", ticket_number)
            .replace("{{subject}}", subject)
            .replace("{{reply_text}}", reply_text)
            .replace("{{tracking_link}}", tracking_link)
        )

        if not EmailService._is_configured():
            logger.warning("Email service not configured. Ticket reply email not sent.")  # noqa :E501
            print(f"\n[EMAIL MOCK] Ticket Reply for {email}: {ticket_number}\n")  # noqa :E501
            return

        if settings.BREVO_API_KEY:
            success = await EmailService._send_via_http_api(
                email, email_subject, html_content
            )
            if success:
                return

        message = MessageSchema(
            subject=email_subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)

    @staticmethod
    async def send_order_confirmation(email: str, order: Order):
        subject = f"Your LuxeShake Order is Confirmed!  — #{order.order_number}"  # noqa: E501

        items_rows = ""
        for item in order.items:
            size_badge = (
                f'<span style="font-size: 11px; '
                f"background: rgba(212, 175, 55, 0.1); "
                f"color: #d4af37; padding: 2px 6px; "
                f"border-radius: 4px; margin-left: 8px; "
                f'text-transform: capitalize;">{item.size}</span>'
            )
            items_rows += (
                f"<tr>"
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f'rgba(212, 175, 55, 0.06); font-size: 14px; color: #eae1d4;">'
                f'<span style="font-weight: 500;">{item.product_name}</span>'
                f"{size_badge}"
                f"</td>"
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f"rgba(212, 175, 55, 0.06); font-size: 14px; color: #eae1d4; "
                f'text-align: center;">{item.quantity}</td>'
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f"rgba(212, 175, 55, 0.06); font-size: 14px; color: #f2ca50; "
                f'font-weight: 600; text-align: right;">'
                f"₦{item.unit_price:,}</td>"
                f"</tr>"
            )

        fulfillment_details_block = ""
        if order.fulfillment_type == "delivery":
            fulfillment_details_block = (
                f"<tr>"
                f'<td style="padding-bottom: 20px;">'
                f'<table width="100%" cellpadding="0" cellspacing="0" '
                f'border="0" style="background: rgba(212, 175, 55, 0.04); '
                f"border: 1px solid rgba(212, 175, 55, 0.12); "
                f"border-radius: 12px; padding: 16px; "
                f'box-sizing: border-box;">'
                f"<tr>"
                f"<td>"
                f'<div style="font-size: 10px; font-weight: 700; '
                f"letter-spacing: 0.1em; text-transform: uppercase; "
                f'color: #d4af37; margin-bottom: 6px;">'
                f"Delivery Address</div>"
                f'<div style="font-size: 13.5px; line-height: 1.4; '
                f'color: #eae1d4;">'
                f"<strong>Region:</strong> {order.delivery_area_name}<br/>"
                f"<strong>Address Details:</strong> "
                f"{order.customer_note or 'No instructions provided.'}"
                f"</div>"
                f"</td>"
                f"</tr>"
                f"</table>"
                f"</td>"
                f"</tr>"
            )
        elif order.customer_note:
            fulfillment_details_block = (
                f"<tr>"
                f'<td style="padding-bottom: 20px;">'
                f'<table width="100%" cellpadding="0" cellspacing="0" '
                f'border="0" style="background: rgba(212, 175, 55, 0.04); '
                f"border: 1px solid rgba(212, 175, 55, 0.12); "
                f"border-radius: 12px; padding: 16px; "
                f'box-sizing: border-box;">'
                f"<tr>"
                f"<td>"
                f'<div style="font-size: 10px; font-weight: 700; '
                f"letter-spacing: 0.1em; text-transform: uppercase; "
                f'color: #d4af37; margin-bottom: 6px;">'
                f"Additional Notes</div>"
                f'<div style="font-size: 13.5px; line-height: 1.4; '
                f'color: #eae1d4;">{order.customer_note}</div>'
                f"</td>"
                f"</tr>"
                f"</table>"
                f"</td>"
                f"</tr>"
            )

        tracking_url = f"{settings.FRONTEND_URL}/track/{order.id}"

        html_content = (
            _load_template("order_confirmation.html")
            .replace("{{customer_first_name}}", order.customer_first_name)
            .replace("{{total}}", f"{order.total:,}")
            .replace("{{items_rows}}", items_rows)
            .replace("{{subtotal}}", f"{order.subtotal:,}")
            .replace("{{delivery_fee}}", f"{order.delivery_fee:,}")
            .replace("{{fulfillment_type}}", order.fulfillment_type)
            .replace("{{customer_phone}}", order.customer_phone)
            .replace(
                "{{fulfillment_details_block}}",
                fulfillment_details_block,
            )
            .replace("{{tracking_url}}", tracking_url)
            .replace("{{order_number}}", order.order_number)
        )

        if not EmailService._is_configured():
            logger.warning(
                f"Email service not configured. Order confirmation to {email} "
                f"was not sent."
            )
            print(
                f"\n[EMAIL MOCK] Order Confirmation for {email}: "
                f"Order #{order.order_number}\n"
            )
            return

        if settings.BREVO_API_KEY:
            success = await EmailService._send_via_http_api(
                email, subject, html_content
            )
            if success:
                return

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)

    @staticmethod
    async def send_admin_order_alert(order: Order):
        """Alerts the business admin when a new paid order arrives."""
        email = settings.ADMIN_EMAIL
        subject = f"New Paid Order Received — #{order.order_number}"

        items_rows = ""
        for item in order.items:
            size_badge = (
                f'<span style="font-size: 11px; '
                f"background: rgba(212, 175, 55, 0.1); "
                f"color: #d4af37; padding: 2px 6px; "
                f"border-radius: 4px; margin-left: 8px; "
                f'text-transform: capitalize;">{item.size}</span>'
            )
            items_rows += (
                f"<tr>"
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f'rgba(212, 175, 55, 0.06); font-size: 14px; color: #eae1d4;">'
                f'<span style="font-weight: 500;">{item.product_name}</span>'
                f"{size_badge}"
                f"</td>"
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f"rgba(212, 175, 55, 0.06); font-size: 14px; color: #eae1d4; "
                f'text-align: center;">{item.quantity}</td>'
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f"rgba(212, 175, 55, 0.06); font-size: 14px; color: #f2ca50; "
                f'font-weight: 600; text-align: right;">'
                f"₦{item.unit_price:,}</td>"
                f"</tr>"
            )

        delivery_location_row = ""
        if order.fulfillment_type == "delivery":
            delivery_location_row = (
                f"<tr>"
                f'<td style="color: #99907c; font-weight: 600; '
                f'vertical-align: top; padding-bottom: 6px;">'
                f"Delivery Location:</td>"
                f'<td style="color: #eae1d4; padding-bottom: 6px;">'
                f"{order.delivery_area_name}</td>"
                f"</tr>"
            )

        customer_note_row = ""
        if order.customer_note:
            is_delivery = order.fulfillment_type == "delivery"
            note_label = "Address / Notes:" if is_delivery else "Pickup Notes:"
            customer_note_row = (
                f"<tr>"
                f'<td style="color: #99907c; font-weight: 600; '
                f'vertical-align: top; padding-bottom: 6px;">'
                f"{note_label}</td>"
                f'<td style="color: #eae1d4; padding-bottom: 6px; '
                f'white-space: pre-wrap;">{order.customer_note}</td>'
                f"</tr>"
            )

        admin_url = f"{settings.FRONTEND_URL}/luxe-control/orders"

        html_content = (
            _load_template("admin_order_alert.html")
            .replace("{{order_number}}", order.order_number)
            .replace("{{customer_first_name}}", order.customer_first_name)
            .replace("{{customer_last_name}}", order.customer_last_name)
            .replace("{{customer_phone}}", order.customer_phone)
            .replace("{{customer_email}}", order.customer_email)
            .replace("{{fulfillment_type}}", order.fulfillment_type)
            .replace("{{delivery_location_row}}", delivery_location_row)
            .replace("{{customer_note_row}}", customer_note_row)
            .replace("{{items_rows}}", items_rows)
            .replace("{{subtotal}}", f"{order.subtotal:,}")
            .replace("{{delivery_fee}}", f"{order.delivery_fee:,}")
            .replace("{{total}}", f"{order.total:,}")
            .replace("{{admin_url}}", admin_url)
        )
        if not EmailService._is_configured():
            logger.warning("Email service not configured. Admin order alert not sent.")  # noqa: E501
            print(
                f"\n[EMAIL MOCK ADMIN] Admin Order Notification for "
                f"#{order.order_number} to {email}\n"
            )
            return

        if settings.BREVO_API_KEY:
            success = await EmailService._send_via_http_api(
                email, subject, html_content
            )
            if success:
                return

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)

    @staticmethod
    async def send_pickup_ready_email(
        email: str, order: Order, address: str, phone: str
    ):
        subject = f"Your LuxeShake Order is Ready for Pickup!  — #{order.order_number}"  # noqa: E501

        items_rows = ""
        for item in order.items:
            size_badge = (
                f'<span style="font-size: 11px; '
                f"background: rgba(212, 175, 55, 0.1); "
                f"color: #d4af37; padding: 2px 6px; "
                f"border-radius: 4px; margin-left: 8px; "
                f'text-transform: capitalize;">{item.size}</span>'
            )
            items_rows += (
                f"<tr>"
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f'rgba(212, 175, 55, 0.06); font-size: 14px; color: #eae1d4;">'
                f'<span style="font-weight: 500;">{item.product_name}</span>'
                f"{size_badge}"
                f"</td>"
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f"rgba(212, 175, 55, 0.06); font-size: 14px; color: #eae1d4; "
                f'text-align: center;">{item.quantity}</td>'
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f"rgba(212, 175, 55, 0.06); font-size: 14px; color: #f2ca50; "
                f'font-weight: 600; text-align: right;">'
                f"₦{item.unit_price:,}</td>"
                f"</tr>"
            )

        tracking_url = f"{settings.FRONTEND_URL}/track/{order.id}"

        html_content = (
            _load_template("pickup_ready.html")
            .replace("{{order_number}}", order.order_number)
            .replace("{{customer_first_name}}", order.customer_first_name)
            .replace("{{address}}", address)
            .replace("{{phone}}", phone)
            .replace("{{items_rows}}", items_rows)
            .replace("{{subtotal}}", f"{order.subtotal:,}")
            .replace("{{delivery_fee}}", f"{order.delivery_fee:,}")
            .replace("{{total}}", f"{order.total:,}")
            .replace("{{tracking_url}}", tracking_url)
        )

        if not EmailService._is_configured():
            logger.warning(
                f"Email service not configured. Pickup ready email to {email} "
                f"was not sent."
            )
            print(
                f"\n[EMAIL MOCK] Pickup Ready for {email}: "
                f"Order #{order.order_number} at {address}\n"
            )
            return

        if settings.BREVO_API_KEY:
            success = await EmailService._send_via_http_api(
                email, subject, html_content
            )
            if success:
                return

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)

    @staticmethod
    async def send_out_for_delivery_email(email: str, order: Order):
        subject = f"Your LuxeShake Order is Out for Delivery!  — #{order.order_number}"  # noqa: E501

        items_rows = ""
        for item in order.items:
            size_badge = (
                f'<span style="font-size: 11px; '
                f"background: rgba(212, 175, 55, 0.1); "
                f"color: #d4af37; padding: 2px 6px; "
                f"border-radius: 4px; margin-left: 8px; "
                f'text-transform: capitalize;">{item.size}</span>'
            )
            items_rows += (
                f"<tr>"
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f'rgba(212, 175, 55, 0.06); font-size: 14px; color: #eae1d4;">'
                f'<span style="font-weight: 500;">{item.product_name}</span>'
                f"{size_badge}"
                f"</td>"
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f"rgba(212, 175, 55, 0.06); font-size: 14px; color: #eae1d4; "
                f'text-align: center;">{item.quantity}</td>'
                f'<td style="padding: 14px 0; border-bottom: 1px solid '
                f"rgba(212, 175, 55, 0.06); font-size: 14px; color: #f2ca50; "
                f'font-weight: 600; text-align: right;">'
                f"₦{item.unit_price:,}</td>"
                f"</tr>"
            )

        tracking_url = f"{settings.FRONTEND_URL}/track/{order.id}"

        html_content = (
            _load_template("out_for_delivery.html")
            .replace("{{order_number}}", order.order_number)
            .replace("{{customer_first_name}}", order.customer_first_name)
            .replace(
                "{{delivery_area_name}}",
                order.delivery_area_name or "Standard Zone",
            )
            .replace("{{driver_phone}}", order.driver_phone or "N/A")
            .replace("{{items_rows}}", items_rows)
            .replace("{{subtotal}}", f"{order.subtotal:,}")
            .replace("{{delivery_fee}}", f"{order.delivery_fee:,}")
            .replace("{{total}}", f"{order.total:,}")
            .replace("{{tracking_url}}", tracking_url)
        )

        if not EmailService._is_configured():
            logger.warning(
                f"Email service not configured. Out for delivery email to "
                f"{email} was not sent."
            )
            print(
                f"\n[EMAIL MOCK] Out for Delivery for {email}: "
                f"Order #{order.order_number} "
                f"(Driver: {order.driver_phone})\n"
            )
            return

        if settings.BREVO_API_KEY:
            success = await EmailService._send_via_http_api(
                email, subject, html_content
            )
            if success:
                return

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)

    @staticmethod
    async def send_admin_password_reset(email: str, temp_password: str):
        subject = "Your LuxeControl Password Has Been Reset"
        login_link = f"{settings.FRONTEND_URL}/luxe-control"
        html_content = (
            _load_template("admin_password_reset.html")
            .replace("{{temp_password}}", temp_password)
            .replace("{{login_link}}", login_link)
        )

        if not EmailService._is_configured():
            logger.warning(
                f"Email service not configured. Admin Password Reset email to "
                f"{email} was not sent."
            )
            return

        if settings.BREVO_API_KEY:
            success = await EmailService._send_via_http_api(
                email, subject, html_content
            )
            if success:
                return

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)
