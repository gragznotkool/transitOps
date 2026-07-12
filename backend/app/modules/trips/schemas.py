from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.core.constants import TripStatus

class TripBase(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight_kg: float
    planned_distance_km: float

class TripCreate(TripBase):
    pass

class TripComplete(BaseModel):
    actual_distance_km: float
    final_odometer: float
    fuel_consumed_liters: float

class TripResponse(TripBase):
    id: int
    company_id: int
    status: str
    actual_distance_km: Optional[float] = None
    final_odometer: Optional[float] = None
    fuel_consumed_liters: Optional[float] = None
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedTripResponse(BaseModel):
    items: List[TripResponse]
    total: int
    page: int
    limit: int
