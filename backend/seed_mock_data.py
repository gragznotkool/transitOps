import asyncio
import os
import sys
import random
from datetime import date, timedelta

# Ensure backend folder is in Python path
sys.path.append(os.path.dirname(__file__))

from sqlalchemy.future import select
from app.core.db import async_session_maker
from app.core.constants import VehicleStatus, DriverStatus
from app.models.core import Company
from app.models.fleet import Vehicle
from app.models.drivers import Driver

# Define list of vehicles to generate
VEHICLE_TEMPLATES = [
    {"name_model": "Tata Signa 4825.T", "type": "Heavy Duty", "max_load_capacity_kg": 28000.0, "acquisition_cost": 3500000.0},
    {"name_model": "Ashok Leyland BADA DOST", "type": "Light Duty", "max_load_capacity_kg": 2990.0, "acquisition_cost": 850000.0},
    {"name_model": "Mahindra Furio 14", "type": "Medium Duty", "max_load_capacity_kg": 14000.0, "acquisition_cost": 2200000.0},
    {"name_model": "Eicher Pro 2049", "type": "Light Duty", "max_load_capacity_kg": 3500.0, "acquisition_cost": 1100000.0},
    {"name_model": "BharatBenz 2823R", "type": "Heavy Duty", "max_load_capacity_kg": 28000.0, "acquisition_cost": 3800000.0},
    {"name_model": "Tata Ace Gold", "type": "Light Duty", "max_load_capacity_kg": 750.0, "acquisition_cost": 500000.0},
    {"name_model": "Mahindra Blazo X 35", "type": "Heavy Duty", "max_load_capacity_kg": 35000.0, "acquisition_cost": 4200000.0},
    {"name_model": "Ashok Leyland Partner", "type": "Medium Duty", "max_load_capacity_kg": 7200.0, "acquisition_cost": 1400000.0},
    {"name_model": "Eicher Pro 6055", "type": "Heavy Duty", "max_load_capacity_kg": 55000.0, "acquisition_cost": 4800000.0},
    {"name_model": "Mahindra Bolero Pik-Up", "type": "Light Duty", "max_load_capacity_kg": 1700.0, "acquisition_cost": 900000.0},
]

REGIONS = ["Mumbai", "Delhi-NCR", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"]
VEHICLE_STATES = [
    VehicleStatus.AVAILABLE,
    VehicleStatus.AVAILABLE,
    VehicleStatus.AVAILABLE,
    VehicleStatus.ON_TRIP,
    VehicleStatus.IN_SHOP,
    VehicleStatus.RETIRED
]

# Define drivers to generate
DRIVER_NAMES = [
    "Rajesh Kumar", "Amit Sharma", "Vijay Singh", "Sunita Rao", "Sanjay Patel",
    "Ramesh Chen", "Anil Deshmukh", "Gurpreet Singh", "Vikram Rathore", "Manoj Tiwari",
    "Santosh Hegde", "Arjun Yadav", "Pradeep Joshi", "Satish Reddy", "Harish Nair",
    "Devendra Prasad", "Karan Johar", "Balaji Viswanathan", "Yashwanth Gowda", "Nitin Gadkari"
]

DRIVER_STATES = [
    DriverStatus.AVAILABLE,
    DriverStatus.AVAILABLE,
    DriverStatus.AVAILABLE,
    DriverStatus.ON_TRIP,
    DriverStatus.OFF_DUTY,
    DriverStatus.SUSPENDED
]

async def seed_mock_data():
    print("Connecting to database to seed mock vehicles and drivers...")
    async with async_session_maker() as session:
        # 1. Fetch Company
        result = await session.execute(select(Company).filter(Company.name == "TransitOps Demo"))
        company = result.scalars().first()
        if not company:
            # Seed the company if it doesn't exist
            company = Company(name="TransitOps Demo")
            session.add(company)
            await session.commit()
            await session.refresh(company)
            print("Company 'TransitOps Demo' seeded.")

        print(f"Using Company ID: {company.id}")

        # 2. Seed Vehicles
        vehicles_added = 0
        for i in range(1, 21):  # Seed 20 mock vehicles
            state_code = f"MH" if i % 3 == 0 else (f"DL" if i % 3 == 1 else f"KA")
            reg_num = f"{state_code}{i:02d}-TRK-{1000 + i}"
            
            # Check if vehicle registration number already exists
            existing_v = await session.execute(select(Vehicle).filter(Vehicle.registration_number == reg_num))
            if existing_v.scalars().first():
                continue
                
            tpl = random.choice(VEHICLE_TEMPLATES)
            status = random.choice(VEHICLE_STATES)
            
            # Retired or In Shop vehicles should have higher odometers generally
            odometer = round(random.uniform(5000, 150000), 1)
            
            vehicle = Vehicle(
                registration_number=reg_num,
                name_model=tpl["name_model"],
                type=tpl["type"],
                max_load_capacity_kg=tpl["max_load_capacity_kg"],
                acquisition_cost=tpl["acquisition_cost"],
                region=random.choice(REGIONS),
                status=status,
                odometer_km=odometer,
                company_id=company.id
            )
            session.add(vehicle)
            vehicles_added += 1

        # 3. Seed Drivers
        drivers_added = 0
        for i, name in enumerate(DRIVER_NAMES, start=1):
            lic_num = f"IND-{1000000 + i * 873}"
            
            # Check if driver license number already exists
            existing_d = await session.execute(select(Driver).filter(Driver.license_number == lic_num))
            if existing_d.scalars().first():
                continue
                
            # Random license category
            lic_cat = "HMV" if i % 3 != 0 else "LMV"
            
            # Expiry date: most in future, a couple in past to test validation rules
            if i % 8 == 0:
                # Expired license (between 10 and 100 days ago)
                expiry = date.today() - timedelta(days=random.randint(10, 100))
            else:
                # Valid license (between 30 and 1000 days in future)
                expiry = date.today() + timedelta(days=random.randint(30, 1000))
                
            status = random.choice(DRIVER_STATES)
            contact = f"98765{i:05d}"
            
            driver = Driver(
                full_name=name,
                license_number=lic_num,
                license_category=lic_cat,
                license_expiry_date=expiry,
                contact_number=contact,
                status=status,
                company_id=company.id
            )
            session.add(driver)
            drivers_added += 1

        await session.commit()
        print(f"Seeded {vehicles_added} new vehicles.")
        print(f"Seeded {drivers_added} new drivers.")
        print("Mock data seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_mock_data())
