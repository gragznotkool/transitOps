# Rule: Business Rules — Non-Negotiable, Server-Side Only

These live in `backend/app/modules/trips/service.py` (dispatch/complete/cancel) and `backend/app/modules/maintenance/service.py` (open/close). Never implement these as frontend-only checks — a disabled button is UX, the backend rejection is the actual rule. See the `dispatch-validation` skill for the exact transactional pattern to use when implementing any of these.

| Action | Must validate | Must side-effect |
|---|---|---|
| Create trip | vehicle & driver both `Available`; driver license not expired; driver not `Suspended`; cargo_weight ≤ vehicle.max_load_capacity_kg | Trip created as `Draft` |
| Dispatch trip | Trip is `Draft`; re-validate vehicle/driver `Available` **inside a transaction using `SELECT ... FOR UPDATE`** on both rows | vehicle→`On Trip`, driver→`On Trip`, trip→`Dispatched`, `dispatched_at = now()` |
| Complete trip | Trip is `Dispatched` | vehicle→`Available`, driver→`Available`, trip→`Completed`, `vehicle.odometer_km += actual_distance` |
| Cancel trip | Trip is `Draft` or `Dispatched` | if was `Dispatched`: vehicle & driver→`Available`; trip→`Cancelled` |
| Open maintenance | vehicle is not `On Trip` | vehicle→`In Shop` |
| Close maintenance | maintenance is `Open` | vehicle→`Available` unless vehicle is `Retired` |

**Every row in this table is a single DB transaction.** If any check fails, the whole transaction rolls back — no partial state changes, ever. This is what makes the system correct under concurrent load (100+ dispatchers hitting the same endpoints), not just correct in a single-user demo.

**Dispatch-pool queries always filter at the SQL level, never in application code after fetching everything:**
```sql
SELECT * FROM vehicles WHERE company_id = :cid AND status = 'Available';
SELECT * FROM drivers  WHERE company_id = :cid AND status = 'Available' AND license_expiry_date > current_date;
```
This guarantees retired/in-shop vehicles and suspended/expired drivers can never appear in a dispatch picker, even if a developer forgets a check somewhere else in the stack.
