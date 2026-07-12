from pydantic import BaseModel

class DashboardKPIs(BaseModel):
    active_vehicles: int
    available_vehicles: int
    in_maintenance: int
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization_pct: float
