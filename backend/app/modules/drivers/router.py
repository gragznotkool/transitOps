from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.db import get_db_session
from app.core.deps import get_current_user
from app.models.core import User
from app.modules.drivers import schemas, service

router = APIRouter(prefix="/drivers", tags=["Drivers"])

@router.get("", response_model=schemas.PaginatedDriverResponse)
async def get_drivers(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    items, total = await service.get_drivers(db, current_user.company_id, status, page, limit)
    return schemas.PaginatedDriverResponse(items=items, total=total, page=page, limit=limit)

@router.post("", response_model=schemas.DriverResponse)
async def create_driver(
    driver_in: schemas.DriverCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.create_driver(db, current_user.company_id, driver_in)

@router.patch("/{driver_id}", response_model=schemas.DriverResponse)
async def update_driver(
    driver_id: int,
    driver_in: schemas.DriverUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.update_driver(db, current_user.company_id, driver_id, driver_in)
