# Rule: Guardrails — Things an Agent Must Never Do

- Never hardcode a status string — always import from `constants.py` / `constants.ts`.
- Never write a query that skips `company_id` scoping.
- Never implement a business rule (see `business-rules.md`) only in the frontend.
- Never touch an already-applied Alembic migration file — create a new one.
- Never add a new npm/pip package without it being in `tech-stack.md` or flagged to the team.
- Never invent a new API endpoint shape without adding it to `docs/api-contract.md` first.
- Never edit another teammate's owned module (`team-ownership.md`) without syncing with them first.
- Never commit a hardcoded credential, API key, or secret — use environment variables (`backend/.env`, never committed; see `.env.example` for the required keys).

## If stuck in a loop

If a task fails the same way twice in a row (e.g. a migration keeps conflicting, a test keeps failing on the same assertion), stop retrying the same approach a third time. Summarize what's been tried, what failed, and ask the human before continuing — repeated blind retries burn time and often make the diff harder to review, not easier.
