"""Printer profile-related Pydantic schemas."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class PrinterProfileCreate(BaseModel):
    """Schema for creating/updating printer profile."""
    business_name: str = Field(..., min_length=1)
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    capabilities: Optional[str] = None
    supported_product_types: str = Field(..., description="JSON array of ProductType enum values")
    min_quantity: Optional[int] = Field(None, ge=1)
    max_quantity: Optional[int] = Field(None, ge=1)
    service_areas: Optional[str] = Field(None, description="JSON array of locations/regions")
    payment_terms: str = Field(..., min_length=1)
    email_notifications: bool = True
    whatsapp_notifications: bool = False
    whatsapp_number: Optional[str] = None


class PrinterProfileResponse(BaseModel):
    """Response schema for printer profile."""
    uuid: str
    user_id: int
    business_name: str
    contact_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    capabilities: Optional[str]
    supported_product_types: str
    min_quantity: Optional[int]
    max_quantity: Optional[int]
    service_areas: Optional[str]
    payment_terms: str
    email_notifications: bool
    whatsapp_notifications: bool
    whatsapp_number: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

