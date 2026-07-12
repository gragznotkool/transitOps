from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date

class DriverBase(BaseModel):
    full_name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    status: Optional[str] = None

class DriverResponse(DriverBase):
    id: int
    company_id: int
    status: str

    model_config = ConfigDict(from_attributes=True)

class PaginatedDriverResponse(BaseModel):
    items: List[DriverResponse]
    total: int
    page: int
    limit: int
