"""CustomerProfile model."""

from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.persistence.database import Base
import uuid as uuid_lib


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(UUID(as_uuid=False), unique=True, nullable=False, default=lambda: str(uuid_lib.uuid4()), index=True)
    
    # Contact information
    company_name = Column(String, nullable=False, unique=True, index=True)  # Required, unique, indexed for lookups
    contact_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="customer_profile", foreign_keys="User.customer_profile_id")  # Many users per profile
    jobs = relationship(
        "PrintingJob", 
        back_populates="customer_profile"
    )

