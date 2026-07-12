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

import json

async def broadcast_event(company_id: int, event_type: str, data: dict):
    """
    Publish an event to the Redis Pub/Sub channel so it can be picked up
    by WebSocket listeners on any API instance.
    """
    if redis_client:
        message = {
            "company_id": company_id,
            "payload": {
                "type": event_type,
                **data
            }
        }
        await redis_client.publish("transitops_events", json.dumps(message))
