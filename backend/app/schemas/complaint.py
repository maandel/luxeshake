import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ContactFormCreate(BaseModel):
    submitter_name: str = Field(..., min_length=1, max_length=100)
    submitter_email: EmailStr
    submitter_phone: str | None = Field(
        None, min_length=7, max_length=20, pattern=r"^\+?[0-9\s\-]+$"
    )
    category: str = Field(
        ...,
        pattern="^(delivery|payment|product_quality|wrong_order|other)$",
        description="Category: delivery, payment, wrong_order, etc.",
    )
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=20, max_length=5000)
    order_id: uuid.UUID | None = None


class TicketCreate(BaseModel):
    category: str = Field(
        ...,
        pattern="^(delivery|payment|product_quality|wrong_order|other)$",
    )
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=20, max_length=5000)
    order_id: uuid.UUID | None = None


class TicketMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    is_internal: bool = False


class TicketMessageResponse(BaseModel):
    id: uuid.UUID
    complaint_id: uuid.UUID
    sender_id: uuid.UUID | None
    sender_name: str
    message: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintResponse(BaseModel):
    id: uuid.UUID
    ticket_number: str
    user_id: uuid.UUID | None
    order_id: uuid.UUID | None
    submitter_name: str
    submitter_email: EmailStr
    submitter_phone: str | None
    subject: str
    message: str
    category: str
    status: str
    priority: str
    assigned_to: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    messages: list[TicketMessageResponse] = []

    class Config:
        from_attributes = True


class ComplaintStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|in_progress|resolved|closed)$")
    priority: str | None = Field(None, pattern="^(low|medium|high|critical)$")


class ComplaintAssignRequest(BaseModel):
    assigned_to: uuid.UUID
