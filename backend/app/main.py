import os
import warnings
from contextlib import asynccontextmanager

from app.config import settings
from app.core.errors import (
    AppError,
    SecurityHeadersMiddleware,
    app_error_handler,
    validation_error_handler,
)
from app.core.logging import configure_logging
from app.db_init import init_db
from app.routers import (
    admin,
    auth,
    complaints,
    delivery_areas,
    orders,
    products,
    site_content,
    transactions,
    users,
)
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

# Configure structured logging before everything else
configure_logging()

# Production safety warnings
if settings.STORAGE_BACKEND != "cloudinary":
    warnings.warn(
        "⚠️  LOCAL storage backend is in use. "
        "Set STORAGE_BACKEND=cloudinary for production deployments.",
        stacklevel=1,
    )

if settings.PAYSTACK_SECRET_KEY == "sk_test_mock_secret_key":
    warnings.warn(
        "⚠️  Paystack mock key detected — payments will NOT be processed. "
        "Set PAYSTACK_SECRET_KEY in your .env file.",
        stacklevel=1,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Full-stack LuxeShake Ordering System API",
    version="1.0.0",
    lifespan=lifespan,
    # Disable default exception detail leak in production
    docs_url="/api/docs",
    redoc_url=None,
)

# --- Rate limiting ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS (explicit allowlist only) ---
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
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

# --- Security headers (outermost middleware — applied to ALL responses) ---
app.add_middleware(SecurityHeadersMiddleware)

# --- Exception handlers ---
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all so that unhandled 500s still include CORS headers and don't leak internals."""
    from app.core.logging import get_logger

    log = get_logger("app.errors")
    log.exception("unhandled_server_error", path=str(request.url), error=str(exc))

    origin = request.headers.get("origin", "")
    headers = {}
    if origin in allowed_origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal server error occurred.",
            }
        },
        headers=headers,
    )


# --- Static files ---
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount(
    "/static/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads",
)

# --- Routers ---
api_version = "/api/v1"
app.include_router(auth.router, prefix=api_version)
app.include_router(users.router, prefix=api_version)
app.include_router(products.router, prefix=api_version)
app.include_router(delivery_areas.router, prefix=api_version)
app.include_router(orders.router, prefix=api_version)
app.include_router(complaints.router, prefix=api_version)
app.include_router(transactions.router, prefix=api_version)
app.include_router(admin.router, prefix=api_version)
app.include_router(site_content.router, prefix=api_version)


# --- System endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to LuxeShake Premium Drinks API"}


@app.get("/health", tags=["System"])
async def health_check():
    """Health check — verifies DB connectivity. Used by load balancers and monitoring."""
    from app.database import engine

    checks: dict = {"status": "ok"}
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = "error"
        checks["status"] = "degraded"
        checks["detail"] = str(e)
        return JSONResponse(status_code=503, content=checks)
    return checks


@app.get("/ready", tags=["System"])
async def readiness():
    """Kubernetes readiness probe — returns 200 when the app is ready to accept traffic."""
    return {"status": "ready"}
