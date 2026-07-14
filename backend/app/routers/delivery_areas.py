import uuid
from typing import Annotated

from app.database import get_db
from app.dependencies.auth_deps import require_manager_or_above
from app.models.delivery_area import DeliveryArea
from app.schemas.delivery_area import DeliveryAreaCreate, DeliveryAreaResponse
from app.services.cache import cache_get, cache_set, cache_invalidate
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["Delivery Areas"])

_DELIVERY_AREAS_TTL = 120


@router.get("/delivery-areas", response_model=list[DeliveryAreaResponse])
async def list_delivery_areas(response: Response, db: AsyncSession = Depends(get_db)):
    cached = await cache_get("delivery_areas:all")
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        return cached
    result = await db.execute(
        select(DeliveryArea)
        .where(DeliveryArea.is_active)
        .order_by(DeliveryArea.sort_order)
    )
    areas = result.scalars().all()
    await cache_set("delivery_areas:all", areas, _DELIVERY_AREAS_TTL)
    response.headers["X-Cache"] = "MISS"
    return areas


# Admin routes
@router.get("/admin/delivery-areas", response_model=list[DeliveryAreaResponse])
async def admin_list_delivery_areas(
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DeliveryArea).order_by(DeliveryArea.sort_order))
    return result.scalars().all()


@router.post(
    "/admin/delivery-areas",
    response_model=DeliveryAreaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_delivery_area(
    area_in: DeliveryAreaCreate,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    # Verify uniqueness
    chk_res = await db.execute(
        select(DeliveryArea).where(DeliveryArea.name == area_in.name)
    )
    if chk_res.scalars().first():
        raise HTTPException(status_code=400, detail="Delivery area name already exists")

    new_area = DeliveryArea(**area_in.model_dump())
    db.add(new_area)
    await db.commit()
    await db.refresh(new_area)
    await cache_invalidate("delivery_areas:")
    return new_area


@router.put("/admin/delivery-areas/{id}", response_model=DeliveryAreaResponse)
async def admin_update_delivery_area(
    id: uuid.UUID,
    area_in: DeliveryAreaCreate,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DeliveryArea).where(DeliveryArea.id == id))
    area = result.scalars().first()
    if not area:
        raise HTTPException(status_code=404, detail="Delivery area not found")

    for field, val in area_in.model_dump().items():
        setattr(area, field, val)

    await db.commit()
    await db.refresh(area)
    await cache_invalidate("delivery_areas:")
    return area


@router.delete("/admin/delivery-areas/{id}")
async def admin_delete_delivery_area(
    id: uuid.UUID,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DeliveryArea).where(DeliveryArea.id == id))
    area = result.scalars().first()
    if not area:
        raise HTTPException(status_code=404, detail="Delivery area not found")

    area.is_active = False
    await db.commit()
    await cache_invalidate("delivery_areas:")
    return {"detail": "Delivery area soft deleted successfully"}
