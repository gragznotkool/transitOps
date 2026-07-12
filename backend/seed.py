import asyncio
import os
import sys
from datetime import date, timedelta

sys.path.append(os.path.dirname(__file__))

from sqlalchemy.future import select
from app.core.db import async_session_maker
from app.core.security import get_password_hash
from app.models.core import Company, Role, User
from app.models.fleet import Vehicle
from app.models.drivers import Driver

async def seed_data():
    async with async_session_maker() as session:
        # Seed Company
        result = await session.execute(select(Company).filter(Company.name == "TransitOps Demo"))
        company = result.scalars().first()
        if not company:
            company = Company(name="TransitOps Demo")
            session.add(company)
            await session.commit()
            await session.refresh(company)
            print("Company seeded.")

        # Seed Roles
        roles_data = ["Admin", "Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]
        for role_name in roles_data:
            result = await session.execute(select(Role).filter(Role.name == role_name, Role.company_id == company.id))
            role = result.scalars().first()
            if not role:
                role = Role(name=role_name, company_id=company.id)
                session.add(role)
        await session.commit()
        
        # Get Admin Role
        result = await session.execute(select(Role).filter(Role.name == "Admin", Role.company_id == company.id))
        admin_role = result.scalars().first()

        # Seed Admin User
        result = await session.execute(select(User).filter(User.email == "admin@transitops.local"))
        user = result.scalars().first()
        if not user:
            user = User(
                email="admin@transitops.local",
                full_name="System Admin",
                hashed_password=get_password_hash("password123"),
                role_id=admin_role.id,
                company_id=company.id
            )
            session.add(user)
            await session.commit()
            print("Admin user seeded: admin@transitops.local / password123")

        # Seed initial vehicles
        result = await session.execute(select(Vehicle).filter(Vehicle.registration_number == "MH12-TRK-001"))
        if not result.scalars().first():
            v1 = Vehicle(
                registration_number="MH12-TRK-001", name_model="Tata Signa 4825.T", type="Heavy Duty",
                max_load_capacity_kg=28000, acquisition_cost=3500000, region="Mumbai", company_id=company.id
            )
            v2 = Vehicle(
                registration_number="DL01-VAN-005", name_model="Ashok Leyland BADA DOST", type="Light Duty",
                max_load_capacity_kg=2990, acquisition_cost=850000, region="Delhi-NCR", company_id=company.id
            )
            session.add_all([v1, v2])
            await session.commit()
            print("Vehicles seeded.")

        # Seed initial drivers
        result = await session.execute(select(Driver).filter(Driver.license_number == "DL-1420230123456"))
        if not result.scalars().first():
            d1 = Driver(
                full_name="Rajesh Kumar", license_number="DL-1420230123456", license_category="HMV",
                license_expiry_date=date.today() + timedelta(days=365), contact_number="9876543210", company_id=company.id
            )
            session.add(d1)
            await session.commit()
            print("Drivers seeded.")

if __name__ == "__main__":
    asyncio.run(seed_data())
    print("Seed complete!")
