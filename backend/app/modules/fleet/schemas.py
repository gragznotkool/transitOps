from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class VehicleBase(BaseModel):
    registration_number: str
    name_model: str
    type: str
    max_load_capacity_kg: float
    acquisition_cost: float
    region: str

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    name_model: Optional[str] = None
    type: Optional[str] = None
    max_load_capacity_kg: Optional[float] = None
    region: Optional[str] = None
    status: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: int
    company_id: int
    status: str
    odometer_km: float

    model_config = ConfigDict(from_attributes=True)

class PaginatedVehicleResponse(BaseModel):
    items: List[VehicleResponse]
    total: int
    page: int
    limit: int
