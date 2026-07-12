# Rule: Database Schema — Frozen After Hour 1

Full DDL lives in `backend/migrations/` (source of truth) — this file is a summary for orientation, not the canonical copy.

## Changing the schema

1. `alembic revision --autogenerate -m "description"` — never write a migration by hand unless autogenerate misses something, and if so, explain why in the migration's docstring.
2. Never edit an already-applied migration file. Create a new one.
3. Update this file's summary below.
4. Announce it — every other agent session is coding against the current shape and won't know it changed.

## Entities (see `docs/PRD.md` §5 for full DDL and rationale)

`companies`, `users`, `roles`, `vehicles`, `drivers`, `trips`, `maintenance_logs`, `fuel_logs`, `expenses`, `audit_logs`.

Every tenant-scoped table has `company_id INTEGER NOT NULL REFERENCES companies(id)` as the second column, indexed, with PostgreSQL Row-Level Security enabled — never write a query that skips this scoping, and never disable RLS to "make a query easier."

## Status enums — always reference the constant, never a string literal

```python
# backend/app/core/constants.py — the ONLY place these are defined
class VehicleStatus:
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"

class DriverStatus:
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"

class TripStatus:
    DRAFT = "Draft"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
```

```typescript
// frontend/src/lib/constants.ts — MUST match backend strings exactly, character for character
export const VehicleStatus = { AVAILABLE: "Available", ON_TRIP: "On Trip", IN_SHOP: "In Shop", RETIRED: "Retired" } as const;
export const DriverStatus = { AVAILABLE: "Available", ON_TRIP: "On Trip", OFF_DUTY: "Off Duty", SUSPENDED: "Suspended" } as const;
export const TripStatus = { DRAFT: "Draft", DISPATCHED: "Dispatched", COMPLETED: "Completed", CANCELLED: "Cancelled" } as const;
```

If you ever see `status = "available"` (wrong case) or `"in_shop"` (wrong format) anywhere in generated code, that's a bug — fix it to import the constant instead.
