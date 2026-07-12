# TransitOps

Smart Transport Operations Platform — see `docs/PRD.md` for full product context.

This repo is pre-configured for **Google Antigravity**. Every agent session opened in this workspace automatically reads `AGENTS.md` and the files under `.agents/rules/` before doing anything — that's what keeps 4 people's separate agent sessions producing compatible code instead of 4 different codebases stapled together.

---

## 1. One-time setup (each teammate does this)

1. **Install Antigravity**: [antigravity.google/download](https://antigravity.google/download), sign in with a Google account.
2. **Clone this repo**, then open the repo root folder in Antigravity (not a subfolder — `AGENTS.md` must be at the workspace root for it to auto-load).
3. On first open, Antigravity will ask you to pick an autonomy profile. For this project, use **"Review-driven development"** — balanced autonomy with checkpoints. We want agents proposing changes we can review before they land, not full autopilot, since 4 people are working in the same repo simultaneously and an uncontrolled edit outside someone's owned folder is the main risk this whole config is designed to prevent. (`.agents/rules/team-ownership.md` covers what each person owns.)
4. Confirm Antigravity picked up the config: start a new conversation and ask *"what rules and skills are loaded for this workspace?"* — it should list the files under `.agents/rules/` and the `dispatch-validation` skill.
5. Copy `backend/.env.example` to `backend/.env` and set a real `JWT_SECRET` (any random string is fine for the hackathon).

## 2. Start the local stack

We use Docker Compose at the root of the project to spin up the entire stack (Postgres, Redis, FastAPI backend, Celery workers, and the React frontend).

```bash
# 1. Start all services in the background
docker compose up -d

# 2. Run database migrations to set up the schema
docker compose exec api alembic upgrade head

# 3. Seed the database with initial data
docker compose exec api python seed.py
```

The applications will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

### Local Frontend Development (Optional)
If you are actively developing the frontend and want Vite's hot-module replacement to work outside of Docker:
```bash
cd frontend
npm install
npm run dev
```

## 3. Where things live

| I need to... | Look here |
|---|---|
| Understand the product/business rules | `docs/PRD.md` |
| Know what I own vs. a teammate | `.agents/rules/team-ownership.md` |
| Add/check an API endpoint shape | `docs/api-contract.md` |
| Implement a status transition (dispatch, complete, cancel, maintenance) | `.agents/rules/business-rules.md` + let Antigravity load the `dispatch-validation` skill |
| Check the locked tech stack | `.agents/rules/tech-stack.md` |
| Run a saved workflow | type `/new-endpoint` or `/generate-tests` in the Antigravity agent chat |

## 4. Team

| Person | Owns |
|---|---|
| A | Backend: auth, fleet, drivers |
| B | Backend: trips, maintenance, finance (the business rule engine) |
| C | Frontend: shared UI components, auth/vehicles/drivers screens |
| D | Frontend: trips, maintenance, finance, dashboard screens |

Full detail in `.agents/rules/team-ownership.md`.

## 5. Golden rule

The DB schema and API contract are frozen after the first hour of the hackathon. If you need to change either, say so out loud to the team before your agent touches it — every other person's agent session is coding against the current shape.
