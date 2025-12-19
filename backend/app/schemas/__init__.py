"""Schemas package - exports all Pydantic schemas."""

from app.schemas.auth import LoginRequest, LoginResponse, LogoutResponse, UserResponse
from app.schemas.customer_profile import CustomerProfileCreate, CustomerProfileResponse
from app.schemas.printer_profile import PrinterProfileCreate, PrinterProfileResponse
from app.schemas.profile import ProfileResponse

__all__ = [
    # Auth schemas
    "LoginRequest",
    "LoginResponse",
    "LogoutResponse",
    "UserResponse",
    # Customer profile schemas
    "CustomerProfileCreate",
    "CustomerProfileResponse",
    # Printer profile schemas
    "PrinterProfileCreate",
    "PrinterProfileResponse",
    # Profile schemas
    "ProfileResponse",
]

