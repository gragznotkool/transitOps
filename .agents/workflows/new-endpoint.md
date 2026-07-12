Scaffold a new backend endpoint following TransitOps conventions:

1. Check `docs/api-contract.md` — if the endpoint isn't listed, add it there first with method, path, and request/response shape.
2. Create/extend the Pydantic request schema and a separate response schema in the module's `schemas.py`.
3. Add the repository function (raw query only, no logic) in `repository.py`.
4. Add the service function (all business logic, validation, transaction handling) in `service.py`. If this touches a status transition, load the `dispatch-validation` skill first.
5. Add the thin route handler in `routes.py` — parse request, call service, return response. No logic here.
6. Add a `require_role([...])` dependency matching the RBAC matrix in `docs/PRD.md` §3.
7. Write at least one test covering the primary success case and one covering a rejection case.
8. Run `black`, `ruff`, and the test suite before reporting done.
