# API Contract

Source of truth for every endpoint. Update this **before** implementing a new one — the frontend owner builds against what's written here, not against what's in someone else's head.

**Base URL:** `/api/v1`
**Auth:** `Authorization: Bearer <jwt>` on every endpoint except `/auth/login`.
**Standard error shape:**
```json
{ "error": { "code": "SCREAMING_SNAKE_CASE_CODE", "message": "Human-readable sentence." } }
```

---

## Auth

### `POST /auth/login`
Request: `{ "email": string, "password": string }`
Response: `{ "access_token": string, "refresh_token": string, "user": { "id": int, "email": string, "full_name": string, "role": string, "company_id": int } }`

### `GET /auth/me`
Response: current user object, same shape as above's `user`.

---

## Vehicles (owner: Person A)

### `GET /vehicles?status=&type=&region=&search=&page=&limit=`
Response: `{ "items": Vehicle[], "total": int, "page": int, "limit": int }`

### `POST /vehicles`
Request: `{ registration_number, name_model, type, max_load_capacity_kg, acquisition_cost, region }`
Roles: Fleet Manager, Admin

### `PATCH /vehicles/:id`
Roles: Fleet Manager, Admin

### `POST /vehicles/:id/retire`
Roles: Fleet Manager, Admin
Rejects with `VEHICLE_ON_TRIP` if status is `On Trip`.

---

## Drivers (owner: Person A)

### `GET /drivers?status=&search=&page=&limit=`

### `POST /drivers`
Request: `{ full_name, license_number, license_category, license_expiry_date, contact_number }`
Roles: Fleet Manager, Safety Officer, Admin

### `PATCH /drivers/:id`
Roles: Fleet Manager, Safety Officer, Admin

---

## Trips (owner: Person B)

### `GET /trips?status=`

### `POST /trips`
Request: `{ source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km }`
Rejects: `VEHICLE_NOT_AVAILABLE`, `DRIVER_NOT_AVAILABLE`, `LICENSE_EXPIRED`, `DRIVER_SUSPENDED`, `CARGO_EXCEEDS_CAPACITY`

### `POST /trips/:id/dispatch`
Header: `Idempotency-Key: <uuid>`
See `.agents/skills/dispatch-validation/SKILL.md` for the required locking pattern.

### `POST /trips/:id/complete`
Request: `{ actual_distance_km, final_odometer, fuel_consumed_liters }`

### `POST /trips/:id/cancel`

---

## Maintenance (owner: Person B)

### `POST /maintenance`
Request: `{ vehicle_id, service_type, cost, description }`
Rejects with `VEHICLE_ON_TRIP` if vehicle status is `On Trip`.

### `POST /maintenance/:id/close`

---

## Fuel & Expenses (owner: Person B)

### `POST /fuel-logs`
Request: `{ vehicle_id, trip_id?, liters, cost, logged_date }`

### `POST /expenses`
Request: `{ vehicle_id, category, amount, expense_date, notes? }`

---

## Dashboard & Reports (owner: Person B backend / Person D frontend)

### `GET /dashboard/kpis?type=&status=&region=`
Response: `{ active_vehicles, available_vehicles, in_maintenance, active_trips, pending_trips, drivers_on_duty, fleet_utilization_pct }`

### `GET /reports/fleet-utilization`
### `GET /reports/vehicle-roi`
### `GET /reports/fuel-efficiency`
### `GET /reports/export.csv?report=<report_name>`

---

*Last updated: initial scaffold. Update this file whenever an endpoint is added or changed — see `.agents/rules/api-contract.md`.*
