import random
import string
import uuid
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    OTPRequest,
    OTPVerifyRequest,
    PasswordResetRequest,
    Token,
)
from app.schemas.user import UserCreate, UserResponse
from app.services.email_service import EmailService
from app.utils.security import (
    create_access_token,
    create_refresh_token,
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
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    email_normalized = user_in.email.lower().strip()

    from sqlalchemy import func

    result = await db.execute(
        select(User).where(func.lower(User.email) == email_normalized)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    verification_token = str(uuid.uuid4())
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

    from app.models.order import Order
    from sqlalchemy import update

    await db.execute(
        update(Order)
        .where(
            func.lower(Order.customer_email) == email_normalized,
            Order.user_id.is_(None),
        )
        .values(user_id=new_user.id)
    )
    await db.commit()

    background_tasks.add_task(
        EmailService.send_verification_email,
        email=new_user.email,
        token=verification_token,
    )

    return new_user


@router.post("/login", response_model=Token)
async def login(
    login_in: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    email_normalized = login_in.email.lower().strip()
    from sqlalchemy import func

    result = await db.execute(
        select(User).where(func.lower(User.email) == email_normalized)
    )
    user = result.scalars().first()

    if (
        not user
        or not user.password_hash
        or not verify_password(login_in.password, user.password_hash)
    ):
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

    user.last_login = datetime.now(UTC)
    await db.commit()

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
        }
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="none",
        secure=True,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
    )


@router.post("/refresh", response_model=Token)
async def refresh(
    request: Request, db: AsyncSession = Depends(get_db)
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    try:
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id or not payload.get("refresh"):
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token",
            )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="User not found or inactive",
        )

    new_access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )

    return Token(
        access_token=new_access_token,
        token_type="bearer",
        role=user.role,
    )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        "refresh_token",
        samesite="none",
        secure=True,
    )
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
    await db.commit()

    return {"detail": "Email verified successfully"}


@router.post("/forgot-password-request")
async def forgot_password_request(
    otp_req: OTPRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    email_normalized = otp_req.email.lower().strip()
    from sqlalchemy import func

    result = await db.execute(
        select(User).where(func.lower(User.email) == email_normalized)
    )
    user = result.scalars().first()

    if user and user.is_active:
        otp = generate_otp()
        user.password_reset_otp = otp
        user.password_reset_otp_expires = datetime.now(UTC) + timedelta(minutes=15)  # noqa: E501
        await db.commit()

        background_tasks.add_task(
            EmailService.send_password_reset_otp, email=user.email, otp=otp
        )

    return {"detail": "If the email is registered, a 6-digit OTP has been sent."}  # noqa: E501


@router.post("/forgot-password-verify")
async def forgot_password_verify(
    verify_req: OTPVerifyRequest, db: AsyncSession = Depends(get_db)
):
    email_normalized = verify_req.email.lower().strip()
    from sqlalchemy import func

    result = await db.execute(
        select(User).where(func.lower(User.email) == email_normalized)
    )
    user = result.scalars().first()

    if (
        not user
        or not user.password_reset_otp
        or user.password_reset_otp != verify_req.otp
    ):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.password_reset_otp_expires and user.password_reset_otp_expires.replace(  # noqa: E501
        tzinfo=UTC
    ) < datetime.now(UTC):
        raise HTTPException(status_code=400, detail="OTP has expired")

    reset_token = create_access_token(
        data={"sub": str(user.id), "reset": True},
        expires_delta=timedelta(minutes=10),
    )

    user.password_reset_otp = None
    user.password_reset_otp_expires = None
    await db.commit()

    return {"reset_token": reset_token}


@router.post("/forgot-password-reset")
async def forgot_password_reset(
    reset_req: PasswordResetRequest, db: AsyncSession = Depends(get_db)
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
    await db.commit()

    return {"detail": "Password has been reset successfully"}


@router.post("/google")
async def google_auth(
    code_req: dict, response: Response, db: AsyncSession = Depends(get_db)
):
    email = code_req.get("email")
    if email:
        email = email.lower().strip()
    google_id = code_req.get("google_id")
    full_name = code_req.get("name", "Google User")

    if not email or not google_id:
        raise HTTPException(
            status_code=400,
            detail="Missing Google auth attributes",
        )

    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalars().first()

    if not user:
        from sqlalchemy import func

        result_email = await db.execute(
            select(User).where(func.lower(User.email) == email)
        )
        user = result_email.scalars().first()
        if user:
            user.google_id = google_id
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
        await db.commit()
        await db.refresh(user)

        from app.models.order import Order
        from sqlalchemy import update

        await db.execute(
            update(Order)
            .where(
                func.lower(Order.customer_email) == email,
                Order.user_id.is_(None),
            )
            .values(user_id=user.id)
        )
        await db.commit()

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
        }
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="none",
        secure=True,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
    )
