"""User model."""

from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.persistence.database import Base
import uuid as uuid_lib

from app.utils.enums import UserRole


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(UUID(as_uuid=False), unique=True, nullable=False, default=lambda: str(uuid_lib.uuid4()), index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)  # Stores enum value as string
    customer_profile_id = Column(Integer, ForeignKey("customer_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer_profile = relationship("CustomerProfile", back_populates="users", foreign_keys=[customer_profile_id])  # One customer profile per user
    printer_profile = relationship("PrinterProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bids = relationship("Bid", back_populates="printer", foreign_keys="Bid.printer_id")

