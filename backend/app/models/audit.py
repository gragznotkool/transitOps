from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base
from app.models.base import TenantBase

class AuditLog(TenantBase):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False, index=True) # e.g., "trip", "vehicle", "driver", "maintenance_log"
    entity_id = Column(Integer, nullable=False, index=True)
    action = Column(String, nullable=False) # e.g., "status_change", "dispatch"
    
    # We can store the before/after state as a short string or JSON (using String for now to be simple across DBs)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
