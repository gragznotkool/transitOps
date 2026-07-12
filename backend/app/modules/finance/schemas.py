from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date

class FuelLogBase(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float
    cost: float
    logged_date: date

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogResponse(FuelLogBase):
    id: int
    company_id: int

    model_config = ConfigDict(from_attributes=True)

class ExpenseBase(BaseModel):
    vehicle_id: int
    category: str
    amount: float
    expense_date: date
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int
    company_id: int

    model_config = ConfigDict(from_attributes=True)
