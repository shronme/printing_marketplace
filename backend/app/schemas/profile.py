"""Profile union response schemas."""

from pydantic import BaseModel
from typing import Optional

from app.schemas.customer_profile import CustomerProfileResponse
from app.schemas.printer_profile import PrinterProfileResponse


class ProfileResponse(BaseModel):
    """Union response for profile (customer or printer)."""
    customer_profile: Optional[CustomerProfileResponse] = None
    printer_profile: Optional[PrinterProfileResponse] = None

