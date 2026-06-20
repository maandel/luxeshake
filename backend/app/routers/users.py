from typing import Annotated

from app.database import get_db
from app.dependencies.auth_deps import get_current_active_user
from app.models.user import User
from app.schemas.user import PasswordUpdate, UserResponse, UserUpdate
from app.utils.security import get_password_hash, verify_password
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_active_user)]):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    update_in: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db),
):
    if update_in.full_name is not None:
        current_user.full_name = update_in.full_name
    if update_in.email is not None:
        current_user.email = update_in.email

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.put("/me/password")
async def update_password(
    pwd_in: PasswordUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db),
):
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Social login accounts do not have local passwords",
        )

    if not verify_password(pwd_in.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect old password"
        )

    current_user.password_hash = get_password_hash(pwd_in.new_password)
    await db.commit()

    return {"detail": "Password updated successfully"}
