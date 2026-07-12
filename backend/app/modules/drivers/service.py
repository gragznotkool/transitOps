from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.drivers import Driver
from app.modules.drivers import schemas
from app.core.constants import DriverStatus

async def get_drivers(db: AsyncSession, company_id: int, status: str = None, page: int = 1, limit: int = 50):
    query = select(Driver).filter(Driver.company_id == company_id)
    if status:
        query = query.filter(Driver.status == status)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Paginate
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return items, total

async def create_driver(db: AsyncSession, company_id: int, driver_in: schemas.DriverCreate) -> Driver:
    db_driver = Driver(**driver_in.model_dump(), company_id=company_id)
    db.add(db_driver)
    await db.commit()
    await db.refresh(db_driver)
    return db_driver

async def update_driver(db: AsyncSession, company_id: int, driver_id: int, driver_in: schemas.DriverUpdate) -> Driver:
    result = await db.execute(select(Driver).filter(Driver.id == driver_id, Driver.company_id == company_id))
    db_driver = result.scalars().first()
    if not db_driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        
    update_data = driver_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_driver, field, value)
        
    await db.commit()
    await db.refresh(db_driver)
    return db_driver
