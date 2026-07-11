from pydantic import BaseModel, EmailStr, Field


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


class ResendVerificationRequest(BaseModel):
    email: EmailStr
