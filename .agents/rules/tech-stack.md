# Rule: Locked Tech Stack

Do not substitute any of these without flagging the whole team first — a new dependency added by one agent session is invisible to the other three until someone hits a broken build.

| Layer | Choice | Do NOT use instead |
|---|---|---|
| Backend framework | Python 3.11+, FastAPI | Flask, Django, Node/Express |
| ORM | SQLAlchemy 2.0 (async) | raw psycopg, Prisma |
| Migrations | Alembic | manual `ALTER TABLE`, any other tool |
| Validation | Pydantic v2 — schemas mirror DB models 1:1 | manual `if` validation, marshmallow |
| Auth | `python-jose` for JWT, `passlib[bcrypt]` for hashing | sessions, Auth0, Firebase Auth |
| Database | PostgreSQL 15+, via Docker Compose (local) | SQLite, MySQL, MongoDB |
| Frontend | React 18 + Vite + TypeScript | Next.js, plain JS, CRA |
| Styling | Tailwind CSS, tokens from `frontend/src/theme.ts` | inline styles, styled-components, one-off hex codes |
| Data fetching | TanStack Query | raw `fetch` in components, Redux for server state |
| Forms/validation (frontend) | React Hook Form + Zod — schema shape mirrors backend Pydantic field-for-field | uncontrolled forms, manual validation |
| Charts | Recharts | Chart.js, D3 from scratch |

**Rationale (for context, not just as a rule to follow blindly):** Python + PostgreSQL was chosen to match the hackathon sponsor's (Odoo) own stack — see `docs/PRD.md` §13. SQLite was explicitly rejected because its single-writer lock fails under concurrent dispatch writes at real user counts (`docs/PRD.md` §0).
