from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.finance import FuelLog, Expense
from app.models.fleet import Vehicle
from app.modules.finance import schemas

async def create_fuel_log(db: AsyncSession, company_id: int, log_in: schemas.FuelLogCreate) -> FuelLog:
    vehicle = await db.get(Vehicle, log_in.vehicle_id)
    if not vehicle or vehicle.company_id != company_id:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db_log = FuelLog(**log_in.model_dump(), company_id=company_id)
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

async def create_expense(db: AsyncSession, company_id: int, expense_in: schemas.ExpenseCreate) -> Expense:
    vehicle = await db.get(Vehicle, expense_in.vehicle_id)
    if not vehicle or vehicle.company_id != company_id:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db_expense = Expense(**expense_in.model_dump(), company_id=company_id)
    db.add(db_expense)
    await db.commit()
    await db.refresh(db_expense)
    return db_expense
