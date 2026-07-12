import asyncio
import httpx
from pprint import pprint

async def test_flow():
    async with httpx.AsyncClient(base_url="http://localhost:8000/api/v1") as client:
        # 1. Login
        resp = await client.post("/login", data={"username": "admin@transitops.local", "password": "password123"})
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get trips
        resp = await client.get("/trips", headers=headers)
        trips = resp.json()["items"]
        if not trips:
            print("No trips found.")
            return
            
        trip_id = trips[0]["id"]
        print(f"Testing with Trip ID {trip_id}")
        
        # 3. Dispatch Trip
        resp = await client.post(f"/trips/{trip_id}/dispatch", headers=headers)
        print("Dispatch Response:", resp.status_code, resp.json())
        
        # 4. Cancel Trip (to reset it or test another state)
        # resp = await client.post(f"/trips/{trip_id}/cancel", headers=headers)
        # print("Cancel Response:", resp.status_code, resp.json())

if __name__ == "__main__":
    asyncio.run(test_flow())
