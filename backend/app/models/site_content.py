import uuid
from app.database import Base
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

class SiteContent(Base):
    __tablename__ = "site_content"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Hero Section
    hero_title: Mapped[str] = mapped_column(String(200), nullable=False)
    hero_subtitle: Mapped[str] = mapped_column(Text, nullable=False)
    hero_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hero_image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # About Section
    about_title: Mapped[str] = mapped_column(String(200), nullable=False)
    about_content: Mapped[str] = mapped_column(Text, nullable=False)
    about_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    about_image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Menu Header
    menu_title: Mapped[str] = mapped_column(String(200), nullable=False)
    menu_subtitle: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Location Header
    location_title: Mapped[str] = mapped_column(String(200), nullable=False)
    location_subtitle: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Complaints Header
    complaints_title: Mapped[str] = mapped_column(String(200), nullable=False)
    complaints_subtitle: Mapped[str] = mapped_column(String(500), nullable=False)
