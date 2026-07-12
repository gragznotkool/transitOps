from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import TenantBase

class MaintenanceLog(TenantBase):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    service_type = Column(String, nullable=False)
    cost = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="Open", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle")
