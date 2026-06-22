from pydantic import BaseModel
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

class SiteContentUpdate(SiteContentBase):
    pass

class SiteContentResponse(SiteContentBase):
    id: uuid.UUID
    hero_image_url: str | None = None
    hero_image_path: str | None = None
    about_image_url_1: str | None = None
    about_image_path_1: str | None = None
    about_image_url_2: str | None = None
    about_image_path_2: str | None = None
    about_image_url_3: str | None = None
    about_image_path_3: str | None = None

    class Config:
        from_attributes = True
