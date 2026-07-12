from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import declared_attr
from app.core.db import Base

class TenantBase(Base):
    """
    Abstract base class for all tenant-scoped models.
    Automatically adds company_id and sets up the relationship.
    """
    __abstract__ = True

    @declared_attr
    def company_id(cls):
        # company_id is indexed as it will be used heavily for RLS filtering
        return Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
