import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    size: str = Field(
        ...,
        pattern="^(small|big)$",
        description="Size must be 'small' or 'big'",
    )
    quantity: int = Field(..., gt=0, le=100)


class OrderCreate(BaseModel):
    customer_first_name: str = Field(..., min_length=1, max_length=50)
    customer_last_name: str = Field(..., min_length=1, max_length=50)
    customer_email: EmailStr
    customer_phone: str = Field(
        ..., min_length=7, max_length=20, pattern=r"^\+?[0-9\s\-]+$"
    )
    customer_note: str | None = Field(None, max_length=1000)
    fulfillment_type: str = Field(
        ...,
        pattern="^(delivery|pickup)$",
        description="Fulfillment must be 'delivery' or 'pickup'",
    )
    delivery_area_id: uuid.UUID | None = None
    items: list[OrderItemCreate] = Field(..., min_length=1)
    existing_order_id: uuid.UUID | None = None


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID | None
    product_name: str
    product_category: str
    size: str
    unit_price: int
    quantity: int
    line_total: int

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: uuid.UUID
    order_number: str
    customer_first_name: str
    customer_last_name: str
    customer_email: EmailStr
    customer_phone: str
    customer_note: str | None
    fulfillment_type: str
    delivery_area_id: uuid.UUID | None
    delivery_area_name: str | None
    delivery_fee: int
    subtotal: int
    total: int
    status: str
    payment_status: str
    driver_phone: str | None = None
    paystack_reference: str | None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse]

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
    driver_phone: str | None = None


class StoreSettingsResponse(BaseModel):
    id: uuid.UUID
    pickup_address: str
    pickup_phone: str

    class Config:
        from_attributes = True


class StoreSettingsUpdate(BaseModel):
    pickup_address: str = Field(..., min_length=5, max_length=500)
    pickup_phone: str = Field(
        ..., min_length=7, max_length=20, pattern=r"^\+?[0-9\s\-]+$"
    )
