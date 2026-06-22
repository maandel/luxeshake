import hashlib
import os
import time
from typing import Annotated, Any

import httpx
from app.config import settings
from app.database import get_db
from app.dependencies.auth_deps import require_superadmin
from app.models.site_content import SiteContent
from app.schemas.site_content import SiteContentResponse, SiteContentUpdate
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/site-content", tags=["Site Content"])


DEFAULTS = {
    "hero_title": "Luxury in Every Sip & Bite.",
    "hero_subtitle": "Hand-crafted with organic dairy, rare ingredients, and gourmet snacks.",  # noqa: E501
    "hero_image_url": None,
    "hero_image_path": None,
    "about_title": "Crafted for the Connoisseur",
    "about_content": "Every shake and snack we serve is a testament to our dedication to quality. We source the finest vanilla beans, the most decadent chocolates, and the freshest organic dairy to create an experience that transcends the ordinary.\n\nWhether you're treating yourself after a long day or celebrating a special moment, LuxeShake promises a taste of pure elegance.",  # noqa: E501
    "about_image_url_1": None,
    "about_image_path_1": None,
    "about_image_url_2": None,
    "about_image_path_2": None,
    "about_image_url_3": None,
    "about_image_path_3": None,
    "about_stat_1_value": 100,
    "about_stat_1_suffix": "%",
    "about_stat_1_label": "Natural Dairy",
    "about_stat_2_value": 3,
    "about_stat_2_suffix": " min",
    "about_stat_2_label": "Per Batch",
    "about_stat_3_value": 6,
    "about_stat_3_suffix": "+",
    "about_stat_3_label": "Collections",
    "menu_title": "The Menu",
    "menu_subtitle": "Curated collections of our finest offerings. Select your size and add directly to your order.",  # noqa: E501
    "location_title": "Our Sanctuaries",
    "location_subtitle": "Experience LuxeShake in person. Select a location to view operating hours and precise directions.",  # noqa: E501
    "complaints_title": "Concierge & Support",
    "complaints_subtitle": "Our dedicated team is here to ensure your LuxeShake experience is nothing short of perfect.",  # noqa: E501
}

ALL_RESPONSE_FIELDS = list(DEFAULTS.keys())


@router.get("", response_model=SiteContentResponse)
async def get_site_content(db: AsyncSession = Depends(get_db)) -> Any:
    import uuid as _uuid

    try:
        result = await db.execute(select(SiteContent))
        site_content = result.scalars().first()
        if not site_content:
            return {**DEFAULTS, "id": str(_uuid.uuid4())}
        row: dict = {"id": str(site_content.id)}
        for key in ALL_RESPONSE_FIELDS:
            try:
                row[key] = getattr(site_content, key, DEFAULTS.get(key))
            except Exception:
                row[key] = DEFAULTS.get(key)
        return row
    except Exception as exc:
        import logging

        logging.getLogger(__name__).warning("site_content GET fallback: %s", exc)  # noqa: E501
        return {**DEFAULTS, "id": str(_uuid.uuid4())}


@router.put("", response_model=SiteContentResponse)
async def update_site_content(
    content_in: SiteContentUpdate,
    superadmin: Annotated[dict, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SiteContent))
    site_content = result.scalars().first()
    if not site_content:
        site_content = SiteContent()
        db.add(site_content)

    for field, val in content_in.model_dump(exclude_unset=True).items():
        setattr(site_content, field, val)

    await db.commit()
    await db.refresh(site_content)
    return site_content


@router.patch("", response_model=SiteContentResponse)
async def patch_site_content(
    content_in: SiteContentUpdate,
    superadmin: Annotated[dict, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SiteContent))
    site_content = result.scalars().first()
    if not site_content:
        site_content = SiteContent()
        db.add(site_content)

    for field, val in content_in.model_dump(exclude_unset=True).items():
        setattr(site_content, field, val)

    await db.commit()
    await db.refresh(site_content)
    return site_content


@router.post("/image/{section}")
async def upload_site_image(
    section: str,
    superadmin: Annotated[dict, Depends(require_superadmin)],
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if section not in ["hero", "about_1", "about_2", "about_3"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid section. Must be 'hero' or 'about_1', 'about_2', 'about_3'",  # noqa: E501
        )

    result = await db.execute(select(SiteContent))
    site_content = result.scalars().first()
    if not site_content:
        site_content = SiteContent()
        db.add(site_content)
        await db.commit()

    content_type = file.content_type or ""
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if (
        ext not in [".jpg", ".jpeg", ".png", ".webp"]
        or content_type not in allowed_types
    ):
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are supported",
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

                if section == "hero":
                    site_content.hero_image_url = secure_url
                    site_content.hero_image_path = None
                elif section == "about_1":
                    site_content.about_image_url_1 = secure_url
                    site_content.about_image_path_1 = None
                elif section == "about_2":
                    site_content.about_image_url_2 = secure_url
                    site_content.about_image_path_2 = None
                elif section == "about_3":
                    site_content.about_image_url_3 = secure_url
                    site_content.about_image_path_3 = None

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
        site_upload_dir = os.path.join(settings.UPLOAD_DIR, "site_content")
        os.makedirs(site_upload_dir, exist_ok=True)
        filename = f"{section}_image{ext}"
        file_path = os.path.join(site_upload_dir, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        if section == "hero":
            site_content.hero_image_path = f"/static/uploads/site_content/{filename}"  # noqa: E501
            site_content.hero_image_url = None
            ret_path = site_content.hero_image_path
        elif section == "about_1":
            site_content.about_image_path_1 = f"/static/uploads/site_content/{filename}"  # noqa: E501
            site_content.about_image_url_1 = None
            ret_path = site_content.about_image_path_1
        elif section == "about_2":
            site_content.about_image_path_2 = f"/static/uploads/site_content/{filename}"  # noqa: E501
            site_content.about_image_url_2 = None
            ret_path = site_content.about_image_path_2
        elif section == "about_3":
            site_content.about_image_path_3 = f"/static/uploads/site_content/{filename}"  # noqa: E501
            site_content.about_image_url_3 = None
            ret_path = site_content.about_image_path_3

        await db.commit()

        return {
            "detail": "Image uploaded successfully to local storage",
            "image_path": ret_path,
        }
