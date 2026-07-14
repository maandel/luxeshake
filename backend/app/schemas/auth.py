import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


class TokenData(BaseModel):
    user_id: str | None = None
    role: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=128)


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern="^[0-9]+$")


class PasswordResetRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Enforce password complexity on reset."""
        errors = []
        if not re.search(r"[A-Z]", v):
            errors.append("one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            errors.append("one special character")
        if errors:
            raise ValueError(f"Password must contain at least {', '.join(errors)}")
        return v


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class GoogleAuthPayload(BaseModel):
    """Typed payload for Google OAuth — credential is the Google ID Token JWT."""

    credential: str = Field(
        ..., min_length=50, description="Google ID token from Sign-In button"
    )
