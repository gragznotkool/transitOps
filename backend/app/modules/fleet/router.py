from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.db import get_db_session
from app.core.deps import get_current_user
from app.models.core import User
from app.modules.fleet import schemas, service

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=schemas.PaginatedVehicleResponse)
async def get_vehicles(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    items, total = await service.get_vehicles(db, current_user.company_id, status, page, limit)
    return schemas.PaginatedVehicleResponse(items=items, total=total, page=page, limit=limit)

@router.post("", response_model=schemas.VehicleResponse)
async def create_vehicle(
    vehicle_in: schemas.VehicleCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.create_vehicle(db, current_user.company_id, vehicle_in)

@router.patch("/{vehicle_id}", response_model=schemas.VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle_in: schemas.VehicleUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.update_vehicle(db, current_user.company_id, vehicle_id, vehicle_in)

@router.post("/{vehicle_id}/retire", response_model=schemas.VehicleResponse)
async def retire_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.retire_vehicle(db, current_user.company_id, vehicle_id)
