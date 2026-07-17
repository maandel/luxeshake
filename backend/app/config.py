from pydantic import EmailStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[".env", "../.env"], env_file_encoding="utf-8", extra="ignore"
    )

    APP_NAME: str = "LuxeShake"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/luxeshake"
    )

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    # Optional: explicit cookie domain override (e.g. ".mandell.tech" for cross-subdomain).
    # If not set, it is derived automatically from FRONTEND_URL.
    COOKIE_DOMAIN: str = ""

    @property
    def ACTIVE_COOKIE_DOMAIN(self) -> "str | None":
        """Return the shared parent domain for cross-subdomain cookies, or None for localhost."""
        if self.COOKIE_DOMAIN:
            return self.COOKIE_DOMAIN
        try:
            from urllib.parse import urlparse

            host = urlparse(self.FRONTEND_URL).hostname or ""
            # Only set a domain for real TLDs (not localhost / IPs)
            if host and "." in host and not host.replace(".", "").isdigit():
                parts = host.split(".")
                # Use the last two parts: mandell.tech → .mandell.tech
                return "." + ".".join(parts[-2:])
        except Exception:
            pass
        return None

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    @property
    def ACTIVE_GOOGLE_CLIENT_ID(self) -> str:
        return self.NEXT_PUBLIC_GOOGLE_CLIENT_ID or self.GOOGLE_CLIENT_ID

    # Email (Brevo/SMTP)
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: EmailStr = "noreply@luxeshake.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp-relay.brevo.com"
    MAIL_FROM_NAME: str = "LuxeShake"
    BREVO_API_KEY: str = ""

    # Business email for order notifications
    ADMIN_EMAIL: str = "orders@luxeshake.com"

    # Paystack
    PAYSTACK_SECRET_KEY: str = "sk_test_mock_secret_key"
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: str = "pk_test_mock_public_key"

    # File Storage
    STORAGE_BACKEND: str = "local"
    UPLOAD_DIR: str = "./uploads"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        """Fail fast if critical secrets are missing or too weak."""
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters. "
                'Generate one with: python -c "import secrets; print(secrets.token_hex(32))"'
            )
        return self


settings = Settings()
