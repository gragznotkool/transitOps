from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.core.deps import get_current_user
from app.models.core import User
from app.modules.maintenance import schemas, service

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

@router.get("", response_model=schemas.PaginatedMaintenanceLogResponse)
async def get_maintenance_logs(
    page: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    items, total = await service.get_maintenance_logs(db, current_user.company_id, page, limit)
    return schemas.PaginatedMaintenanceLogResponse(items=items, total=total, page=page, limit=limit)

@router.post("", response_model=schemas.MaintenanceLogResponse)
async def create_maintenance_log(
    log_in: schemas.MaintenanceLogCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.create_maintenance_log(db, current_user.company_id, log_in)

@router.post("/{log_id}/close", response_model=schemas.MaintenanceLogResponse)
async def close_maintenance_log(
    log_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.close_maintenance_log(db, current_user.company_id, log_id)
