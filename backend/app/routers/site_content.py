import os
import hashlib
import time
import httpx
from typing import Annotated, Any

from app.config import settings
from app.database import get_db
from app.dependencies.auth_deps import require_superadmin
from app.models.site_content import SiteContent
from app.schemas.site_content import SiteContentResponse, SiteContentUpdate
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/site-content", tags=["Site Content"])


@router.get("", response_model=SiteContentResponse)
async def get_site_content(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(SiteContent))
    site_content = result.scalars().first()
    if not site_content:
        # Fallback in case DB hasn't been seeded somehow
        site_content = SiteContent(
            hero_title="Luxury in Every Sip & Bite.",
            hero_subtitle="Hand-crafted with organic dairy, rare ingredients, and gourmet snacks.",
            about_title="Crafted for the Connoisseur",
            about_content="Every shake and snack we serve is a testament to our dedication to quality.",
            menu_title="The Menu",
            menu_subtitle="Curated collections of our finest offerings. Select your size and add directly to your order.",
            location_title="Our Sanctuaries",
            location_subtitle="Experience LuxeShake in person. Select a location to view operating hours and precise directions.",
            complaints_title="Concierge & Support",
            complaints_subtitle="Our dedicated team is here to ensure your LuxeShake experience is nothing short of perfect."
        )
    return site_content


@router.put("", response_model=SiteContentResponse)
async def update_site_content(
    content_in: SiteContentUpdate,
    superadmin: Annotated[dict, Depends(require_superadmin)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SiteContent))
    site_content = result.scalars().first()
    if not site_content:
        site_content = SiteContent()
        db.add(site_content)
    
    for field, val in content_in.model_dump().items():
        setattr(site_content, field, val)
        
    await db.commit()
    await db.refresh(site_content)
    return site_content


@router.post("/image/{section}")
async def upload_site_image(
    section: str,
    superadmin: Annotated[dict, Depends(require_superadmin)],
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if section not in ["hero", "about_1", "about_2", "about_3"]:
        raise HTTPException(status_code=400, detail="Invalid section. Must be 'hero' or 'about_1', 'about_2', 'about_3'")

    result = await db.execute(select(SiteContent))
    site_content = result.scalars().first()
    if not site_content:
        site_content = SiteContent()
        db.add(site_content)
        await db.commit()

    content_type = file.content_type or ""
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if (ext not in [".jpg", ".jpeg", ".png", ".webp"] or content_type not in allowed_types):
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
        if not all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
            raise HTTPException(status_code=500, detail="Cloudinary storage is enabled but credentials are not configured")

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

        cloudinary_url = f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/image/upload"

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(cloudinary_url, data=data, files=files, timeout=30.0)
                if resp.status_code not in [200, 201]:
                    raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {resp.text}")
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
                raise HTTPException(status_code=500, detail=f"Cloudinary HTTP exception: {str(e)}")
    else:
        site_upload_dir = os.path.join(settings.UPLOAD_DIR, "site_content")
        os.makedirs(site_upload_dir, exist_ok=True)
        filename = f"{section}_image{ext}"
        file_path = os.path.join(site_upload_dir, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        if section == "hero":
            site_content.hero_image_path = f"/static/uploads/site_content/{filename}"
            site_content.hero_image_url = None
            ret_path = site_content.hero_image_path
        elif section == "about_1":
            site_content.about_image_path_1 = f"/static/uploads/site_content/{filename}"
            site_content.about_image_url_1 = None
            ret_path = site_content.about_image_path_1
        elif section == "about_2":
            site_content.about_image_path_2 = f"/static/uploads/site_content/{filename}"
            site_content.about_image_url_2 = None
            ret_path = site_content.about_image_path_2
        elif section == "about_3":
            site_content.about_image_path_3 = f"/static/uploads/site_content/{filename}"
            site_content.about_image_url_3 = None
            ret_path = site_content.about_image_path_3

        await db.commit()

        return {
            "detail": "Image uploaded successfully to local storage",
            "image_path": ret_path,
        }
