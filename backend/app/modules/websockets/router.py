from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Optional
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.db import get_db_session
from app.core.websockets import manager
from app.core.config import settings
from app.core.security import ALGORITHM
from app.models.core import User

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    token: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session)
):
    if not token:
        await websocket.close(code=1008)
        return
        
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
            
        result = await db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalars().first()
        if not user:
            await websocket.close(code=1008)
            return
            
        company_id = user.company_id
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, company_id)
    try:
        while True:
            # We don't expect the client to send us data (this is a push-only socket for now),
            # but we need to await receive_text() to keep the connection open and detect disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, company_id)
