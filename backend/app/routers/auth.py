"""
Authentication router — all endpoints follow industry security standards:
- Google OAuth uses server-side ID Token verification (google-auth library)
- OTP generated with secrets.randbelow() and stored as SHA-256 hash
- Refresh tokens are rotated on every use with family-based reuse detection
- All auth events are audit-logged
- Rate limiting applied via slowapi
"""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.core.audit import (
    EMAIL_VERIFIED,
    GOOGLE_AUTH,
    LOGIN,
    LOGIN_FAILED,
    LOGOUT,
    PASSWORD_RESET_COMPLETE,
    PASSWORD_RESET_REQUESTED,
    REFRESH_TOKEN_REUSE,
    REGISTER,
    audit,
)
from app.core.logging import get_logger, mask_email
from app.database import get_db
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    GoogleAuthPayload,
    LoginRequest,
    OTPRequest,
    OTPVerifyRequest,
    PasswordResetRequest,
    ResendVerificationRequest,
    Token,
)
from app.schemas.user import UserCreate, UserResponse
from app.services.email_service import EmailService
from app.utils.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _generate_otp() -> str:
    """Cryptographically secure 6-digit OTP."""
    return str(secrets.randbelow(1_000_000)).zfill(6)


def _hash_otp(otp: str) -> str:
    """SHA-256 hash for safe DB storage — never store plaintext OTP."""
    return hashlib.sha256(otp.encode()).hexdigest()


def _hash_token(token: str) -> str:
    """SHA-256 hash of a raw token string."""
    return hashlib.sha256(token.encode()).hexdigest()


async def _issue_tokens(
    user: User,
    response: Response,
    db: AsyncSession,
    family_id: uuid.UUID | None = None,
) -> Token:
    """
    Issue a new access + refresh token pair.
    Stores the refresh token hash in the DB for rotation tracking.
    """
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    # Generate a cryptographically secure refresh token
    raw_refresh = secrets.token_urlsafe(48)
    token_hash = _hash_token(raw_refresh)

    # Persist hashed refresh token with a new or carried-over family_id
    rt = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        family_id=family_id or uuid.uuid4(),
        expires_at=datetime.now(UTC)
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    await db.flush()  # get the record into DB within the current transaction

    # Set the raw token in an HttpOnly cookie — never returned in body
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="none",
        secure=True,
    )

    return Token(access_token=access_token, token_type="bearer", role=user.role)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
async def register(
    request: Request,
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func

    email_normalized = user_in.email.lower().strip()

    result = await db.execute(
        select(User).where(func.lower(User.email) == email_normalized)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    verification_token = secrets.token_urlsafe(32)
    new_user = User(
        email=email_normalized,
        full_name=user_in.full_name,
        password_hash=get_password_hash(user_in.password),
        role="customer",
        is_email_verified=False,
        email_verification_token=verification_token,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Link any guest orders placed with this email before registration
    from app.models.order import Order

    await db.execute(
        update(Order)
        .where(
            func.lower(Order.customer_email) == email_normalized,
            Order.user_id.is_(None),
        )
        .values(user_id=new_user.id)
    )

    await audit(
        db,
        REGISTER,
        user_id=new_user.id,
        ip_address=request.client.host if request.client else None,
        metadata={"email": mask_email(email_normalized)},
    )
    await db.commit()

    background_tasks.add_task(
        EmailService.send_verification_email,
        email=new_user.email,
        token=verification_token,
    )

    return new_user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    login_in: LoginRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func

    email_normalized = login_in.email.lower().strip()

    result = await db.execute(
        select(User).where(func.lower(User.email) == email_normalized)
    )
    user = result.scalars().first()

    if (
        not user
        or not user.password_hash
        or not verify_password(login_in.password, user.password_hash)
    ):
        # Audit failed login without exposing whether the email exists
        await audit(
            db,
            LOGIN_FAILED,
            ip_address=request.client.host if request.client else None,
            metadata={"email": mask_email(email_normalized)},
        )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="User account is deactivated",
        )

    if not user.is_email_verified:
        # Regenerate verification token on each login attempt for unverified users
        user.email_verification_token = secrets.token_urlsafe(32)
        await db.commit()
        background_tasks.add_task(
            EmailService.send_verification_email,
            email=user.email,
            token=user.email_verification_token,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "msg": "Email not verified. We've automatically sent a new verification link to your email.",  # noqa: E501
                "code": "UNVERIFIED_EMAIL",
            },
        )

    user.last_login = datetime.now(UTC)

    token = await _issue_tokens(user, response, db)

    await audit(
        db,
        LOGIN,
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        metadata={"email": mask_email(email_normalized)},
    )
    await db.commit()

    return token


@router.post("/refresh", response_model=Token)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Rotate the refresh token.
    - Validate the incoming token exists and is not revoked.
    - If a REVOKED token is presented → reuse detected → revoke entire family.
    - Issue a new token pair and revoke the old token.
    """
    raw_token = request.cookies.get("refresh_token")
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    token_hash = _hash_token(raw_token)

    # Look up the token by hash
    rt_res = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    rt = rt_res.scalars().first()

    if not rt:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Reuse detection — if this token is already revoked, invalidate the whole family
    if rt.is_revoked:
        await audit(
            db,
            REFRESH_TOKEN_REUSE,
            user_id=rt.user_id,
            ip_address=request.client.host if request.client else None,
        )
        # Revoke all tokens in the family
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == rt.family_id)
            .values(is_revoked=True)
        )
        await db.commit()
        # Clear the cookie
        response.delete_cookie("refresh_token", samesite="none", secure=True)
        raise HTTPException(
            status_code=401,
            detail="Refresh token reuse detected. All sessions invalidated for security.",
        )

    # Check expiry
    if rt.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    # Fetch the user
    user_res = await db.execute(select(User).where(User.id == rt.user_id))
    user = user_res.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Revoke the consumed token (rotation)
    rt.is_revoked = True

    # Issue a new pair, carrying the same family_id for chain tracking
    token = await _issue_tokens(user, response, db, family_id=rt.family_id)
    await db.commit()

    return token


@router.post("/logout")
async def logout(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
):
    """Revoke the current refresh token and clear the cookie."""
    raw_token = request.cookies.get("refresh_token")
    if raw_token:
        token_hash = _hash_token(raw_token)
        rt_res = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        rt = rt_res.scalars().first()
        if rt:
            rt.is_revoked = True
            await audit(
                db,
                LOGOUT,
                user_id=rt.user_id,
                ip_address=request.client.host if request.client else None,
            )
            await db.commit()

    response.delete_cookie("refresh_token", samesite="none", secure=True)
    return {"detail": "Successfully logged out"}


@router.get("/verify-email/{token}")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.email_verification_token == token)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=400, detail="Invalid or expired verification token"
        )

    user.is_email_verified = True
    user.email_verification_token = None
    await audit(db, EMAIL_VERIFIED, user_id=user.id)
    await db.commit()

    return {"detail": "Email verified successfully"}


@router.post("/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(
    request: Request,
    req: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func

    email_normalized = req.email.lower().strip()

    result = await db.execute(
        select(User).where(func.lower(User.email) == email_normalized)
    )
    user = result.scalars().first()

    if user and not user.is_email_verified:
        user.email_verification_token = secrets.token_urlsafe(32)
        await db.commit()
        background_tasks.add_task(
            EmailService.send_verification_email,
            email=user.email,
            token=user.email_verification_token,
        )

    # Always return same response to prevent email enumeration
    return {
        "detail": "If your email is registered and unverified, a new verification link has been sent."
    }


@router.post("/forgot-password-request")
@limiter.limit("3/minute")
async def forgot_password_request(
    request: Request,
    otp_req: OTPRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func

    email_normalized = otp_req.email.lower().strip()

    result = await db.execute(
        select(User).where(func.lower(User.email) == email_normalized)
    )
    user = result.scalars().first()

    if user and user.is_active:
        otp = _generate_otp()  # Cryptographically secure
        user.password_reset_otp = _hash_otp(otp)  # Store hash, not plaintext
        user.password_reset_otp_expires = datetime.now(UTC) + timedelta(minutes=15)
        await audit(
            db,
            PASSWORD_RESET_REQUESTED,
            user_id=user.id,
            ip_address=request.client.host if request.client else None,
            metadata={"email": mask_email(email_normalized)},
        )
        await db.commit()

        background_tasks.add_task(
            EmailService.send_password_reset_otp, email=user.email, otp=otp
        )

    # Always return same response to prevent email enumeration
    return {"detail": "If the email is registered, a 6-digit OTP has been sent."}


@router.post("/forgot-password-verify")
@limiter.limit("5/minute")
async def forgot_password_verify(
    request: Request,
    verify_req: OTPVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func

    email_normalized = verify_req.email.lower().strip()

    result = await db.execute(
        select(User).where(func.lower(User.email) == email_normalized)
    )
    user = result.scalars().first()

    otp_hash = _hash_otp(verify_req.otp)

    if (
        not user
        or not user.password_reset_otp
        or not secrets.compare_digest(
            user.password_reset_otp, otp_hash
        )  # Constant-time compare
    ):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.password_reset_otp_expires and user.password_reset_otp_expires.replace(
        tzinfo=UTC
    ) < datetime.now(UTC):
        raise HTTPException(status_code=400, detail="OTP has expired")

    # Issue a short-lived reset token
    reset_token = create_access_token(
        data={"sub": str(user.id), "reset": True},
        expires_delta=timedelta(minutes=10),
    )

    # Consume the OTP immediately (single-use)
    user.password_reset_otp = None
    user.password_reset_otp_expires = None
    await db.commit()

    return {"reset_token": reset_token}


@router.post("/forgot-password-reset")
@limiter.limit("5/minute")
async def forgot_password_reset(
    request: Request,
    reset_req: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = jwt.decode(
            reset_req.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id = payload.get("sub")
        if not user_id or not payload.get("reset"):
            raise HTTPException(status_code=400, detail="Invalid reset token")
    except JWTError:
        raise HTTPException(
            status_code=400,
            detail="Reset token expired or invalid",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="User not found or inactive",
        )

    user.password_hash = get_password_hash(reset_req.new_password)
    await audit(
        db,
        PASSWORD_RESET_COMPLETE,
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return {"detail": "Password has been reset successfully"}


@router.post("/google")
@limiter.limit("10/minute")
async def google_auth(
    request: Request,
    payload: GoogleAuthPayload,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Google OAuth via ID Token.
    The frontend sends the `credential` string from Google's Sign-In button.
    We verify it server-side with Google's public keys — no client data is trusted.
    """
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        id_info = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.ACTIVE_GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        logger.warning("google_token_invalid", error=str(exc))
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired Google credential",
        )

    email = id_info.get("email", "").lower().strip()
    google_id = id_info.get("sub")
    full_name = id_info.get("name", "Google User")
    email_verified = id_info.get("email_verified", False)

    if not email or not google_id or not email_verified:
        raise HTTPException(
            status_code=400,
            detail="Google account does not have a verified email",
        )

    from sqlalchemy import func

    # Try to find existing user by google_id first, then by email
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalars().first()

    if not user:
        result_email = await db.execute(
            select(User).where(func.lower(User.email) == email)
        )
        user = result_email.scalars().first()
        if user:
            user.google_id = google_id
            user.is_email_verified = True
        else:
            user = User(
                email=email,
                full_name=full_name,
                google_id=google_id,
                role="customer",
                is_email_verified=True,
                is_active=True,
            )
            db.add(user)
        await db.flush()

        # Link any guest orders
        from app.models.order import Order

        await db.execute(
            update(Order)
            .where(
                func.lower(Order.customer_email) == email,
                Order.user_id.is_(None),
            )
            .values(user_id=user.id)
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    token = await _issue_tokens(user, response, db)
    await audit(
        db,
        GOOGLE_AUTH,
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        metadata={"email": mask_email(email)},
    )
    await db.commit()

    return token
