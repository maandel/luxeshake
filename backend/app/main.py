import os
from contextlib import asynccontextmanager

from app.config import settings
from app.database import SessionLocal
from app.db_init import init_db, seed_db
from app.routers import (
    admin,
    auth,
    complaints,
    delivery_areas,
    orders,
    products,
    transactions,
    users,
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    async with SessionLocal() as db:
        await seed_db(db)

    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Full-stack LuxeShake Ordering System API",
    version="1.0.0",
    lifespan=lifespan,
)

frontend_origin = settings.FRONTEND_URL.rstrip("/")
allowed_origins = [
    frontend_origin,
    f"{frontend_origin}/",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app.mount(
    "/static/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads",
)

api_version = "/api/v1"
app.include_router(auth.router, prefix=api_version)
app.include_router(users.router, prefix=api_version)
app.include_router(products.router, prefix=api_version)
app.include_router(delivery_areas.router, prefix=api_version)
app.include_router(orders.router, prefix=api_version)
app.include_router(complaints.router, prefix=api_version)
app.include_router(transactions.router, prefix=api_version)
app.include_router(admin.router, prefix=api_version)


@app.get("/")
def read_root():
    return {"message": "Welcome to LuxeShake Premium Drinks API"}
