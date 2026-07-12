from fastapi import FastAPI, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db_session

app = FastAPI(title="TransitOps API", version="2.0.0")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db_session)):
    # Verify DB connectivity
    await db.execute(text("SELECT 1"))
    return {"status": "ready"}
