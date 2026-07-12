from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.fleet import Vehicle
from app.modules.fleet import schemas
from app.core.constants import VehicleStatus

async def get_vehicles(db: AsyncSession, company_id: int, status: str = None, page: int = 1, limit: int = 50):
    query = select(Vehicle).filter(Vehicle.company_id == company_id)
    if status:
        query = query.filter(Vehicle.status == status)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Paginate
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return items, total

async def create_vehicle(db: AsyncSession, company_id: int, vehicle_in: schemas.VehicleCreate) -> Vehicle:
    db_vehicle = Vehicle(**vehicle_in.model_dump(), company_id=company_id)
    db.add(db_vehicle)
    await db.commit()
    await db.refresh(db_vehicle)
    return db_vehicle

async def update_vehicle(db: AsyncSession, company_id: int, vehicle_id: int, vehicle_in: schemas.VehicleUpdate) -> Vehicle:
    result = await db.execute(select(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.company_id == company_id))
    db_vehicle = result.scalars().first()
    if not db_vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        
    update_data = vehicle_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vehicle, field, value)
        
    await db.commit()
    await db.refresh(db_vehicle)
    return db_vehicle

async def retire_vehicle(db: AsyncSession, company_id: int, vehicle_id: int) -> Vehicle:
    result = await db.execute(select(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.company_id == company_id))
    db_vehicle = result.scalars().first()
    if not db_vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        
    if db_vehicle.status == VehicleStatus.ON_TRIP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail={"error": {"code": "VEHICLE_ON_TRIP", "message": "Cannot retire a vehicle that is currently on a trip."}}
        )
        
    db_vehicle.status = VehicleStatus.RETIRED
    await db.commit()
    await db.refresh(db_vehicle)
    return db_vehicle
