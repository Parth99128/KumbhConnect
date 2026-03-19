from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer)
    name = Column(String)
    status = Column(String, default="active")
    battery_level = Column(Integer)
    last_active = Column(DateTime(timezone=True), server_default=func.now())
    last_known_location = Column(Geometry('POINT', srid=4326))

class LocationLog(Base):
    __tablename__ = "location_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location = Column(Geometry('POINT', srid=4326))
    battery_level = Column(Integer)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
