---
name: dispatch-validation
description: Implementing or modifying any status transition for vehicles, drivers, trips, or maintenance (dispatch, complete, cancel, open/close maintenance). Use whenever a task touches trip lifecycle or vehicle/driver status changes, to apply the correct transactional locking pattern instead of a plain read-then-write.
---

# Dispatch Validation Skill

## The problem this prevents

A naive implementation reads a vehicle's status, checks it's `Available`, then updates it. Under concurrent load (multiple dispatchers), two requests can both read `Available` before either writes — both pass validation, and the vehicle ends up double-booked. This is invisible in a single-developer hackathon demo and real in production with 100+ concurrent users.

## The pattern to apply every time

```python
async def dispatch_trip(db: AsyncSession, trip_id: int, company_id: int) -> Trip:
    async with db.begin():
        trip = await db.get(Trip, trip_id, with_for_update=True)
        if trip.company_id != company_id:
            raise NotFoundError("trip not found")
        if trip.status != TripStatus.DRAFT:
            raise BusinessRuleError("TRIP_NOT_DRAFT", "Trip must be in Draft status to dispatch.")

        vehicle = await db.get(Vehicle, trip.vehicle_id, with_for_update=True)  # row lock
        driver = await db.get(Driver, trip.driver_id, with_for_update=True)    # row lock

        if vehicle.status != VehicleStatus.AVAILABLE:
            raise BusinessRuleError("VEHICLE_NOT_AVAILABLE", "Vehicle is no longer available.")
        if driver.status != DriverStatus.AVAILABLE:
            raise BusinessRuleError("DRIVER_NOT_AVAILABLE", "Driver is no longer available.")
        if driver.license_expiry_date <= date.today():
            raise BusinessRuleError("LICENSE_EXPIRED", "Driver's license has expired.")

        vehicle.status = VehicleStatus.ON_TRIP
        driver.status = DriverStatus.ON_TRIP
        trip.status = TripStatus.DISPATCHED
        trip.dispatched_at = datetime.utcnow()
        # commit happens automatically at the end of `async with db.begin()`
    return trip
```

## Key points to always apply

1. **`with_for_update=True` on every row involved in the transition** (vehicle, driver, trip) — this is what makes a second concurrent request wait, then re-read the now-updated status and correctly reject, instead of racing.
2. **Re-validate status *inside* the transaction, after acquiring the lock** — not before. A check performed before the lock is acquired can pass on stale data.
3. **Raise a `BusinessRuleError` with a `code` + `message`**, matching the standard error shape in `.agents/rules/api-contract.md` — never a bare exception or a generic 500.
4. **All three status updates (vehicle, driver, trip) happen inside the same transaction** — if the process crashes mid-way, the transaction rolls back cleanly rather than leaving the vehicle `On Trip` with no matching dispatched trip.
5. Apply this same pattern for `complete_trip`, `cancel_trip`, `open_maintenance`, and `close_maintenance` — same lock-then-validate-then-mutate shape, different status values (see `.agents/rules/business-rules.md` for the exact table per action).

