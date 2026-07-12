import os
from redis.asyncio import Redis

redis_client = None

async def init_redis():
    global redis_client
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    redis_client = Redis.from_url(redis_url, decode_responses=True)

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()

def get_redis() -> Redis:
    return redis_client
