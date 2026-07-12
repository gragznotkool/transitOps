import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.cache import get_redis
from app.modules.dashboard.schemas import DashboardKPIs

async def get_dashboard_kpis(db: AsyncSession, company_id: int) -> DashboardKPIs:
    redis = get_redis()
    cache_key = f"dashboard:kpis:{company_id}"
    
    # Try to get from cache
    if redis:
        cached = await redis.get(cache_key)
        if cached:
            return DashboardKPIs(**json.loads(cached))

    # Single optimized query to get all KPIs without N+1
    query = text("""
        WITH vehicle_stats AS (
            SELECT 
                COUNT(*) FILTER (WHERE status = 'Available') as available_vehicles,
                COUNT(*) FILTER (WHERE status = 'In Shop') as in_maintenance,
                COUNT(*) FILTER (WHERE status != 'Retired') as active_vehicles
            FROM vehicles
            WHERE company_id = :company_id
        ),
        trip_stats AS (
            SELECT 
                COUNT(*) FILTER (WHERE status = 'Dispatched') as active_trips,
                COUNT(*) FILTER (WHERE status = 'Draft') as pending_trips
            FROM trips
            WHERE company_id = :company_id
        ),
        driver_stats AS (
            SELECT 
                COUNT(*) FILTER (WHERE status = 'On Trip') as drivers_on_duty
            FROM drivers
            WHERE company_id = :company_id
        )
        SELECT 
            v.active_vehicles, 
            v.available_vehicles, 
            v.in_maintenance,
            t.active_trips,
            t.pending_trips,
            d.drivers_on_duty
        FROM vehicle_stats v, trip_stats t, driver_stats d
    """)
    
    result = await db.execute(query, {"company_id": company_id})
    row = result.fetchone()
    
    active_vehicles = row.active_vehicles or 0
    utilization = 0.0
    if active_vehicles > 0:
        utilization = round((row.active_trips / active_vehicles) * 100, 2)
        
    kpis = DashboardKPIs(
        active_vehicles=active_vehicles,
        available_vehicles=row.available_vehicles or 0,
        in_maintenance=row.in_maintenance or 0,
        active_trips=row.active_trips or 0,
        pending_trips=row.pending_trips or 0,
        drivers_on_duty=row.drivers_on_duty or 0,
        fleet_utilization_pct=utilization
    )
    
    # Cache for 15 seconds
    if redis:
        await redis.setex(cache_key, 15, kpis.model_dump_json())
        
    return kpis

async def invalidate_dashboard_cache(company_id: int):
    redis = get_redis()
    if redis:
        await redis.delete(f"dashboard:kpis:{company_id}")
