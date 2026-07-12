from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List
from app.modules.reports import schemas

async def get_fleet_utilization(db: AsyncSession, company_id: int) -> List[schemas.FleetUtilizationItem]:
    query = text("""
        SELECT 
            v.id as vehicle_id,
            v.registration_number,
            COUNT(t.id) FILTER (WHERE t.status = 'Dispatched') as active_trips,
            COUNT(t.id) as total_trips
        FROM vehicles v
        LEFT JOIN trips t ON v.id = t.vehicle_id
        WHERE v.company_id = :company_id
        GROUP BY v.id
    """)
    result = await db.execute(query, {"company_id": company_id})
    items = []
    for row in result.fetchall():
        utilization = 0.0
        if row.total_trips > 0:
            utilization = round((row.active_trips / row.total_trips) * 100, 2)
        items.append(schemas.FleetUtilizationItem(
            vehicle_id=row.vehicle_id,
            registration_number=row.registration_number,
            active_trips=row.active_trips,
            total_trips=row.total_trips,
            utilization_pct=utilization
        ))
    return items

async def get_vehicle_roi(db: AsyncSession, company_id: int) -> List[schemas.VehicleROIItem]:
    query = text("""
        SELECT 
            v.id as vehicle_id,
            v.registration_number,
            COALESCE((SELECT SUM(m.cost) FROM maintenance_logs m WHERE m.vehicle_id = v.id), 0) as total_maintenance_cost,
            COALESCE((SELECT SUM(f.cost) FROM fuel_logs f WHERE f.vehicle_id = v.id), 0) as total_fuel_cost,
            COALESCE((SELECT SUM(t.actual_distance_km * 2.5) FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'Completed'), 0) as total_revenue_estimated
        FROM vehicles v
        WHERE v.company_id = :company_id
    """)
    result = await db.execute(query, {"company_id": company_id})
    items = []
    for row in result.fetchall():
        net_roi = float(row.total_revenue_estimated) - float(row.total_maintenance_cost) - float(row.total_fuel_cost)
        items.append(schemas.VehicleROIItem(
            vehicle_id=row.vehicle_id,
            registration_number=row.registration_number,
            total_revenue_estimated=float(row.total_revenue_estimated),
            total_maintenance_cost=float(row.total_maintenance_cost),
            total_fuel_cost=float(row.total_fuel_cost),
            net_roi=round(net_roi, 2)
        ))
    return items

async def get_fuel_efficiency(db: AsyncSession, company_id: int) -> List[schemas.FuelEfficiencyItem]:
    query = text("""
        SELECT 
            v.id as vehicle_id,
            v.registration_number,
            COALESCE((SELECT SUM(t.actual_distance_km) FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'Completed'), 0) as total_distance_km,
            COALESCE((SELECT SUM(f.liters) FROM fuel_logs f WHERE f.vehicle_id = v.id), 0) as total_fuel_liters
        FROM vehicles v
        WHERE v.company_id = :company_id
    """)
    result = await db.execute(query, {"company_id": company_id})
    items = []
    for row in result.fetchall():
        efficiency = 0.0
        if row.total_fuel_liters > 0:
            efficiency = round(row.total_distance_km / row.total_fuel_liters, 2)
        items.append(schemas.FuelEfficiencyItem(
            vehicle_id=row.vehicle_id,
            registration_number=row.registration_number,
            total_distance_km=float(row.total_distance_km),
            total_fuel_liters=float(row.total_fuel_liters),
            km_per_liter=efficiency
        ))
    return items
