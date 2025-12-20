"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.persistence.database import get_db
from app.models.user import User
from app.models.customer_profile import CustomerProfile
from app.schemas import LoginRequest, LoginResponse, LogoutResponse, SignupRequest, UserResponse
from app.utils.auth import create_access_token
from app.utils.dependencies import get_current_user
from app.utils.enums import UserRole

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint for existing users.
    
    If the email exists, the user is logged in.
    If the email doesn't exist, returns 404 Not Found.
    
    If a role is provided in the request, it will be validated against the user's actual role.
    If roles don't match, returns 400 Bad Request.
    
    Returns:
        JWT access token and user information
    """
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please sign up."
        )
    
    # If role provided, validate it matches the user's role
    if request.role is not None:
        user_role = UserRole(user.role)
        if user_role != request.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role mismatch. Please use the correct role for your account."
            )
    
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


@router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    Signup endpoint for new users.
    
    Creates a new user with the specified email, role, and company information.
    For CUSTOMER role, company_name is required.
    Users with the same company_name will be linked to the same customer profile.
    
    Returns:
        JWT access token and user information
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists. Please log in instead."
        )
    
    # Validate company_name for CUSTOMER role
    if request.role == UserRole.CUSTOMER and not request.company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="company_name is required for CUSTOMER role signup"
        )
    
    # For CUSTOMER role, check/create customer profile before creating user
    customer_profile_id = None
    if request.role == UserRole.CUSTOMER:
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
            db.flush()  # Flush to get the profile ID without committing
        
        customer_profile_id = customer_profile.id
    
    # Create new user with customer_profile_id already set (if CUSTOMER)
    user = User(
        email=request.email,
        role=request.role.value,
        customer_profile_id=customer_profile_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
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

