"""PrintingJob model."""

from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.persistence.database import Base
import uuid as uuid_lib

from app.utils.enums import JobState, ProductType


class PrintingJob(Base):
    __tablename__ = "printing_jobs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(UUID(as_uuid=False), unique=True, nullable=False, default=lambda: str(uuid_lib.uuid4()), index=True)
    customer_profile_id = Column(Integer, ForeignKey("customer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Job details
    product_type = Column(String, nullable=False)  # Stores ProductType enum value as string
    quantity = Column(Integer, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=True)
    special_instructions = Column(Text, nullable=True)
    
    # File upload (stored as URL/path - implementation TBD)
    file_url = Column(String, nullable=True)
    
    # Bidding
    bidding_duration_hours = Column(Integer, nullable=False, default=24)
    bidding_ends_at = Column(DateTime(timezone=True), nullable=True)
    
    # Delivery
    delivery_location = Column(Text, nullable=True)
    pickup_preferred = Column(Boolean, default=False, nullable=False)
    
    # State
    state = Column(String, nullable=False, default=JobState.DRAFT.value, index=True)  # Stores JobState enum value as string
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    customer_profile = relationship("CustomerProfile", back_populates="jobs", foreign_keys=[customer_profile_id])
    bids = relationship("Bid", back_populates="job", cascade="all, delete-orphan", order_by="Bid.created_at")
    
    __table_args__ = (
        CheckConstraint('quantity > 0', name='quantity_positive'),
        CheckConstraint('bidding_duration_hours > 0', name='bidding_duration_positive'),
    )

