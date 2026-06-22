from pydantic import BaseModel
from typing import Optional
import uuid

class SiteContentBase(BaseModel):
    hero_title: str
    hero_subtitle: str
    about_title: str
    about_content: str
    about_stat_1_value: int = 100
    about_stat_1_suffix: str = "%"
    about_stat_1_label: str = "Natural Dairy"
    about_stat_2_value: int = 3
    about_stat_2_suffix: str = " min"
    about_stat_2_label: str = "Per Batch"
    about_stat_3_value: int = 6
    about_stat_3_suffix: str = "+"
    about_stat_3_label: str = "Collections"
    menu_title: str
    menu_subtitle: str
    location_title: str
    location_subtitle: str
    complaints_title: str
    complaints_subtitle: str


class SiteContentUpdate(BaseModel):
    """All fields optional — only fields sent in the request body will be updated."""
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    about_title: Optional[str] = None
    about_content: Optional[str] = None
    about_stat_1_value: Optional[int] = None
    about_stat_1_suffix: Optional[str] = None
    about_stat_1_label: Optional[str] = None
    about_stat_2_value: Optional[int] = None
    about_stat_2_suffix: Optional[str] = None
    about_stat_2_label: Optional[str] = None
    about_stat_3_value: Optional[int] = None
    about_stat_3_suffix: Optional[str] = None
    about_stat_3_label: Optional[str] = None
    menu_title: Optional[str] = None
    menu_subtitle: Optional[str] = None
    location_title: Optional[str] = None
    location_subtitle: Optional[str] = None
    complaints_title: Optional[str] = None
    complaints_subtitle: Optional[str] = None


class SiteContentResponse(SiteContentBase):
    id: uuid.UUID
    hero_image_url: Optional[str] = None
    hero_image_path: Optional[str] = None
    about_image_url_1: Optional[str] = None
    about_image_path_1: Optional[str] = None
    about_image_url_2: Optional[str] = None
    about_image_path_2: Optional[str] = None
    about_image_url_3: Optional[str] = None
    about_image_path_3: Optional[str] = None

    class Config:
        from_attributes = True
