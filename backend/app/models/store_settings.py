import uuid
from app.database import Base
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class StoreSettings(Base):
    __tablename__ = "store_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    pickup_address: Mapped[str] = mapped_column(
        String(500),
        default="LuxeShake Boutique, 12 Presidential Road, Enugu, Nigeria",
        nullable=False,
    )
    pickup_phone: Mapped[str] = mapped_column(
        String(50), default="+234 812 345 6789", nullable=False
    )
