"""Customer profile-related Pydantic schemas."""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CustomerProfileCreate(BaseModel):
    """Schema for creating/updating customer profile."""
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerProfileResponse(BaseModel):
    """Response schema for customer profile."""
    uuid: str
    user_id: int
    company_name: Optional[str]
    contact_name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

