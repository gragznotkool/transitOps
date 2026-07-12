# Rule: Coding Conventions

## Backend (Python)

- Layering is mandatory: `routes/` parse the request and call a service; `services/` hold all business logic; `repositories/` hold raw queries only. Never put a DB query in a route handler. Never put a business-rule `if` in a repository function.
- Every Pydantic "create" schema has a separate "output" schema when the shapes differ (output includes `id`, `created_at`; input doesn't) — don't reuse one schema for both.
- Type hints on every function signature. No bare `except:` — catch specific exceptions.
- Format with `black`, lint with `ruff`, before every commit.

## Frontend (TypeScript/React)

- Every component is typed — no `any`. Props interfaces named `<ComponentName>Props`.
- Server state goes through TanStack Query hooks in `frontend/src/lib/queries.ts` — never `useEffect` + `fetch` directly in a component.
- Status badges always import color mapping from `frontend/src/lib/statusColors.ts` — never a one-off hardcoded color per component.
- Every list/table component includes an explicit empty state and loading state, not just the happy path.

## Both

- Commit format: `[module] short description`.
- Branch format: `<initials>/<module>-<short-desc>`.
