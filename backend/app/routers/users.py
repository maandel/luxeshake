import secrets
from typing import Annotated

from app.database import get_db
from app.dependencies.auth_deps import (
    get_current_active_user,
    get_current_active_user_basic,
)
from app.models.user import User
from app.schemas.user import PasswordUpdate, UserResponse, UserUpdate
from app.utils.security import get_password_hash, verify_password
from app.services.email_service import EmailService
from app.core.logging import get_logger, mask_email
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[
        User,
        Depends(get_current_active_user_basic),
    ],
):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    update_in: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    if update_in.full_name is not None:
        current_user.full_name = update_in.full_name

    if update_in.email is not None:
        new_email = update_in.email.lower().strip()
        if new_email != current_user.email.lower():
            # Email change requires re-verification to prevent account takeover
            current_user.email = new_email
            current_user.is_email_verified = False
            verification_token = secrets.token_urlsafe(32)
            current_user.email_verification_token = verification_token
            logger.info(
                "email_change_initiated",
                user_id=str(current_user.id),
                new_email=mask_email(new_email),
            )
            background_tasks.add_task(
                EmailService.send_verification_email,
                email=new_email,
                token=verification_token,
            )

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.put("/me/password")
async def update_password(
    pwd_in: PasswordUpdate,
    current_user: Annotated[User, Depends(get_current_active_user_basic)],
    db: AsyncSession = Depends(get_db),
):
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Social login accounts do not have local passwords",
        )

    if not verify_password(pwd_in.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password",
        )

    current_user.password_hash = get_password_hash(pwd_in.new_password)
    current_user.must_reset_password = False
    await db.commit()

    return {"detail": "Password updated successfully"}
