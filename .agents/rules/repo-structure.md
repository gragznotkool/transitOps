# Rule: Repo Structure — Exact, Do Not Reorganize

```
/transitops
  /backend
    /app
      /modules
        /fleet          ← Person A
        /drivers         ← Person A
        /trips            ← Person B
        /maintenance       ← Person B
        /finance            ← fuel_logs, expenses, reports — Person B
        /auth                ← users, roles, RBAC, JWT — Person A
      /core
        db.py               ← session factory, connection pool config
        security.py          ← password hashing, JWT encode/decode
        deps.py               ← shared FastAPI dependencies (get_current_user, require_role)
        errors.py              ← shared exception classes + handler
        constants.py             ← VehicleStatus, DriverStatus, TripStatus — the ONLY place status strings are defined
      main.py
    /migrations              ← Alembic. Never hand-edit a file after it's applied.
    /tests
    docker-compose.yml
    Dockerfile
    requirements.txt
  /frontend
    /src
      /components
        /ui                ← Person C owns this. Table, Modal, Badge, Input, Button. Everyone else imports, nobody redefines.
      /features
        /auth               ← Person C
        /vehicles            ← Person C
        /drivers               ← Person C
        /trips                  ← Person D
        /maintenance             ← Person D
        /finance                  ← Person D
        /dashboard                 ← Person D
      /lib
        api.ts                     ← single API client, shared by everyone
        schemas.ts                  ← Zod schemas — must match backend Pydantic field names exactly
        constants.ts                  ← must match backend constants.py strings exactly, character for character
        queries.ts                     ← all TanStack Query hooks live here
      theme.ts                         ← design tokens, defined once, imported everywhere
    package.json
  /docs
    PRD.md
    api-contract.md
  AGENTS.md
  /.agents
    /rules
    /skills
    /workflows
```

**Never create a file outside this structure without updating this file first.** If a task doesn't obviously fit a folder above, ask before guessing — a plausible-looking new folder from one agent session becomes a structural inconsistency the other three sessions don't know about.
