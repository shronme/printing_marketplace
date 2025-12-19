"""Pydantic schemas for PrintingJob."""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from app.utils.enums import JobState, ProductType


class PrintingJobCreate(BaseModel):
    """Schema for creating a new printing job."""
    product_type: ProductType
    quantity: int = Field(gt=0, description="Quantity must be greater than 0")
    due_date: datetime
    description: Optional[str] = None
    special_instructions: Optional[str] = None
    file_url: Optional[str] = None
    bidding_duration_hours: int = Field(default=24, gt=0, description="Bidding duration in hours")
    delivery_location: Optional[str] = None
    pickup_preferred: bool = False

    @field_validator('due_date')
    @classmethod
    def validate_due_date(cls, v: datetime) -> datetime:
        """Validate that due_date is in the future."""
        if v <= datetime.now(v.tzinfo) if v.tzinfo else v <= datetime.utcnow():
            raise ValueError("due_date must be in the future")
        return v


class PrintingJobUpdate(BaseModel):
    """Schema for updating a printing job (only allowed in DRAFT state)."""
    product_type: Optional[ProductType] = None
    quantity: Optional[int] = Field(default=None, gt=0)
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    special_instructions: Optional[str] = None
    file_url: Optional[str] = None
    bidding_duration_hours: Optional[int] = Field(default=None, gt=0)
    delivery_location: Optional[str] = None
    pickup_preferred: Optional[bool] = None

    @field_validator('due_date')
    @classmethod
    def validate_due_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        """Validate that due_date is in the future if provided."""
        if v is not None:
            if v <= datetime.now(v.tzinfo) if v.tzinfo else v <= datetime.utcnow():
                raise ValueError("due_date must be in the future")
        return v


class PrintingJobResponse(BaseModel):
    """Schema for printing job response."""
    id: int
    uuid: str
    customer_profile_id: int
    product_type: str
    quantity: int
    due_date: datetime
    description: Optional[str]
    special_instructions: Optional[str]
    file_url: Optional[str]
    bidding_duration_hours: int
    bidding_ends_at: Optional[datetime]
    delivery_location: Optional[str]
    pickup_preferred: bool
    state: str
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    closed_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class PrintingJobPublishRequest(BaseModel):
    """Schema for publishing a job (changing state from DRAFT to OPEN)."""
    pass  # No additional fields needed, just the action

