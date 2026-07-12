from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.models.base import TenantBase
from app.core.constants import VehicleStatus

class Vehicle(TenantBase):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, index=True, nullable=False)
    name_model = Column(String, nullable=False)
    type = Column(String, nullable=False)
    max_load_capacity_kg = Column(Float, nullable=False)
    acquisition_cost = Column(Float, nullable=False)
    region = Column(String, nullable=False)
    
    status = Column(String, default=VehicleStatus.AVAILABLE, nullable=False)
    odometer_km = Column(Float, default=0.0, nullable=False)
