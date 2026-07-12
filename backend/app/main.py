from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db_session

from app.modules.auth.router import router as auth_router
from app.modules.fleet.router import router as fleet_router
from app.modules.drivers.router import router as drivers_router
from app.modules.trips.router import router as trips_router
from app.modules.maintenance.router import router as maintenance_router
from app.modules.finance.router import router as finance_router

app = FastAPI(title="TransitOps API", version="2.0.0")

app.include_router(auth_router, prefix="/api/v1")
app.include_router(fleet_router, prefix="/api/v1")
app.include_router(drivers_router, prefix="/api/v1")
app.include_router(trips_router, prefix="/api/v1")
app.include_router(maintenance_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db_session)):
    # Verify DB connectivity
    await db.execute(text("SELECT 1"))
    return {"status": "ready"}
