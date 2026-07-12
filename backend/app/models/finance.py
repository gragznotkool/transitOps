from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.models.base import TenantBase

class FuelLog(TenantBase):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True, index=True)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    logged_date = Column(Date, nullable=False)

    vehicle = relationship("Vehicle")
    trip = relationship("Trip")


class Expense(TenantBase):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    expense_date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)

    vehicle = relationship("Vehicle")
