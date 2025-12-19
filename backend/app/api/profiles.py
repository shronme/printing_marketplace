"""Profile management API routes."""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.persistence.database import get_db
from app.models.user import User
from app.models.customer_profile import CustomerProfile
from app.models.printer_profile import PrinterProfile
from app.schemas import (
    CustomerProfileCreate,
    CustomerProfileResponse,
    PrinterProfileCreate,
    PrinterProfileResponse,
    ProfileResponse
)
from app.utils.dependencies import get_current_user, require_role
from app.utils.enums import UserRole, ProductType

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileResponse, status_code=status.HTTP_200_OK)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile (customer or printer).
    
    Returns:
        Customer or printer profile depending on user role
    """
    user_role = UserRole(current_user.role)
    
    if user_role == UserRole.CUSTOMER:
        profile = current_user.customer_profile
        return ProfileResponse(
            customer_profile=CustomerProfileResponse.model_validate(profile) if profile else None
        )
    elif user_role == UserRole.PRINTER:
        profile = db.query(PrinterProfile).filter(
            PrinterProfile.user_id == current_user.id
        ).first()
        return ProfileResponse(
            printer_profile=PrinterProfileResponse.model_validate(profile) if profile else None
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user role"
        )


@router.post(
    "/customer",
    response_model=CustomerProfileResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_or_update_customer_profile(
    profile_data: CustomerProfileCreate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """
    Create or update customer profile.
    
    Only accessible by users with CUSTOMER role.
    If user already has a profile, it will be updated.
    If user doesn't have a profile, they will be linked to an existing profile with the same company_name,
    or a new profile will be created if no matching company_name exists.
    """
    # Check if user already has a profile
    profile = current_user.customer_profile
    
    if profile is None:
        # Check if a profile with this company_name already exists
        existing_profile = db.query(CustomerProfile).filter(
            CustomerProfile.company_name == profile_data.company_name
        ).first()
        
        if existing_profile is not None:
            # Link user to existing profile
            current_user.customer_profile_id = existing_profile.id
            profile = existing_profile
        else:
            # Create new profile
            profile = CustomerProfile(
                company_name=profile_data.company_name,
                contact_name=profile_data.contact_name,
                phone=profile_data.phone,
                address=profile_data.address
            )
            db.add(profile)
            db.flush()  # Flush to get the profile ID
            current_user.customer_profile_id = profile.id
    else:
        # Update existing profile (shared by all users in the same company)
        if profile_data.company_name is not None:
            profile.company_name = profile_data.company_name
        if profile_data.contact_name is not None:
            profile.contact_name = profile_data.contact_name
        if profile_data.phone is not None:
            profile.phone = profile_data.phone
        if profile_data.address is not None:
            profile.address = profile_data.address
    
    db.commit()
    db.refresh(profile)
    
    return CustomerProfileResponse.model_validate(profile)


@router.post(
    "/printer",
    response_model=PrinterProfileResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_or_update_printer_profile(
    profile_data: PrinterProfileCreate,
    current_user: User = Depends(require_role([UserRole.PRINTER])),
    db: Session = Depends(get_db)
):
    """
    Create or update printer profile.
    
    Only accessible by users with PRINTER role.
    If profile exists, it will be updated; otherwise, a new one is created.
    
    Validates:
    - business_name is required
    - supported_product_types must be valid JSON array
    - payment_terms is required
    - max_quantity must be >= min_quantity if both are provided
    """
    # Validate quantity range if both are provided
    if profile_data.min_quantity is not None and profile_data.max_quantity is not None:
        if profile_data.max_quantity < profile_data.min_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="max_quantity must be greater than or equal to min_quantity"
            )
    
    # Validate supported_product_types is valid JSON
    try:
        product_types_list = json.loads(profile_data.supported_product_types)
        if not isinstance(product_types_list, list):
            raise ValueError("supported_product_types must be a JSON array")
        # Validate each product type is a valid enum value
        for pt in product_types_list:
            ProductType(pt)  # Will raise ValueError if invalid
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid supported_product_types: {str(e)}"
        )
    
    # Validate service_areas if provided
    service_areas_value = None
    if profile_data.service_areas is not None:
        try:
            service_areas_list = json.loads(profile_data.service_areas)
            if not isinstance(service_areas_list, list):
                raise ValueError("service_areas must be a JSON array")
            service_areas_value = profile_data.service_areas
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid service_areas: {str(e)}"
            )
    
    # Check if profile already exists
    profile = db.query(PrinterProfile).filter(
        PrinterProfile.user_id == current_user.id
    ).first()
    
    if profile is None:
        # Create new profile
        profile = PrinterProfile(
            user_id=current_user.id,
            business_name=profile_data.business_name,
            contact_name=profile_data.contact_name,
            phone=profile_data.phone,
            email=str(profile_data.email) if profile_data.email else None,
            address=profile_data.address,
            capabilities=profile_data.capabilities,
            supported_product_types=profile_data.supported_product_types,
            min_quantity=profile_data.min_quantity,
            max_quantity=profile_data.max_quantity,
            service_areas=service_areas_value,
            payment_terms=profile_data.payment_terms,
            email_notifications=profile_data.email_notifications,
            whatsapp_notifications=profile_data.whatsapp_notifications,
            whatsapp_number=profile_data.whatsapp_number
        )
        db.add(profile)
    else:
        # Update existing profile
        profile.business_name = profile_data.business_name
        if profile_data.contact_name is not None:
            profile.contact_name = profile_data.contact_name
        if profile_data.phone is not None:
            profile.phone = profile_data.phone
        if profile_data.email is not None:
            profile.email = str(profile_data.email)
        if profile_data.address is not None:
            profile.address = profile_data.address
        if profile_data.capabilities is not None:
            profile.capabilities = profile_data.capabilities
        profile.supported_product_types = profile_data.supported_product_types
        if profile_data.min_quantity is not None:
            profile.min_quantity = profile_data.min_quantity
        if profile_data.max_quantity is not None:
            profile.max_quantity = profile_data.max_quantity
        if profile_data.service_areas is not None:
            profile.service_areas = service_areas_value
        profile.payment_terms = profile_data.payment_terms
        profile.email_notifications = profile_data.email_notifications
        profile.whatsapp_notifications = profile_data.whatsapp_notifications
        if profile_data.whatsapp_number is not None:
            profile.whatsapp_number = profile_data.whatsapp_number
    
    db.commit()
    db.refresh(profile)
    
    return PrinterProfileResponse.model_validate(profile)

