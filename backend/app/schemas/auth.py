"""Authentication-related Pydantic schemas."""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from app.utils.enums import UserRole


class LoginRequest(BaseModel):
    """Request schema for login endpoint."""
    email: EmailStr
    role: Optional[UserRole] = None  # Optional: if provided, validates against user's role


class UserResponse(BaseModel):
    """Response schema for user information."""
    id: int
    uuid: str
    email: str
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Response schema for login endpoint."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class SignupRequest(BaseModel):
    """Request schema for signup endpoint."""
    email: EmailStr
    role: UserRole  # Required for signup
    company_name: Optional[str] = None  # Required for CUSTOMER role signup


class LogoutResponse(BaseModel):
    """Response schema for logout endpoint."""
    message: str = "Successfully logged out"

