"""Printing job management API routes."""

import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.persistence.database import get_db
from app.models.user import User
from app.models.printing_job import PrintingJob
from app.models.printer_profile import PrinterProfile
from app.models.customer_profile import CustomerProfile
from app.schemas.printing_job import (
    PrintingJobCreate,
    PrintingJobUpdate,
    PrintingJobResponse,
    PrintingJobPublishRequest
)
from app.utils.dependencies import get_current_user, require_role
from app.utils.enums import UserRole, JobState, ProductType

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post(
    "",
    response_model=PrintingJobResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_job(
    job_data: PrintingJobCreate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """
    Create a new printing job.
    
    Jobs are created in DRAFT state and must be published to become OPEN.
    Only customers can create jobs.
    """
    # Get customer profile for the current user
    if current_user.customer_profile_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found. Please create your profile first."
        )
    
    # Create job in DRAFT state
    job = PrintingJob(
        customer_profile_id=current_user.customer_profile_id,
        product_type=job_data.product_type.value,
        quantity=job_data.quantity,
        due_date=job_data.due_date,
        description=job_data.description,
        special_instructions=job_data.special_instructions,
        file_url=job_data.file_url,
        bidding_duration_hours=job_data.bidding_duration_hours,
        delivery_location=job_data.delivery_location,
        pickup_preferred=job_data.pickup_preferred,
        state=JobState.DRAFT.value
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    return PrintingJobResponse.model_validate(job)


@router.get(
    "/{job_uuid}",
    response_model=PrintingJobResponse,
    status_code=status.HTTP_200_OK
)
async def get_job(
    job_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific job by UUID.
    
    Customers can only view their own jobs.
    Printers can view OPEN jobs that match their profile.
    """
    user_role = UserRole(current_user.role)
    
    query = db.query(PrintingJob).filter(PrintingJob.uuid == job_uuid)
    
    # Customers can only view jobs from their customer profile
    if user_role == UserRole.CUSTOMER:
        if current_user.customer_profile_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer profile not found"
            )
        query = query.filter(PrintingJob.customer_profile_id == current_user.customer_profile_id)
    # Printers can only view OPEN jobs (matching logic is handled in the matching endpoint)
    elif user_role == UserRole.PRINTER:
        query = query.filter(PrintingJob.state == JobState.OPEN.value)
    
    job = query.first()
    
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return PrintingJobResponse.model_validate(job)


@router.get(
    "",
    response_model=List[PrintingJobResponse],
    status_code=status.HTTP_200_OK
)
async def list_jobs(
    state: Optional[JobState] = Query(None, description="Filter by job state"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List jobs.
    
    Customers see their own jobs (optionally filtered by state).
    Printers should use /api/jobs/matching to see jobs that match their profile.
    """
    user_role = UserRole(current_user.role)
    
    query = db.query(PrintingJob)
    
    if user_role == UserRole.CUSTOMER:
        # Customers see jobs from their customer profile
        if current_user.customer_profile_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer profile not found. Please create your profile first."
            )
        query = query.filter(PrintingJob.customer_profile_id == current_user.customer_profile_id)
        if state:
            query = query.filter(PrintingJob.state == state.value)
    elif user_role == UserRole.PRINTER:
        # Printers should use the matching endpoint, but we allow listing OPEN jobs here
        query = query.filter(PrintingJob.state == JobState.OPEN.value)
        if state and state != JobState.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Printers can only view OPEN jobs. Use /api/jobs/matching for matched jobs."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid user role"
        )
    
    jobs = query.order_by(PrintingJob.created_at.desc()).all()
    return [PrintingJobResponse.model_validate(job) for job in jobs]


@router.put(
    "/{job_uuid}",
    response_model=PrintingJobResponse,
    status_code=status.HTTP_200_OK
)
async def update_job(
    job_uuid: str,
    job_data: PrintingJobUpdate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """
    Update a printing job.
    
    Only allowed for jobs in DRAFT state.
    Only users from the same customer profile can update jobs.
    """
    # Get customer profile for the current user
    if current_user.customer_profile_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found. Please create your profile first."
        )
    
    job = db.query(PrintingJob).filter(
        PrintingJob.uuid == job_uuid,
        PrintingJob.customer_profile_id == current_user.customer_profile_id,
        PrintingJob.state == JobState.DRAFT.value
    ).first()
    
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission to update it"
        )
    
    # Update fields if provided
    if job_data.product_type is not None:
        job.product_type = job_data.product_type.value
    if job_data.quantity is not None:
        job.quantity = job_data.quantity
    if job_data.due_date is not None:
        job.due_date = job_data.due_date
    if job_data.description is not None:
        job.description = job_data.description
    if job_data.special_instructions is not None:
        job.special_instructions = job_data.special_instructions
    if job_data.file_url is not None:
        job.file_url = job_data.file_url
    if job_data.bidding_duration_hours is not None:
        job.bidding_duration_hours = job_data.bidding_duration_hours
    if job_data.delivery_location is not None:
        job.delivery_location = job_data.delivery_location
    if job_data.pickup_preferred is not None:
        job.pickup_preferred = job_data.pickup_preferred
    
    db.commit()
    db.refresh(job)
    
    return PrintingJobResponse.model_validate(job)


@router.delete(
    "/{job_uuid}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_job(
    job_uuid: str,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """
    Delete a printing job.
    
    Only allowed for jobs in DRAFT state.
    Only users from the same customer profile can delete jobs.
    """
    # Get customer profile for the current user
    if current_user.customer_profile_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found. Please create your profile first."
        )
    
    job = db.query(PrintingJob).filter(
        PrintingJob.uuid == job_uuid,
        PrintingJob.customer_profile_id == current_user.customer_profile_id,
        PrintingJob.state == JobState.DRAFT.value
    ).first()
    
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission to delete it"
        )
    
    db.delete(job)
    db.commit()
    
    return None


@router.post(
    "/{job_uuid}/publish",
    response_model=PrintingJobResponse,
    status_code=status.HTTP_200_OK
)
async def publish_job(
    job_uuid: str,
    publish_request: PrintingJobPublishRequest,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """
    Publish a job (change state from DRAFT to OPEN).
    
    Only users from the same customer profile can publish jobs.
    Validates that all required fields are present.
    Sets bidding_ends_at based on bidding_duration_hours.
    """
    # Get customer profile for the current user
    if current_user.customer_profile_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found. Please create your profile first."
        )
    
    job = db.query(PrintingJob).filter(
        PrintingJob.uuid == job_uuid,
        PrintingJob.customer_profile_id == current_user.customer_profile_id,
        PrintingJob.state == JobState.DRAFT.value
    ).first()
    
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission to publish it"
        )
    
    # Validate required fields
    if not job.product_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="product_type is required"
        )
    if not job.quantity or job.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="quantity must be greater than 0"
        )
    if not job.due_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="due_date is required"
        )
    if job.due_date <= datetime.now(job.due_date.tzinfo) if job.due_date.tzinfo else job.due_date <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="due_date must be in the future"
        )
    if not job.bidding_duration_hours or job.bidding_duration_hours <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="bidding_duration_hours must be greater than 0"
        )
    
    # Calculate bidding_ends_at
    # Use timezone-aware datetime if job.due_date is timezone-aware, otherwise use UTC
    if job.due_date.tzinfo:
        now = datetime.now(timezone.utc)
    else:
        now = datetime.utcnow()
    
    job.bidding_ends_at = now + timedelta(hours=job.bidding_duration_hours)
    
    # Change state to OPEN
    job.state = JobState.OPEN.value
    job.published_at = now
    
    db.commit()
    db.refresh(job)
    
    return PrintingJobResponse.model_validate(job)


def job_matches_printer(job: PrintingJob, printer_profile: PrinterProfile) -> bool:
    """
    Check if a job matches a printer's profile based on:
    1. Product type match
    2. Quantity range match
    3. Geography match (if both are specified)
    4. Capability match (optional, for future use)
    
    Returns:
        True if job matches printer profile, False otherwise
    """
    # 1. Product type match
    try:
        supported_types = json.loads(printer_profile.supported_product_types)
        if not isinstance(supported_types, list):
            return False
        if job.product_type not in supported_types:
            return False
    except (json.JSONDecodeError, TypeError):
        return False
    
    # 2. Quantity range match
    job_quantity = job.quantity
    if printer_profile.min_quantity is not None and job_quantity < printer_profile.min_quantity:
        return False
    if printer_profile.max_quantity is not None and job_quantity > printer_profile.max_quantity:
        return False
    
    # 3. Geography match (if both job and printer have location info)
    if job.delivery_location and printer_profile.service_areas:
        try:
            service_areas = json.loads(printer_profile.service_areas)
            if isinstance(service_areas, list) and len(service_areas) > 0:
                # Simple matching: check if job location contains any service area
                # or if any service area contains job location (case-insensitive)
                job_location_lower = job.delivery_location.lower()
                matches = any(
                    area.lower() in job_location_lower or job_location_lower in area.lower()
                    for area in service_areas
                    if isinstance(area, str)
                )
                if not matches:
                    return False
        except (json.JSONDecodeError, TypeError):
            # If service_areas is invalid JSON, skip geography matching
            pass
    
    # 4. Capability match (optional - for now we'll skip this as it's not clearly defined)
    # This can be enhanced later when capabilities are better defined
    
    return True


@router.get(
    "/matching",
    response_model=List[PrintingJobResponse],
    status_code=status.HTTP_200_OK
)
async def get_matching_jobs(
    current_user: User = Depends(require_role([UserRole.PRINTER])),
    db: Session = Depends(get_db)
):
    """
    Get jobs that match the printer's profile.
    
    Only returns OPEN jobs that match:
    - Product type (job.product_type in printer.supported_product_types)
    - Quantity range (job.quantity within printer.min_quantity and max_quantity)
    - Geography (job.delivery_location matches printer.service_areas, if both are set)
    
    Only accessible by printers.
    """
    # Get printer profile
    printer_profile = db.query(PrinterProfile).filter(
        PrinterProfile.user_id == current_user.id
    ).first()
    
    if printer_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Printer profile not found. Please create your profile first."
        )
    
    # Get all OPEN jobs
    open_jobs = db.query(PrintingJob).filter(
        PrintingJob.state == JobState.OPEN.value
    ).all()
    
    # Filter jobs that match the printer's profile
    matching_jobs = [
        job for job in open_jobs
        if job_matches_printer(job, printer_profile)
    ]
    
    # Sort by created_at (most recent first)
    matching_jobs.sort(key=lambda j: j.created_at, reverse=True)
    
    return [PrintingJobResponse.model_validate(job) for job in matching_jobs]

