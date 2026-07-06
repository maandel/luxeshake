import os
import uuid
from typing import Annotated

from app.config import settings
from app.database import get_db
from app.dependencies.auth_deps import require_manager_or_above
from app.models.product import Category, Product
from app.schemas.product import (
    CategoryCreate,
    CategoryResponse,
    ProductCreate,
    ProductResponse,
)
from app.services.cache import cache_get, cache_invalidate, cache_set
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter(tags=["Products & Categories"])

_PRODUCTS_TTL = 60
_CATEGORIES_TTL = 120


@router.get("/products", response_model=list[ProductResponse])
async def list_products(
    response: Response,
    category_name: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"products:{category_name or 'all'}"
    cached = await cache_get(cache_key)
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        return cached
    query = (
        select(Product).options(selectinload(Product.category)).where(Product.is_active)  # noqa: E501
    )
    if category_name:
        query = query.join(Category).where(Category.name == category_name.lower())  # noqa: E501
    query = query.order_by(Product.sort_order)
    result = await db.execute(query)
    products = result.scalars().all()
    await cache_set(cache_key, products, _PRODUCTS_TTL)
    response.headers["X-Cache"] = "MISS"
    return products


@router.get("/products/{id}", response_model=ProductResponse)
async def get_product(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == id, Product.is_active)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(response: Response, db: AsyncSession = Depends(get_db)):  # noqa: E501
    cached = await cache_get("categories:all")
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        return cached
    result = await db.execute(
        select(Category).where(Category.is_active).order_by(Category.sort_order)  # noqa: E501
    )
    cats = result.scalars().all()
    await cache_set("categories:all", cats, _CATEGORIES_TTL)
    response.headers["X-Cache"] = "MISS"
    return cats


@router.get("/admin/products", response_model=list[ProductResponse])
async def admin_list_products(
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .order_by(Product.sort_order)
    )
    return result.scalars().all()


@router.post(
    "/admin/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_product(
    product_in: ProductCreate,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    cat_res = await db.execute(
        select(Category).where(Category.id == product_in.category_id)
    )
    if not cat_res.scalars().first():
        raise HTTPException(status_code=400, detail="Invalid category ID")

    new_product = Product(**product_in.model_dump())
    db.add(new_product)
    await db.commit()
    
    # Refetch with category to satisfy ProductResponse
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == new_product.id)
    )
    loaded_product = result.scalars().first()
    
    await cache_invalidate("products:")
    return loaded_product


@router.put("/admin/products/{id}", response_model=ProductResponse)
async def admin_update_product(
    id: uuid.UUID,
    product_in: ProductCreate,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cat_res = await db.execute(
        select(Category).where(Category.id == product_in.category_id)
    )
    if not cat_res.scalars().first():
        raise HTTPException(status_code=400, detail="Invalid category ID")

    for field, val in product_in.model_dump().items():
        setattr(product, field, val)

    await db.commit()
    await db.refresh(product)
    await cache_invalidate("products:")
    return product


@router.delete("/admin/products/{id}")
async def admin_delete_product(
    id: uuid.UUID,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False
    await db.commit()
    await cache_invalidate("products:")
    return {"detail": "Product soft deleted successfully"}


@router.post("/admin/products/{id}/image")
async def admin_upload_image(
    id: uuid.UUID,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    content_type = file.content_type or ""
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    ext = os.path.splitext(file.filename)[1].lower()
    if (
        ext not in [".jpg", ".jpeg", ".png", ".webp", ".avif"]
        or content_type not in allowed_types
    ):
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WebP, and AVIF images are supported",
        )

    try:
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        if size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds maximum limit of 5MB",
            )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not determine file size",
        )

    if settings.STORAGE_BACKEND == "cloudinary":
        if not all(
            [
                settings.CLOUDINARY_CLOUD_NAME,
                settings.CLOUDINARY_API_KEY,
                settings.CLOUDINARY_API_SECRET,
            ]
        ):
            raise HTTPException(
                status_code=500,
                detail="Cloudinary storage is enabled but credentials are not configured",  # noqa: E501
            )

        import hashlib
        import time

        import httpx

        file_content = await file.read()

        timestamp = int(time.time())
        params_to_sign = f"folder=luxeshake&timestamp={timestamp}"
        signature = hashlib.sha1(
            (params_to_sign + settings.CLOUDINARY_API_SECRET).encode("utf-8")
        ).hexdigest()

        files = {"file": (file.filename, file_content, file.content_type)}
        data = {
            "api_key": settings.CLOUDINARY_API_KEY,
            "timestamp": timestamp,
            "signature": signature,
            "folder": "luxeshake",
        }

        cloudinary_url = f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/image/upload"  # noqa: E501

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    cloudinary_url, data=data, files=files, timeout=30.0
                )
                if resp.status_code not in [200, 201]:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Cloudinary upload failed: {resp.text}",  # noqa: E501
                    )
                resp_json = resp.json()
                secure_url = resp_json.get("secure_url")

                product.image_url = secure_url
                product.image_path = None
                await db.commit()
                return {
                    "detail": "Image uploaded to Cloudinary successfully",
                    "image_url": secure_url,
                }
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Cloudinary HTTP exception: {str(e)}",  # noqa: E501
                )
    else:
        prod_upload_dir = os.path.join(settings.UPLOAD_DIR, str(product.id))
        os.makedirs(prod_upload_dir, exist_ok=True)
        filename = f"image{ext}"
        file_path = os.path.join(prod_upload_dir, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        product.image_path = f"/static/uploads/{product.id}/{filename}"
        product.image_url = None
        await db.commit()

        return {
            "detail": "Image uploaded successfully to local storage",
            "image_path": product.image_path,
        }


@router.get("/admin/categories", response_model=list[CategoryResponse])
async def admin_list_categories(
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Category).order_by(Category.sort_order))
    return result.scalars().all()


@router.post(
    "/admin/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_category(
    cat_in: CategoryCreate,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    new_cat = Category(**cat_in.model_dump())
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    await cache_invalidate("categories:")
    await cache_invalidate("products:")
    return new_cat


@router.put("/admin/categories/{id}", response_model=CategoryResponse)
async def admin_update_category(
    id: uuid.UUID,
    cat_in: CategoryCreate,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Category).where(Category.id == id))
    cat = result.scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    for field, val in cat_in.model_dump().items():
        setattr(cat, field, val)

    await db.commit()
    await db.refresh(cat)
    await cache_invalidate("categories:")
    await cache_invalidate("products:")
    return cat


@router.delete("/admin/categories/{id}")
async def admin_delete_category(
    id: uuid.UUID,
    manager: Annotated[dict, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Category).where(Category.id == id))
    cat = result.scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    cat.is_active = False
    await db.commit()
    await cache_invalidate("categories:")
    await cache_invalidate("products:")
    return {"detail": "Category soft deleted successfully"}
