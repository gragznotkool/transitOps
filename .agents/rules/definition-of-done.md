# Rule: Definition of Done

Do not report a feature as complete until:

- [ ] Backend: input validated with Pydantic, business rules enforced in `service.py`, errors return the standard `{error: {code, message}}` shape
- [ ] Backend: at least one test covers the "should be rejected" case (e.g. dispatching an already-on-trip vehicle)
- [ ] Frontend: loading state, empty state, and error state all implemented, not just the happy path
- [ ] Frontend: status colors pulled from shared constants, never hardcoded
- [ ] Both: manually verified against the example workflow in `docs/PRD.md` (register vehicle → register driver → create trip → dispatch → complete → open maintenance → confirm it's excluded from dispatch pool) if the feature touches trip/vehicle/driver status
- [ ] `docs/api-contract.md` updated if any endpoint shape changed
