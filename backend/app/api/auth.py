"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.persistence.database import get_db
from app.models.user import User
from app.models.customer_profile import CustomerProfile
from app.schemas import LoginRequest, LoginResponse, LogoutResponse, UserResponse
from app.utils.auth import create_access_token
from app.utils.dependencies import get_current_user
from app.utils.enums import UserRole

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login or signup endpoint.
    
    If the email exists, the user is logged in.
    If the email doesn't exist, a new user is created with the specified role
    (defaults to CUSTOMER if not provided).
    
    For CUSTOMER role signup, company_name is required.
    Users with the same company_name will be linked to the same customer profile.
    
    Returns:
        JWT access token and user information
    """
    # Determine role - default to CUSTOMER if not provided
    role = request.role if request.role is not None else UserRole.CUSTOMER
    
    # Validate company_name for CUSTOMER role signup
    if role == UserRole.CUSTOMER and not request.company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="company_name is required for CUSTOMER role signup"
        )
    
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
        
        # For CUSTOMER role, create or link to existing customer profile
        if role == UserRole.CUSTOMER:
            # Check if a customer profile with this company_name already exists
            customer_profile = db.query(CustomerProfile).filter(
                CustomerProfile.company_name == request.company_name
            ).first()
            
            if customer_profile is None:
                # Create new customer profile
                customer_profile = CustomerProfile(
                    company_name=request.company_name
                )
                db.add(customer_profile)
                db.flush()  # Flush to get the profile ID
            
            # Link user to customer profile
            user.customer_profile_id = customer_profile.id
            db.commit()
    
    # Create JWT token
    token_data = {
        "sub": str(user.id),  # subject (user ID) - must be a string for JWT
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


@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint.
    
    Since JWT tokens are stateless, this endpoint primarily serves as a confirmation.
    The client should discard the token after calling this endpoint.
    
    Returns:
        Success message
    """
    return LogoutResponse(message="Successfully logged out")

