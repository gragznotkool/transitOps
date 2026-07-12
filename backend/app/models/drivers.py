from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.models.base import TenantBase
from app.core.constants import DriverStatus

class Driver(TenantBase):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    license_category = Column(String, nullable=False)
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String, nullable=False)
    
    status = Column(String, default=DriverStatus.AVAILABLE, nullable=False)
