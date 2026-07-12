from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.db import get_db_session
from app.core.deps import get_current_user
from app.models.core import User
from app.modules.dashboard import schemas, service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis", response_model=schemas.DashboardKPIs)
async def get_kpis(
    type: Optional[str] = None,
    status: Optional[str] = None,
    region: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.get_dashboard_kpis(db, current_user.company_id)
