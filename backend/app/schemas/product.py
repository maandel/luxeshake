import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=100)
    sort_order: int = Field(0, ge=0, le=1000)


class CategoryCreate(CategoryBase):
    is_active: bool = True


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=1000)
    category_id: uuid.UUID
    tag: str = Field("Drink", min_length=1, max_length=50)
    small_price: int = Field(..., ge=0, le=10000000)
    big_price: int = Field(..., ge=0, le=10000000)
    sort_order: int = Field(0, ge=0, le=1000)
    image_url: str | None = Field(None, max_length=2048)
    image_path: str | None = Field(None, max_length=2048)


class ProductCreate(ProductBase):
    is_active: bool = True


class ProductResponse(ProductBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: str | None = None

    class Config:
        from_attributes = True

    @field_validator("category", mode="before")
    @classmethod
    def get_category_name(cls, v):
        if hasattr(v, "display_name"):
            return v.display_name
        return v
