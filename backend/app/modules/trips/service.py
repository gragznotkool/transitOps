from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException, status
from datetime import datetime, date

from app.models.trips import Trip
from app.models.fleet import Vehicle
from app.models.drivers import Driver
from app.modules.trips import schemas
from app.core.constants import TripStatus, VehicleStatus, DriverStatus

async def get_trips(db: AsyncSession, company_id: int, trip_status: str = None, page: int = 1, limit: int = 50):
    query = select(Trip).filter(Trip.company_id == company_id)
    if trip_status:
        query = query.filter(Trip.status == trip_status)
    
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return items, total

async def create_trip(db: AsyncSession, company_id: int, trip_in: schemas.TripCreate) -> Trip:
    # Basic pre-check (non-locking)
    vehicle = await db.get(Vehicle, trip_in.vehicle_id)
    driver = await db.get(Driver, trip_in.driver_id)
    
    if not vehicle or vehicle.company_id != company_id:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if not driver or driver.company_id != company_id:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    if vehicle.max_load_capacity_kg < trip_in.cargo_weight_kg:
        raise HTTPException(
            status_code=400, 
            detail={"error": {"code": "CARGO_EXCEEDS_CAPACITY", "message": "Cargo exceeds vehicle capacity."}}
        )

    db_trip = Trip(**trip_in.model_dump(), company_id=company_id)
    db.add(db_trip)
    await db.commit()
    await db.refresh(db_trip)
    return db_trip

async def dispatch_trip(db: AsyncSession, company_id: int, trip_id: int) -> Trip:
    # We must use a nested transaction (or explicit commit) to hold locks until done
    trip = await db.get(Trip, trip_id, with_for_update=True)
    if not trip or trip.company_id != company_id:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status != TripStatus.DRAFT:
        raise HTTPException(
            status_code=400, 
            detail={"error": {"code": "TRIP_NOT_DRAFT", "message": "Trip must be in Draft status to dispatch."}}
        )

    vehicle = await db.get(Vehicle, trip.vehicle_id, with_for_update=True)
    driver = await db.get(Driver, trip.driver_id, with_for_update=True)

    if vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(
            status_code=400, 
            detail={"error": {"code": "VEHICLE_NOT_AVAILABLE", "message": "Vehicle is no longer available."}}
        )
    if driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(
            status_code=400, 
            detail={"error": {"code": "DRIVER_NOT_AVAILABLE", "message": "Driver is no longer available."}}
        )
    if driver.license_expiry_date <= date.today():
        raise HTTPException(
            status_code=400, 
            detail={"error": {"code": "LICENSE_EXPIRED", "message": "Driver's license has expired."}}
        )

    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP
    trip.status = TripStatus.DISPATCHED
    trip.dispatched_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(trip)
    return trip

async def complete_trip(db: AsyncSession, company_id: int, trip_id: int, data: schemas.TripComplete) -> Trip:
    trip = await db.get(Trip, trip_id, with_for_update=True)
    if not trip or trip.company_id != company_id:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status != TripStatus.DISPATCHED:
        raise HTTPException(
            status_code=400, 
            detail={"error": {"code": "TRIP_NOT_DISPATCHED", "message": "Trip must be dispatched to complete."}}
        )

    vehicle = await db.get(Vehicle, trip.vehicle_id, with_for_update=True)
    driver = await db.get(Driver, trip.driver_id, with_for_update=True)

    vehicle.status = VehicleStatus.AVAILABLE
    vehicle.odometer_km = data.final_odometer
    driver.status = DriverStatus.AVAILABLE
    
    trip.status = TripStatus.COMPLETED
    trip.completed_at = datetime.utcnow()
    trip.actual_distance_km = data.actual_distance_km
    trip.final_odometer = data.final_odometer
    trip.fuel_consumed_liters = data.fuel_consumed_liters

    await db.commit()
    await db.refresh(trip)
    return trip

async def cancel_trip(db: AsyncSession, company_id: int, trip_id: int) -> Trip:
    trip = await db.get(Trip, trip_id, with_for_update=True)
    if not trip or trip.company_id != company_id:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status in [TripStatus.COMPLETED, TripStatus.CANCELLED]:
        raise HTTPException(
            status_code=400, 
            detail={"error": {"code": "INVALID_TRANSITION", "message": "Cannot cancel this trip."}}
        )

    # If it was already dispatched, we must free the vehicle and driver
    if trip.status == TripStatus.DISPATCHED:
        vehicle = await db.get(Vehicle, trip.vehicle_id, with_for_update=True)
        driver = await db.get(Driver, trip.driver_id, with_for_update=True)
        vehicle.status = VehicleStatus.AVAILABLE
        driver.status = DriverStatus.AVAILABLE

    trip.status = TripStatus.CANCELLED
    await db.commit()
    await db.refresh(trip)
    return trip
