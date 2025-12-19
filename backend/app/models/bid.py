"""Bid model."""

from sqlalchemy import Column, String, DateTime, Integer, Numeric, Text, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.sql import func
from app.persistence.database import Base
import uuid as uuid_lib

from app.utils.enums import BidStatus


class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(UUID(as_uuid=False), unique=True, nullable=False, default=lambda: str(uuid_lib.uuid4()), index=True)
    job_id = Column(Integer, ForeignKey("printing_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    printer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Bid details
    price = Column(Numeric(10, 2), nullable=False)
    estimated_turnaround_days = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Payment terms (copied from printer profile at bid time)
    payment_terms = Column(Text, nullable=False)
    
    # Status
    status = Column(String, nullable=False, default=BidStatus.OPEN.value, index=True)  # Stores BidStatus enum value as string
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    job = relationship("PrintingJob", back_populates="bids")
    printer = relationship("User", back_populates="bids", foreign_keys=[printer_id])
    printer_profile = relationship(
        "PrinterProfile", 
        back_populates="bids", 
        primaryjoin="Bid.printer_id == foreign(PrinterProfile.user_id)",
        viewonly=True
    )
    
    __table_args__ = (
        UniqueConstraint('job_id', 'printer_id', name='uq_bid_job_printer'),
        CheckConstraint('price > 0', name='price_positive'),
        CheckConstraint('estimated_turnaround_days >= 0', name='turnaround_non_negative'),
    )

