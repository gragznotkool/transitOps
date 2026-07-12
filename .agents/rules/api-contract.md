# Rule: API Contract

Before writing a new endpoint: check `docs/api-contract.md`. If the endpoint isn't listed there, add it to that file first (so whoever is building the frontend against it isn't guessing at the shape), then implement it.

## Standard error response shape (always, no exceptions)

```json
{ "error": { "code": "SCREAMING_SNAKE_CASE_CODE", "message": "Human-readable sentence." } }
```

## Auth

Every mutating endpoint requires `Authorization: Bearer <jwt>` and is protected by a `require_role([...])` FastAPI dependency in `backend/app/core/deps.py`. Never trust a role claim from the JWT without the server re-verifying it against the dependency — the frontend hiding a button is not access control.

## Endpoint inventory (source of truth: `docs/api-contract.md`)

```
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/vehicles              ?status=&type=&region=&search=
POST   /api/v1/vehicles
PATCH  /api/v1/vehicles/:id
POST   /api/v1/vehicles/:id/retire

GET    /api/v1/drivers               ?status=&search=
POST   /api/v1/drivers
PATCH  /api/v1/drivers/:id

GET    /api/v1/trips                 ?status=
POST   /api/v1/trips
POST   /api/v1/trips/:id/dispatch
POST   /api/v1/trips/:id/complete
POST   /api/v1/trips/:id/cancel

POST   /api/v1/maintenance
POST   /api/v1/maintenance/:id/close

POST   /api/v1/fuel-logs
POST   /api/v1/expenses

GET    /api/v1/dashboard/kpis
GET    /api/v1/reports/fleet-utilization
GET    /api/v1/reports/vehicle-roi
GET    /api/v1/reports/export.csv    ?report=
```

Dispatch/complete/cancel accept an `Idempotency-Key` header — if a request is retried with the same key, return the original result instead of re-attempting the transition.
