# Rule: Team Ownership — Read This Before Touching Any File

Four people are running four separate Antigravity agent sessions against this same repo, often at the same time. The only thing that prevents constant merge conflicts is every agent staying inside its owner's lane.

| Person | Backend modules owned | Frontend owned | Must NOT edit without syncing first |
|---|---|---|---|
| **A** | `backend/app/modules/auth`, `backend/app/modules/fleet`, `backend/app/modules/drivers` | — | `trips`/`maintenance`/`finance` backend logic |
| **B** | `backend/app/modules/trips`, `backend/app/modules/maintenance`, `backend/app/modules/finance` | — | `auth`/`fleet`/`drivers` backend logic |
| **C** | — | `frontend/src/components/ui`, `frontend/src/features/auth`, `frontend/src/features/vehicles`, `frontend/src/features/drivers`, `frontend/src/theme.ts` | trips/maintenance/finance/dashboard UI |
| **D** | — | `frontend/src/features/trips`, `frontend/src/features/maintenance`, `frontend/src/features/finance`, `frontend/src/features/dashboard` | `frontend/src/components/ui` — request a change from Person C instead of editing directly |

Shared, no single owner (any agent may edit, but announce it): `backend/app/core/`, `frontend/src/lib/`, `docs/api-contract.md`, this `.agents/` folder, `AGENTS.md`.

**If your current task requires a change outside your column:** stop, state what you need changed and why, and let the human route it to the right owner (or explicitly approve you doing it this once). Do not silently edit another person's module "to quickly fix" something — the fix might conflict with work already in progress in that person's own agent session.

**Branch naming:** `<initials>/<module>-<short-desc>` (e.g. `ab/trips-dispatch-endpoint`).
**Commit message format:** `[module] short description` (e.g. `[trips] add dispatch row-locking`) — this is what makes it obvious whose work touched what when four people's agents are committing in parallel.
