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
    hero_image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    hero_image_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # About Section
    about_title: Mapped[str] = mapped_column(String(200), nullable=False)
    about_content: Mapped[str] = mapped_column(Text, nullable=False)
    about_image_url_1: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    about_image_path_1: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    about_image_url_2: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    about_image_path_2: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    about_image_url_3: Mapped[str | None] = mapped_column(String(500), nullable=True)
    about_image_path_3: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # About Section - Stats
    about_stat_1_value: Mapped[int] = mapped_column(default=100, nullable=False)
    about_stat_1_suffix: Mapped[str] = mapped_column(String(50), default="%", nullable=False)
    about_stat_1_label: Mapped[str] = mapped_column(String(100), default="Natural Dairy", nullable=False)
    
    about_stat_2_value: Mapped[int] = mapped_column(default=3, nullable=False)
    about_stat_2_suffix: Mapped[str] = mapped_column(String(50), default=" min", nullable=False)
    about_stat_2_label: Mapped[str] = mapped_column(String(100), default="Per Batch", nullable=False)
    
    about_stat_3_value: Mapped[int] = mapped_column(default=6, nullable=False)
    about_stat_3_suffix: Mapped[str] = mapped_column(String(50), default="+", nullable=False)
    about_stat_3_label: Mapped[str] = mapped_column(String(100), default="Collections", nullable=False)

    # Menu Header
    menu_title: Mapped[str] = mapped_column(String(200), nullable=False)
    menu_subtitle: Mapped[str] = mapped_column(String(500), nullable=False)

    # Location Header
    location_title: Mapped[str] = mapped_column(String(200), nullable=False)
    location_subtitle: Mapped[str] = mapped_column(String(500), nullable=False)

    # Complaints Header
    complaints_title: Mapped[str] = mapped_column(String(200), nullable=False)
    complaints_subtitle: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
