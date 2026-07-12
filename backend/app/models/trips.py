from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TenantBase
from app.core.constants import TripStatus

class Trip(TenantBase):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    cargo_weight_kg = Column(Float, nullable=False)
    planned_distance_km = Column(Float, nullable=False)
    actual_distance_km = Column(Float, nullable=True)
    final_odometer = Column(Float, nullable=True)
    fuel_consumed_liters = Column(Float, nullable=True)
    
    status = Column(String, default=TripStatus.DRAFT, nullable=False)
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships (optional for eager loading)
    vehicle = relationship("Vehicle")
    driver = relationship("Driver")
