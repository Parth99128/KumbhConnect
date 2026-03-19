from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from models import User, LocationLog, Base
from schemas import LocationUpdate, MarkLostRequest, UserLocationResponse, DroneDensityPayload, DensityLevel
from database import engine, get_db

# Try to create tables, but don't crash if the PostGIS database is not running yet
# This allows you to view the API documentation at http://localhost:8000/docs
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not connect to PostgreSQL/PostGIS. Models were not created. ({e})")

app = FastAPI(title="KumbhConnect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@app.post("/update_location", status_code=status.HTTP_200_OK)
async def update_location(data: LocationUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # PostGIS: Create a WGS 84 point (Longitude, Latitude)
    point = func.ST_SetSRID(func.ST_MakePoint(data.longitude, data.latitude), 4326)
    
    # Update current state
    user.last_known_location = point
    user.last_active = func.now()
    if data.battery_level is not None:
        user.battery_level = data.battery_level

    # Record point in history table
    log_entry = LocationLog(
        user_id=data.user_id,
        location=point,
        battery_level=data.battery_level
    )
    db.add(log_entry)
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database update failed")
        
    return {"status": "success"}


@app.get("/group_locations/{group_id}", response_model=List[UserLocationResponse])
async def get_group_locations(group_id: int, db: Session = Depends(get_db)):
    users = db.query(
        User.id,
        User.name,
        func.ST_Y(User.last_known_location).label('latitude'),
        func.ST_X(User.last_known_location).label('longitude'),
        User.status,
        User.battery_level,
        User.last_active
    ).filter(User.group_id == group_id).all()
    
    if not users:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found or empty")
        
    return [
        UserLocationResponse(
            user_id=u.id,
            name=u.name,
            latitude=u.latitude,
            longitude=u.longitude,
            status=u.status,
            battery_level=u.battery_level,
            last_active=u.last_active
        ) for u in users
    ]


@app.post("/mark_lost", status_code=status.HTTP_200_OK)
async def mark_lost(data: MarkLostRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user.status = "lost"
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database fault")
        
    return {
        "status": "success", 
        "alert_triggered": True,
        "message": f"User {user.name} marked as lost."
    }

@app.post("/webhook/drone_density", status_code=status.HTTP_200_OK)
async def receive_drone_density(payload: DroneDensityPayload):
    # Only broadcast if the density is CRITICAL
    if payload.density_level == DensityLevel.CRITICAL:
        warning_payload = {
            "type": "DRONE_WARNING",
            "lat": payload.latitude,
            "lng": payload.longitude,
            "radius": payload.radius_meters
        }
        await manager.broadcast(warning_payload)
        return {"status": "success", "message": "CRITICAL alert broadcasted to clients payload"}
    
    return {"status": "success", "message": f"Data received (Level: {payload.density_level.value})"}

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We keep the connection open to send data.
            # We can also receive pings or ack messages from the client if needed.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

