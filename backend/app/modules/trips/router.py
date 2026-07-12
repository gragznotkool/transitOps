from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.db import get_db_session
from app.core.deps import get_current_user
from app.models.core import User
from app.modules.trips import schemas, service

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.get("", response_model=schemas.PaginatedTripResponse)
async def get_trips(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    items, total = await service.get_trips(db, current_user.company_id, status, page, limit)
    return schemas.PaginatedTripResponse(items=items, total=total, page=page, limit=limit)

@router.post("", response_model=schemas.TripResponse)
async def create_trip(
    trip_in: schemas.TripCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.create_trip(db, current_user.company_id, current_user.id, trip_in)

@router.post("/{trip_id}/dispatch", response_model=schemas.TripResponse)
async def dispatch_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.dispatch_trip(db, current_user.company_id, current_user.id, trip_id)

@router.post("/{trip_id}/complete", response_model=schemas.TripResponse)
async def complete_trip(
    trip_id: int,
    data: schemas.TripComplete,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.complete_trip(db, current_user.company_id, current_user.id, trip_id, data)

@router.post("/{trip_id}/cancel", response_model=schemas.TripResponse)
async def cancel_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.cancel_trip(db, current_user.company_id, current_user.id, trip_id)
