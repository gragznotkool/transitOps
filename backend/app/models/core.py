from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db import Base
from app.models.base import TenantBase

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class Role(TenantBase):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., Admin, Fleet Manager, Dispatcher, Safety Officer, Financial Analyst

class User(TenantBase):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    hashed_refresh_token = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    role_id = Column(Integer, ForeignKey("roles.id"))
    
    # Relationships
    company = relationship("Company")
    role = relationship("Role")
