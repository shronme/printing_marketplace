from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.persistence.database import Base
import enum
import uuid

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    PRINTER = "PRINTER"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships will be added in EPIC 0
    # customer_profile = relationship("CustomerProfile", back_populates="user")
    # printer_profile = relationship("PrinterProfile", back_populates="user")

# Add your other models here (CustomerProfile, PrinterProfile, etc.)
# We'll create these in EPIC 0

