from pydantic import BaseModel
from typing import List

class FleetUtilizationItem(BaseModel):
    vehicle_id: int
    registration_number: str
    active_trips: int
    total_trips: int
    utilization_pct: float

class VehicleROIItem(BaseModel):
    vehicle_id: int
    registration_number: str
    total_revenue_estimated: float
    total_maintenance_cost: float
    total_fuel_cost: float
    net_roi: float

class FuelEfficiencyItem(BaseModel):
    vehicle_id: int
    registration_number: str
    total_distance_km: float
    total_fuel_liters: float
    km_per_liter: float
