"""PrinterProfile model."""

from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.sql import func
from app.persistence.database import Base
import uuid as uuid_lib


class PrinterProfile(Base):
    __tablename__ = "printer_profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(UUID(as_uuid=False), unique=True, nullable=False, default=lambda: str(uuid_lib.uuid4()), index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Business information
    business_name = Column(String, nullable=False)
    contact_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    
    # Capabilities
    capabilities = Column(Text, nullable=True)  # JSON string or comma-separated
    supported_product_types = Column(Text, nullable=False)  # JSON array of ProductType
    
    # Quantity ranges
    min_quantity = Column(Integer, nullable=True)
    max_quantity = Column(Integer, nullable=True)
    
    # Geography
    service_areas = Column(Text, nullable=True)  # JSON array of locations/regions
    
    # Payment terms
    payment_terms = Column(Text, nullable=False)  # Payment terms description
    
    # Notification preferences
    email_notifications = Column(Boolean, default=True, nullable=False)
    whatsapp_notifications = Column(Boolean, default=False, nullable=False)
    whatsapp_number = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="printer_profile")
    bids = relationship(
        "Bid", 
        back_populates="printer_profile", 
        primaryjoin="Bid.printer_id == foreign(PrinterProfile.user_id)",
        viewonly=True
    )
    ratings = relationship("Rating", back_populates="printer_profile")

