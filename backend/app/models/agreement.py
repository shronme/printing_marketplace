"""Agreement model."""

from sqlalchemy import Column, String, DateTime, Integer, Numeric, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.persistence.database import Base
import uuid as uuid_lib


class Agreement(Base):
    __tablename__ = "agreements"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(UUID(as_uuid=False), unique=True, nullable=False, default=lambda: str(uuid_lib.uuid4()), index=True)
    job_id = Column(Integer, ForeignKey("printing_jobs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    bid_id = Column(Integer, ForeignKey("bids.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    printer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Immutable record of agreement details
    agreed_price = Column(Numeric(10, 2), nullable=False)
    agreed_turnaround_days = Column(Integer, nullable=False)
    payment_terms = Column(Text, nullable=False)
    customer_confirmed = Column(Boolean, nullable=False, default=False)
    confirmation_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps (immutable after creation)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    job = relationship("PrintingJob", foreign_keys=[job_id])
    bid = relationship("Bid", foreign_keys=[bid_id])
    customer = relationship("User", foreign_keys=[customer_id])
    printer = relationship("User", foreign_keys=[printer_id])

