from pydantic import BaseModel
import uuid

class SiteContentBase(BaseModel):
    hero_title: str
    hero_subtitle: str
    about_title: str
    about_content: str
    menu_title: str
    menu_subtitle: str
    location_title: str
    location_subtitle: str
    complaints_title: str
    complaints_subtitle: str

class SiteContentUpdate(SiteContentBase):
    pass

class SiteContentResponse(SiteContentBase):
    id: uuid.UUID
    hero_image_url: str | None = None
    hero_image_path: str | None = None
    about_image_url: str | None = None
    about_image_path: str | None = None

    class Config:
        from_attributes = True
