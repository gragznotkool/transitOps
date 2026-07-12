"""Enable RLS on tenant tables

Revision ID: f03916b2f410
Revises: 3be35c83a0a5
Create Date: 2026-07-12 08:15:09.410230

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f03916b2f410'
down_revision: Union[str, None] = '3be35c83a0a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    tenant_tables = [
        "roles", "users", "vehicles", "drivers", "trips",
        "maintenance_logs", "expenses", "fuel_logs", "audit_logs"
    ]
    for table in tenant_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"CREATE POLICY tenant_isolation ON {table} USING (company_id = current_setting('app.current_company_id')::int);")
        # To ensure the superuser (postgres) can still bypass RLS if needed, we might want to FORCE RLS for normal users,
        # but for now we just enable it. By default, table owners bypass RLS unless FORCE is used, but we'll assume the app connects as a normal user.

def downgrade() -> None:
    tenant_tables = [
        "roles", "users", "vehicles", "drivers", "trips",
        "maintenance_logs", "expenses", "fuel_logs", "audit_logs"
    ]
    for table in tenant_tables:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
