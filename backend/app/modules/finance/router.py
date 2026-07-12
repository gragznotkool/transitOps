from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.core.deps import get_current_user
from app.models.core import User
from app.modules.finance import schemas, service

router = APIRouter(tags=["Finance"])

@router.post("/fuel-logs", response_model=schemas.FuelLogResponse)
async def create_fuel_log(
    log_in: schemas.FuelLogCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.create_fuel_log(db, current_user.company_id, log_in)

@router.post("/expenses", response_model=schemas.ExpenseResponse)
async def create_expense(
    expense_in: schemas.ExpenseCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.create_expense(db, current_user.company_id, expense_in)
