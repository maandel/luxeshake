from app.database import Base, engine
from app.models.delivery_area import DeliveryArea
from app.models.product import Category, Product
from app.models.user import User
from app.models.site_content import SiteContent
from app.utils.security import get_password_hash
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text(
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(50);"  # noqa: E501
            )
        )  # noqa: E501
        await conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT FALSE;"  # noqa: E501
            )
        )  # noqa: E501


async def seed_db(db: AsyncSession):
    user_count_result = await db.execute(select(User))
    if user_count_result.scalars().first() is not None:
        return

    result = await db.execute(select(User).filter(User.email == "admin@luxeshake.com"))  # noqa: E501
    admin = result.scalars().first()
    if not admin:
        admin = User(
            email="admin@luxeshake.com",
            full_name="LuxeAdmin",
            password_hash=get_password_hash("adminpassword123"),
            role="superadmin",
            is_active=True,
            is_email_verified=True,
        )
        db.add(admin)
        await db.flush()

    from app.models.store_settings import StoreSettings

    result = await db.execute(select(StoreSettings))
    settings = result.scalars().first()
    if not settings:
        settings = StoreSettings(
            pickup_address="LuxeShake Boutique, 12 Presidential Road, Enugu, Nigeria",  # noqa: E501
            pickup_phone="+234 812 345 6789",
        )
        db.add(settings)
        await db.flush()

    result = await db.execute(select(Category))
    categories = result.scalars().all()

    cat_map = {}
    if not categories:
        cats = [
            Category(
                name="signature_shakes",
                display_name="Signature Shakes",
                sort_order=1,
                is_active=True,
            ),
            Category(
                name="seasonal_pairings",
                display_name="Seasonal Pairings",
                sort_order=2,
                is_active=True,
            ),
            Category(
                name="apothecary",
                display_name="Apothecary",
                sort_order=3,
                is_active=True,
            ),
        ]
        for c in cats:
            db.add(c)
        await db.flush()
        for c in cats:
            cat_map[c.name] = c.id
    else:
        for c in categories:
            cat_map[c.name] = c.id

    result = await db.execute(select(Product))
    products = result.scalars().all()
    if not products:
        default_products = [
            Product(
                name="Classic Chocolate",
                description="Rich, velvety chocolate topped with "
                "fresh whipped cream and chocolate shavings.",  # noqa: E501
                category_id=cat_map["signature_shakes"],
                tag="Signature",
                small_price=2000,
                big_price=3000,
                image_url="https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600",  # noqa: E501
                is_active=True,
                sort_order=1,
            ),
            Product(
                name="Strawberry Dream",
                description="Sweet, ripe strawberries blended with fresh milk and premium vanilla ice cream.",  # noqa: E501
                category_id=cat_map["signature_shakes"],
                tag="Classic",
                small_price=2000,
                big_price=3000,
                image_url="https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=600",  # noqa: E501
                is_active=True,
                sort_order=2,
            ),
            Product(
                name="Banana Cream",
                description="Creamy banana shake blended with rich vanilla ice cream and a touch of honey.",  # noqa: E501
                category_id=cat_map["seasonal_pairings"],
                tag="Seasonal",
                small_price=2000,
                big_price=3000,
                image_url="https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=600",  # noqa: E501
                is_active=True,
                sort_order=3,
            ),
            Product(
                name="Vanilla Classic",
                description="Smooth, timeless vanilla shake made from authentic Madagascar vanilla beans.",  # noqa: E501
                category_id=cat_map["signature_shakes"],
                tag="Classic",
                small_price=2000,
                big_price=3000,
                image_url="https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600",  # noqa: E501
                is_active=True,
                sort_order=4,
            ),
            Product(
                name="Mixed Fruit Smoothie",
                description="A healthy blend of strawberries, blueberries, bananas, and yogurt.",  # noqa: E501
                category_id=cat_map["apothecary"],
                tag="Wellness",
                small_price=2000,
                big_price=3000,
                image_url="https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=600",  # noqa: E501
                is_active=True,
                sort_order=5,
            ),
            Product(
                name="Beetroot Elixir",
                description="Organic beetroot with fresh ginger, lemon, and apples for a daily detox.",  # noqa: E501
                category_id=cat_map["apothecary"],
                tag="Detox",
                small_price=2000,
                big_price=3000,
                image_url="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=600",  # noqa: E501
                is_active=True,
                sort_order=6,
            ),
        ]
        for p in default_products:
            db.add(p)

    result = await db.execute(select(DeliveryArea))
    delivery_areas = result.scalars().all()
    if not delivery_areas:
        default_delivery = [
            DeliveryArea(name="Ikeja", fee=500, is_active=True, sort_order=1),
            DeliveryArea(name="Lekki Phase 1", fee=1000, is_active=True, sort_order=2),  # noqa: E501
            DeliveryArea(
                name="Victoria Island", fee=1000, is_active=True, sort_order=3
            ),  # noqa: E501
            DeliveryArea(name="Ikoyi", fee=1000, is_active=True, sort_order=4),  # noqa: E501
            DeliveryArea(name="Surulere", fee=700, is_active=True, sort_order=5),  # noqa: E501
        ]
        for d in default_delivery:
            db.add(d)

    result = await db.execute(select(SiteContent))
    site_content = result.scalars().first()
    if not site_content:
        default_content = SiteContent(
            hero_title="Luxury in Every Sip & Bite.",
            hero_subtitle="Hand-crafted with organic dairy, rare ingredients, and gourmet snacks.",
            hero_image_url="https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=1800&auto=format&fit=crop",
            about_title="Crafted for the Connoisseur",
            about_content="Every shake and snack we serve is a testament to our dedication to quality. We source the finest vanilla beans, the most decadent chocolates, and the freshest organic dairy to create an experience that transcends the ordinary.\n\nWhether you're treating yourself after a long day or celebrating a special moment, LuxeShake promises a taste of pure elegance.",
            about_image_url_1="https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800",
            about_image_url_2="https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=800",
            about_image_url_3="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800",
            about_stat_1_value=100,
            about_stat_1_suffix="%",
            about_stat_1_label="Natural Dairy",
            about_stat_2_value=3,
            about_stat_2_suffix=" min",
            about_stat_2_label="Per Batch",
            about_stat_3_value=6,
            about_stat_3_suffix="+",
            about_stat_3_label="Collections",
            menu_title="The Menu",
            menu_subtitle="Curated collections of our finest offerings. Select your size and add directly to your order.",
            location_title="Our Sanctuaries",
            location_subtitle="Experience LuxeShake in person. Select a location to view operating hours and precise directions.",
            complaints_title="Concierge & Support",
            complaints_subtitle="Our dedicated team is here to ensure your LuxeShake experience is nothing short of perfect."
        )
        db.add(default_content)

    await db.commit()
