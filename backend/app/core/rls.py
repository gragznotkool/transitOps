from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def set_tenant(session: AsyncSession, company_id: int):
    """
    Sets the current_company_id for the PostgreSQL session to enforce RLS.
    """
    await session.execute(
        text("SELECT set_config('app.current_company_id', :company_id, true)"),
        {"company_id": str(company_id)}
    )
