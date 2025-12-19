"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.persistence.database import get_db
from app.models.user import User
from app.schemas import LoginRequest, LoginResponse, UserResponse
from app.utils.auth import create_access_token
from app.utils.enums import UserRole

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login or signup endpoint.
    
    If the email exists, the user is logged in.
    If the email doesn't exist, a new user is created with the specified role
    (defaults to CUSTOMER if not provided).
    
    Returns:
        JWT access token and user information
    """
    # Determine role - default to CUSTOMER if not provided
    role = request.role if request.role is not None else UserRole.CUSTOMER
    
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    
    if user is None:
        # Create new user
        user = User(
            email=request.email,
            role=role.value
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create JWT token
    token_data = {
        "sub": user.id,  # subject (user ID)
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(data=token_data)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            uuid=user.uuid,
            email=user.email,
            role=user.role,
            created_at=user.created_at
        )
    )

