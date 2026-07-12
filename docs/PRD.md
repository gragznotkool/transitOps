# TransitOps — Production PRD v2
### Smart Transport Operations Platform | System Design for Scale

**Supersedes:** v1 (hackathon-only scope)
**Lens:** How does this actually run for real transport companies, at 100+ concurrent users, and hold up to scrutiny from a platform company (Odoo) that lives and breathes this exact domain?

---

## 0. What Changed, and Why (read this first)

Every non-trivial choice from v1 is re-argued below. Where v1 was wrong, I say so.

| Decision | v1 said | v2 says | Why the change |
|---|---|---|---|
| Database | SQLite | **PostgreSQL, self-hosted/local** | SQLite has a single-writer lock — fine for a demo, but "dispatch a trip" is a write, and 100 concurrent dispatchers will produce `SQLITE_BUSY` errors, not queued success. Postgres gives real MVCC + row-level locking. Still runs on `localhost`/Docker — this doesn't violate "prefer local databases," it just picks the *right* local database. |
| Backend language | Node/Express | **Python + FastAPI** | Odoo's entire platform is Python + PostgreSQL. Matching that stack isn't cosmetic — it means your data model could realistically sync with an actual Odoo instance (Odoo already ships a Fleet app) via their external API, which is a much stronger story to a company hackathon judge than "we built something Odoo-shaped in a different language." |
| Tenancy | Implicit single company | **Explicit multi-tenant, shared DB + `company_id` + Postgres Row-Level Security** | v1 never answered "how do multiple transport companies use this." A SaaS product needs tenant isolation from day one — retrofitting it later means touching every table and every query. |
| Auth | Long-lived JWT | **Short-lived access JWT (15 min) + rotating refresh token, hashed in DB** | A JWT with no revocation path is a liability at real user counts — if a Safety Officer account is compromised, you need a way to kill their session without waiting for token expiry. |
| Concurrency on dispatch | "Re-check status in the same transaction" | Same idea, now specified precisely: **`SELECT ... FOR UPDATE`** row lock on vehicle + driver rows inside the dispatch transaction | At 4-person-hackathon scale, a plain re-check is enough. At 100 concurrent dispatchers, two requests can both pass the re-check before either commits — you need an actual row lock, not just a second read. |
| Real-time visibility | Polling via React Query | **Polling stays for v1 demo; WebSocket/SSE channel added for production** so every dispatcher's board updates live when someone else dispatches a vehicle | With one dispatcher, polling is invisible. With ten dispatchers competing for the same vehicle pool, stale data for even 5 seconds causes double-booking attempts and a worse UX, even if the backend correctly rejects the second one. |
| Deployment | "Runs on localhost for demo" | **Containerized (Docker), horizontally scaled app tier behind a load balancer, connection-pooled to Postgres via PgBouncer** | 100+ concurrent users is a load-bearing requirement, not a nice-to-have — it needs an actual scale-out story, not just "it'll probably be fine." |
| Reporting queries | Same DB as transactional writes | **Read replica (or at minimum, a separate connection pool) for reports/CSV export** | A Financial Analyst running a large ROI export shouldn't be able to slow down a dispatcher's trip-creation request. Separating read-heavy analytical load from write-heavy operational load is standard practice once you have real concurrent load. |
| Background work (license-expiry emails, report generation) | Not addressed | **Job queue (Celery + Redis, since we're now Python)** | Anything that isn't "respond to this HTTP request in under 200ms" — emails, PDF generation, nightly recalculation — belongs off the request path. |

The through-line: **v1 optimized for "finishes in 8 hours." v2 optimizes for "the architecture doesn't need to be rebuilt the day after the hackathon ends."** Everything below is written so that what you demo *is* a thin slice of the production system, not a prototype you'll throw away.

---

## 1. Product Framing — Who Actually Uses This, and How

TransitOps is a **multi-tenant SaaS product**. A transport company signs up as a `company` (tenant), and everyone in that company — Fleet Manager, Dispatcher, Safety Officer, Financial Analyst — operates inside that tenant's isolated data.

**Real-world usage pattern** (this shapes several architecture decisions below):

- **Dispatchers** are the highest-frequency, lowest-latency users — they're at a desk, creating and dispatching trips continuously through the day, and need the vehicle/driver pool to be *correct in the moment*, not eventually consistent.
- **Fleet Managers** touch the system in bursts — onboarding a new vehicle, closing a maintenance ticket — not continuously.
- **Safety Officers** work in a periodic-audit pattern — daily/weekly sweeps of license expiries and safety scores, not real-time.
- **Financial Analysts** run heavy, infrequent, read-only queries (monthly ROI reports, CSV exports) that touch large date ranges — this is exactly the workload that should **not** compete with dispatcher writes for database resources.

This access pattern is *why* the read/write split and the job queue exist in this design — they're not generic "best practices," they map directly to how the four personas actually behave.

**Onboarding flow:**
1. Company signs up → creates tenant record + first Admin user.
2. Admin invites teammates by email, assigning roles.
3. Company bulk-imports existing fleet/driver data via CSV (a real transport company will not hand-type 40 vehicles).
4. Day-to-day operation begins; historical data accrues for ROI/utilization reporting.

---

## 2. Architecture — Production Topology

```
                                   ┌─────────────────┐
                                   │   Load Balancer   │  (Nginx / cloud LB)
                                   │  TLS termination   │
                                   └────────┬───────────┘
                          ┌──────────────────┼──────────────────┐
                          ▼                  ▼                  ▼
                  ┌──────────────┐  ┌──────────────┐   ┌──────────────┐
                  │  API instance │  │  API instance │   │  API instance │   ← stateless FastAPI
                  │   (Docker)    │  │   (Docker)    │   │   (Docker)    │      containers, scale
                  └───────┬───────┘  └───────┬───────┘   └───────┬───────┘      horizontally
                          │                  │                   │
                          └──────────┬───────┴──────────┬────────┘
                                     ▼                   ▼
                          ┌───────────────────┐  ┌──────────────────┐
                          │  PgBouncer          │  │   Redis            │  ← cache + session +
                          │ (connection pooler)  │  │ (cache/queue broker)│    Celery broker
                          └──────────┬───────────┘  └────────┬───────────┘
                                     ▼                        ▼
                    ┌─────────────────────────┐     ┌──────────────────┐
                    │  PostgreSQL — PRIMARY     │     │  Celery Workers    │  ← background jobs:
                    │  (writes: trips,          │     │  (async, off the   │    license-expiry
                    │   vehicles, drivers)       │     │   request path)    │    emails, PDF/CSV
                    └──────────┬────────────────┘     └──────────────────┘    generation, nightly
                               │ streaming replication                         recalculation
                               ▼
                    ┌─────────────────────────┐
                    │  PostgreSQL — REPLICA      │  ← reports, exports, dashboard
                    │  (read-only)                │     read traffic served here
                    └─────────────────────────┘
```

**Why this shape and not something fancier (or simpler):**

- **Not microservices.** At this domain size (8 related entities, one coherent business process), microservices add network calls and deployment complexity without a real scaling benefit. A **modular monolith** — strict internal layering (§4 below), one deployable unit, horizontally replicated — gets you the scaling you actually need (more stateless API instances behind a load balancer) without the operational tax of service-to-service auth, distributed tracing, etc. Odoo itself is architected this way (a modular monolith of "apps" inside one system) — another point of alignment.
- **Not a NoSQL database.** The domain is fundamentally relational — trips reference vehicles and drivers, costs aggregate across foreign keys, ROI math joins three tables. Forcing this into a document store would mean re-implementing joins and transactional integrity in application code. Postgres is the correct tool here, not a default.
- **PgBouncer, not "just add more Postgres connections."** Postgres has a real ceiling on concurrent connections (default ~100); with multiple horizontally-scaled API instances each holding a connection pool, you exhaust that fast. PgBouncer multiplexes many client connections onto a small number of real Postgres connections — the standard fix, not a nice-to-have.
- **One read replica**, not a whole read-scaling fleet. At 100+ concurrent users this is sufficient headroom, and it's the piece that most directly prevents the "Financial Analyst's export slows down the dispatch board" problem.

---

## 3. Multi-Tenancy — The Design That Was Missing

**Decision: shared database, shared schema, `company_id` on every tenant-scoped table, enforced by PostgreSQL Row-Level Security (RLS).**

I considered three models:

| Model | Isolation | Ops overhead | Verdict |
|---|---|---|---|
| Separate database per company | Strongest | High — migrations must run N times, connection pooling gets complicated | Overkill until you have enterprise customers demanding physical isolation |
| Separate schema per company (same DB) | Strong | Medium | Reasonable middle ground, but query routing logic gets awkward |
| **Shared schema + `company_id` + RLS** | Enforced at the DB layer, not just app code | Low | **Chosen** — one migration path, one connection pool, and isolation is guaranteed even if a developer forgets a `WHERE company_id = ?` clause somewhere |

```sql
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON vehicles
  USING (company_id = current_setting('app.current_company_id')::int);
```
The API sets `app.current_company_id` at the start of every request (from the authenticated JWT's claims) — after that, **it is structurally impossible for a query to leak data across tenants**, even a hand-written ad-hoc query a developer runs during debugging. This is a stronger guarantee than "we remembered to filter in the service layer" and costs almost nothing to add now versus retrofitting after real customer data exists.

Every table from the v1 schema gains a `company_id INTEGER NOT NULL REFERENCES companies(id)` column, indexed, as the first column after `id`.

---

## 4. Backend — Modular, Odoo-Shaped

```
/app
  /modules
    /fleet          # vehicles.py (model, schema, service, routes)
    /drivers        # drivers.py
    /trips          # trips.py — contains the dispatch rule engine
    /maintenance    # maintenance.py
    /finance        # fuel_logs.py, expenses.py, reports.py
    /auth           # users, roles, RBAC, JWT issuance/refresh
    /companies      # tenant management, onboarding
  /core
    db.py            # session factory, PgBouncer-aware pool config
    security.py       # password hashing, JWT encode/decode
    rls.py             # sets current_company_id per request
    celery_app.py       # background job registration
  main.py
```

Each module under `/modules` is self-contained (its own models, Pydantic schemas, service functions, and router) — deliberately mirroring how **Odoo structures its own apps** (Fleet, Project, Purchase, etc. as discrete, composable modules on a shared core). This isn't just an aesthetic choice: it means a specific module (say, `fleet`) could later be extracted or mapped onto Odoo's own `fleet.vehicle` model via their JSON-RPC/XML-RPC external API, if this were ever pitched as an Odoo-integrated add-on rather than a standalone competitor. Worth stating explicitly in a hackathon pitch to Odoo judges: **this system is designed to plug into their ecosystem, not just resemble it.**

**Layering inside each module stays exactly as in v1** (routes → services → repositories) — that discipline doesn't change with scale, it's what makes the scale-out safe: services contain business logic and are the only place a Celery task or a route handler calls into, so behavior can't drift between the sync API path and the async job path.

---

## 5. Concurrency Correctness at Real Load

This is the part that actually breaks first under 100 concurrent users if left as "just re-check the status."

**The race:** Two dispatchers, two different trips, both targeting Van-05, both requests arrive within milliseconds. Both read `vehicles.status = 'Available'`. Both pass validation. Both attempt to dispatch.

**The fix:**
```sql
BEGIN;
SELECT status FROM vehicles WHERE id = :vehicle_id FOR UPDATE;   -- blocks the second transaction here
SELECT status FROM drivers  WHERE id = :driver_id  FOR UPDATE;
-- re-validate status == 'Available' now that we hold the lock
UPDATE vehicles SET status = 'On Trip' WHERE id = :vehicle_id;
UPDATE drivers  SET status = 'On Trip' WHERE id = :driver_id;
UPDATE trips SET status = 'Dispatched', dispatched_at = now() WHERE id = :trip_id;
COMMIT;
```
`FOR UPDATE` takes a row-level lock, so the second transaction physically waits until the first commits, then re-reads the now-updated status and correctly rejects. This is the difference between "usually works" and "correct under contention" — and it's a five-line change from v1, not a redesign, which is exactly why it's worth specifying precisely now rather than discovering it in a bug report later.

**Idempotency:** dispatch/complete/cancel endpoints accept an `Idempotency-Key` header (client-generated UUID per user action). If a dispatcher double-clicks or a request times out and retries, the server recognizes the repeated key and returns the original result instead of attempting the transition twice.

---

## 6. Caching & Performance at 100+ Concurrent Users

- **Dashboard KPIs are cached in Redis with a 10–15 second TTL**, invalidated eagerly on any write that affects fleet/driver/trip status. A dashboard is read far more often than fleet state changes, so serving it from cache — recomputed at most every 10-15s or on-write — removes repeated aggregate queries from the hot path without users perceiving staleness.
- **Dispatch-pool queries** (`WHERE status = 'Available'`) are cheap due to the indexes already in v1's schema (§5.2 of v1) — no caching needed here; this data must always be live, correctness > speed.
- **Pagination is cursor-based**, not offset-based, on all list endpoints once table sizes grow — offset pagination degrades linearly with table size (`OFFSET 50000` still scans 50,000 rows in Postgres).
- **N+1 queries are eliminated at the ORM layer** (SQLAlchemy eager-loading / explicit joins for trip lists that need vehicle+driver info) — a correctness/performance rule, enforced in code review, not an afterthought.

---

## 7. Real-Time Dispatch Board

At hackathon scale (v1), polling every few seconds via React Query is invisible and fine. At production scale with multiple simultaneous dispatchers, staleness causes real friction — someone tries to dispatch a vehicle that was taken 3 seconds ago and gets a rejection that feels like a bug even though it's correct.

**Fix:** a lightweight **WebSocket (or Server-Sent Events) channel** that broadcasts `vehicle.status_changed` / `driver.status_changed` / `trip.status_changed` events to all connected clients in the same tenant. The frontend updates the relevant cache entry (React Query's `setQueryData`) on receipt instead of waiting for the next poll. This is additive to the REST API, not a replacement — mutations still go through REST; the socket is push-only, one-directional, and stateless on reconnect (client just re-fetches current state).

---

## 8. Deployment & DevOps

- **Containerization**: every component (API, Postgres, Redis, Celery worker) has a `Dockerfile`; `docker-compose.yml` runs the full stack locally for development and for the hackathon demo — this is the same topology as production, just single-instance instead of replicated, so there is no "demo build" vs "real build" divergence.
- **CI**: GitHub Actions runs lint + type-check (mypy) + unit tests (pytest) + a migration dry-run on every PR — catches schema drift before merge, which matters more with 4 people touching the same schema.
- **Migrations**: Alembic (SQLAlchemy's migration tool) — every schema change is a versioned, reversible file, never a manual `ALTER TABLE` run by hand.
- **Config via environment variables** (12-factor: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SMTP_*`) — identical codebase runs in dev, demo, and production, differing only by env.
- **Health checks**: `/health` (liveness) and `/ready` (readiness — checks DB + Redis connectivity) endpoints, required by any real load balancer or orchestrator.
- **Horizontal scaling story for 100+ users**: the API tier is stateless (no in-memory session, no local file writes) specifically so it can be replicated behind the load balancer with zero code changes — this is *why* JWT auth and Redis-backed caching were chosen over in-memory alternatives.

---

## 9. Durability & Backup

- Postgres **WAL archiving** + daily base backups (`pg_basebackup`), enabling point-in-time recovery — not just "the file exists on disk" as in the SQLite version, but actual recoverability to a specific timestamp before a bad migration or bad actor.
- Streaming replication to the read replica doubles as a **hot standby** — if the primary fails, the replica is promotable with minimal data loss.
- Nightly `pg_dump` exported to encrypted storage as a second, independent backup path (belt-and-suspenders — replication protects against hardware failure, logical dumps protect against "someone ran a bad `UPDATE` with no `WHERE` clause").

---

## 10. Security at Real User Counts

- **Auth**: short-lived (15 min) access JWT + rotating refresh token, refresh tokens hashed before storage (never store a usable token), revocable by deleting the stored hash — this is what closes the "compromised account" gap flagged in §0.
- **Rate limiting** at the load balancer / API gateway layer (e.g., 100 req/min per user) — prevents both abuse and a runaway frontend bug from hammering the API.
- **RBAC + RLS is defense in depth**: even if a role check in application code has a bug, Postgres RLS still physically prevents cross-tenant data access.
- **Audit log table** (`audit_logs`: who, what, when, before/after state) on all status-changing actions — a Safety Officer or Fleet Manager at a real company will eventually ask "who dispatched this trip and when," and that needs to be answerable without grepping application logs.
- **Input validation unchanged from v1** (Zod-equivalent — Pydantic, since we're now Python) — still shared as the contract between frontend and backend, still backed by DB `CHECK` constraints as the last line of defense.

---

## 11. What Stays Identical From v1

To be clear about what *didn't* need re-architecting:
- The **business rule table** (§6 of v1) — trip lifecycle, maintenance-triggers-status-change, cargo-vs-capacity validation — is unchanged. Correct business logic doesn't need to change when you scale the infrastructure around it.
- The **RBAC role matrix** (§3 of v1) is unchanged, just now enforced with RLS as a second layer.
- The **design system and UI screens** (§8 of v1) are unchanged — scale is a backend/infra concern here, not a UI one.
- The **8-hour hackathon build plan** (§10 of v1) still works as the demo build — it now simply targets Postgres-in-Docker instead of a SQLite file, and Python/FastAPI instead of Node/Express, with everything else (layering, team split, timeline) intact.

---

## 12. Migration Path: Hackathon → Pilot → Scale

| Stage | Infra | Tenancy | Notes |
|---|---|---|---|
| **1. Hackathon demo** | Single Docker Compose stack: 1 API instance, 1 Postgres, 1 Redis | Single company seeded, multi-tenant schema present but unused | Everything in this doc runs *today*, just not replicated |
| **2. Pilot (1–5 real companies)** | Same stack, deployed to a single VM/server, no load balancer yet | Multi-tenant RLS actively used | Validates the tenancy model with real customers before investing in scale-out |
| **3. Scale (100+ concurrent users)** | Full topology in §2: load balancer, 3+ API replicas, PgBouncer, read replica, Celery workers | Same schema, no migration needed | This is why the schema and RLS design happen *now* — stage 3 requires zero data-model changes, only infrastructure additions |

The point of designing it this way: **stage 1 and stage 3 run the same code.** Nothing about the hackathon build is a throwaway prototype — it's stage 1 of a system that was designed for stage 3 from the first schema migration.

---

## 13. Why This Version Would Land Better With Odoo Specifically

- **Same core stack** (Python, PostgreSQL) — signals you understand their platform rather than building something superficially similar in an unrelated stack.
- **Modular-app backend structure** mirrors Odoo's own module architecture, and is explicitly designed with an extraction/integration seam (§4) rather than being a closed system.
- **Fleet management is a real Odoo app already** — positioning TransitOps as "what a focused, modern, mobile-friendly fleet-ops layer could look like, built the way Odoo builds things, with an integration path back into Odoo" is a materially stronger pitch than "a generic CRUD app that happens to be about trucks."
- **RLS-based multi-tenancy** demonstrates SaaS/production maturity beyond hackathon-CRUD level, which is the detail that tends to separate "impressive demo" from "team we'd want to talk to after the event."

---

*End of PRD v2.*
