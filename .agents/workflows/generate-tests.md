Generate pytest tests for the specified service function:

- Test file goes in `backend/tests/`, named `test_<module>_<function>.py`.
- Cover the primary success path.
- Cover every rejection branch listed for that action in `.agents/rules/business-rules.md` (e.g. for dispatch: already-on-trip vehicle, suspended driver, expired license, cargo over capacity).
- Use a test DB fixture (see `backend/tests/conftest.py`) — never run tests against the dev database.
- Assert both the return value/exception and the resulting DB state (e.g. after a rejected dispatch, vehicle status must be unchanged).
- Run the full suite after adding new tests, not just the new file, to catch regressions.
