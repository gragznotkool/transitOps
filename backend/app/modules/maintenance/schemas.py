from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class MaintenanceLogBase(BaseModel):
    vehicle_id: int
    service_type: str
    cost: float
    description: str

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLogResponse(MaintenanceLogBase):
    id: int
    company_id: int
    status: str
    created_at: datetime
    closed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedMaintenanceLogResponse(BaseModel):
    items: List[MaintenanceLogResponse]
    total: int
    page: int
    limit: int
