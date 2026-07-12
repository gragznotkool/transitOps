from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import csv
import io

from app.core.db import get_db_session
from app.core.deps import get_current_user
from app.models.core import User
from app.modules.reports import schemas, service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/fleet-utilization", response_model=List[schemas.FleetUtilizationItem])
async def get_fleet_utilization(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.get_fleet_utilization(db, current_user.company_id)

@router.get("/vehicle-roi", response_model=List[schemas.VehicleROIItem])
async def get_vehicle_roi(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.get_vehicle_roi(db, current_user.company_id)

@router.get("/fuel-efficiency", response_model=List[schemas.FuelEfficiencyItem])
async def get_fuel_efficiency(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    return await service.get_fuel_efficiency(db, current_user.company_id)

@router.get("/export.csv")
async def export_csv(
    report: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    if report == "fleet-utilization":
        data = await service.get_fleet_utilization(db, current_user.company_id)
    elif report == "vehicle-roi":
        data = await service.get_vehicle_roi(db, current_user.company_id)
    elif report == "fuel-efficiency":
        data = await service.get_fuel_efficiency(db, current_user.company_id)
    else:
        raise HTTPException(status_code=400, detail="Unknown report type")

    if not data:
        raise HTTPException(status_code=404, detail="No data found")

    # Generate CSV stream
    output = io.StringIO()
    # Extract headers from the first item
    headers = list(data[0].model_dump().keys())
    writer = csv.DictWriter(output, fieldnames=headers)
    
    writer.writeheader()
    for item in data:
        writer.writerow(item.model_dump())

    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report}.csv"}
    )
