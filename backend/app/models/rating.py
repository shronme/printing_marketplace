"""Rating model."""

from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.persistence.database import Base
import uuid as uuid_lib


class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(UUID(as_uuid=False), unique=True, nullable=False, default=lambda: str(uuid_lib.uuid4()), index=True)
    job_id = Column(Integer, ForeignKey("printing_jobs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    printer_profile_id = Column(Integer, ForeignKey("printer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Rating details
    rating = Column(Integer, nullable=False)  # 1-5 stars
    feedback = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    printer_profile = relationship("PrinterProfile", back_populates="ratings")
    customer = relationship("User", foreign_keys=[customer_id])
    job = relationship("PrintingJob", foreign_keys=[job_id])
    
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='rating_range'),
    )

