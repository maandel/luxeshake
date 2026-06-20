import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DeliveryAreaBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    fee: int = Field(..., ge=0, le=1000000)
    sort_order: int = Field(0, ge=0, le=1000)


class DeliveryAreaCreate(DeliveryAreaBase):
    pass


class DeliveryAreaResponse(DeliveryAreaBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
