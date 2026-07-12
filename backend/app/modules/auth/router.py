from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db_session
from app.core.security import create_access_token, create_refresh_token
from app.core.deps import get_current_user
from app.models.core import User
from app.modules.auth import schemas, service

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=schemas.LoginResponse)
async def login(
    login_data: schemas.UserLogin,
    db: AsyncSession = Depends(get_db_session)
):
    user = await service.authenticate_user(db, login_data)
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return schemas.LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user
    )

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
