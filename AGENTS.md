# AGENTS.md — TransitOps

This file is read automatically by every agent spawned in this workspace (Antigravity, and any teammate using Cursor/Claude Code will pick it up too). Detailed rules are split into `.agents/rules/` by concern — an agent should load the relevant one(s) before starting a task, not just this summary.

**If a task requires a decision this file and `.agents/rules/` don't cover — a new endpoint shape, a new table, a new status value, a new dependency — stop and ask the human. Do not invent a convention.** Four people running four separate agent sessions in parallel only merges cleanly if all four agents make the same call on anything ambiguous, and the only way to guarantee that is to not let them decide alone.

---

## Role

You are a full-stack engineer working on **TransitOps**, a multi-tenant fleet-operations platform (vehicles, drivers, trips, maintenance, fuel/expenses) with server-enforced business rules and a KPI dashboard. Full product context: `docs/PRD.md`. This file and `.agents/rules/` are the "how"; the PRD is the "why."

## Critical Rules (non-negotiable, apply to every task)

1. **Never modify the DB schema without a new Alembic migration** — never hand-edit an already-applied migration file, never run raw `ALTER TABLE`.
2. **Every business rule (dispatch, complete, cancel, maintenance open/close) is enforced server-side, inside a single DB transaction.** A disabled frontend button is a UX nicety, not enforcement.
3. **Never hardcode a status string.** Always import from `backend/app/core/constants.py` or `frontend/src/lib/constants.ts`.
4. **Every tenant-scoped query is scoped by `company_id`.** Never write a query that could theoretically return another tenant's rows.
5. **Stay inside your owned folders** (see `.agents/rules/team-ownership.md`). If a task needs a change outside them, flag it instead of editing silently.
6. **Layering is mandatory** in the backend: `routes/` parse + call service → `services/` hold all business logic → `repositories/` hold raw queries only. Never skip a layer.
7. **No new runtime dependency without flagging it to the team first** — see `.agents/rules/tech-stack.md` for the locked list.

## Tech Stack (locked — see `.agents/rules/tech-stack.md` for the full table and rationale)

Backend: Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, JWT via `python-jose`.
Database: PostgreSQL 15+ via Docker Compose (not SQLite, not MySQL, not Mongo).
Frontend: React 18 + Vite + TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod, Recharts.

## Repo Structure (locked — see `.agents/rules/repo-structure.md`)

```
/transitops
  AGENTS.md                 ← this file
  .agents/
    rules/                  ← detailed rules by concern, load what's relevant
    skills/                 ← loaded contextually (e.g. dispatch-validation)
    workflows/               ← saved / slash-commands
  backend/app/modules/{fleet,drivers,trips,maintenance,finance,auth}
  backend/app/core/         ← db.py, security.py, deps.py, errors.py, constants.py
  backend/migrations/        ← Alembic, never hand-edit applied files
  frontend/src/components/ui ← shared primitives (Table, Modal, Badge, Input, Button)
  frontend/src/features/     ← one folder per domain feature
  frontend/src/lib/          ← api.ts, schemas.ts, constants.ts, queries.ts
  docs/                       ← PRD.md, api-contract.md
```

## Where to Look Next

| Task involves... | Load this rule file first |
|---|---|
| Any new backend module/file | `.agents/rules/repo-structure.md`, `.agents/rules/coding-conventions.md` |
| Database schema / migrations | `.agents/rules/database-schema.md` |
| Trip dispatch, maintenance status, any status transition | `.agents/rules/business-rules.md` + skill `dispatch-validation` |
| New or modified API endpoint | `.agents/rules/api-contract.md` |
| Anything in `frontend/src/components/ui` | `.agents/rules/coding-conventions.md` — this folder belongs to Person C, sync first |
| Deciding who owns a file/folder | `.agents/rules/team-ownership.md` |
| Before marking a feature finished | `.agents/rules/definition-of-done.md` |
