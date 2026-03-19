from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class LocationUpdate(BaseModel):
    user_id: int
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    battery_level: Optional[int] = Field(None, ge=0, le=100)

class MarkLostRequest(BaseModel):
    user_id: int

class UserLocationResponse(BaseModel):
    user_id: int
    name: str
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    battery_level: Optional[int]
    last_active: Optional[datetime]

class DensityLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    CRITICAL = "CRITICAL"

class DroneDensityPayload(BaseModel):
    camera_id: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    density_level: DensityLevel
    radius_meters: int = Field(..., gt=0)
