from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException, status
from datetime import datetime

from app.models.maintenance import MaintenanceLog
from app.models.fleet import Vehicle
from app.modules.maintenance import schemas
from app.core.constants import VehicleStatus

async def get_maintenance_logs(db: AsyncSession, company_id: int, page: int = 1, limit: int = 50):
    query = select(MaintenanceLog).filter(MaintenanceLog.company_id == company_id)
    
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return items, total

async def create_maintenance_log(db: AsyncSession, company_id: int, log_in: schemas.MaintenanceLogCreate) -> MaintenanceLog:
    vehicle = await db.get(Vehicle, log_in.vehicle_id, with_for_update=True)
    if not vehicle or vehicle.company_id != company_id:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    if vehicle.status == VehicleStatus.ON_TRIP:
        raise HTTPException(
            status_code=400, 
            detail={"error": {"code": "VEHICLE_ON_TRIP", "message": "Cannot maintain a vehicle that is currently on a trip."}}
        )

    # Set vehicle to IN_SHOP
    vehicle.status = VehicleStatus.IN_SHOP

    db_log = MaintenanceLog(**log_in.model_dump(), company_id=company_id, status="Open")
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

async def close_maintenance_log(db: AsyncSession, company_id: int, log_id: int) -> MaintenanceLog:
    log = await db.get(MaintenanceLog, log_id, with_for_update=True)
    if not log or log.company_id != company_id:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
        
    if log.status == "Closed":
        raise HTTPException(
            status_code=400, 
            detail={"error": {"code": "LOG_ALREADY_CLOSED", "message": "This maintenance ticket is already closed."}}
        )

    vehicle = await db.get(Vehicle, log.vehicle_id, with_for_update=True)
    
    # Restore vehicle to available
    if vehicle:
        vehicle.status = VehicleStatus.AVAILABLE

    log.status = "Closed"
    log.closed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(log)
    return log
