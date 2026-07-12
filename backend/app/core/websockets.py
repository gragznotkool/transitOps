import json
import asyncio
import logging
from typing import Dict, List
from fastapi import WebSocket
from app.core.cache import get_redis

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps company_id -> list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, company_id: int):
        await websocket.accept()
        if company_id not in self.active_connections:
            self.active_connections[company_id] = []
        self.active_connections[company_id].append(websocket)

    def disconnect(self, websocket: WebSocket, company_id: int):
        if company_id in self.active_connections:
            if websocket in self.active_connections[company_id]:
                self.active_connections[company_id].remove(websocket)
            if not self.active_connections[company_id]:
                del self.active_connections[company_id]

    async def broadcast_to_company(self, company_id: int, message: dict):
        if company_id in self.active_connections:
            for connection in self.active_connections[company_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to websocket: {e}")
                    self.disconnect(connection, company_id)

manager = ConnectionManager()

async def listen_for_redis_events():
    """
    Background task that listens to the Redis Pub/Sub channel and broadcasts
    events to the connected websockets for the corresponding company.
    """
    redis = get_redis()
    if not redis:
        return
        
    pubsub = redis.pubsub()
    await pubsub.subscribe("transitops_events")
    
    logger.info("Subscribed to transitops_events Redis channel")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                company_id = data.get("company_id")
                payload = data.get("payload")
                
                if company_id and payload:
                    await manager.broadcast_to_company(company_id, payload)
    except asyncio.CancelledError:
        logger.info("Redis event listener cancelled")
    except Exception as e:
        logger.error(f"Redis event listener error: {e}")
    finally:
        await pubsub.unsubscribe("transitops_events")
        await pubsub.close()
