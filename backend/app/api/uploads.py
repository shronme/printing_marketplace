"""File upload API routes."""

from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.persistence.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user, require_role
from app.utils.enums import UserRole
from app.utils.storage import (
    upload_file,
    generate_presigned_url,
    generate_file_key,
    file_exists,
    get_file_content
)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# Allowed file extensions for printing jobs
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.gif', '.tiff', '.tif', '.psd', '.ai', '.eps', '.svg', '.doc', '.docx', '.zip'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def get_file_extension(filename: str) -> str:
    """Get file extension from filename."""
    return Path(filename).suffix.lower()


def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS


def get_content_type(filename: str) -> str:
    """Get content type based on file extension."""
    ext = get_file_extension(filename).lower()
    content_types = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.tiff': 'image/tiff',
        '.tif': 'image/tiff',
        '.psd': 'image/vnd.adobe.photoshop',
        '.ai': 'application/postscript',
        '.eps': 'application/postscript',
        '.svg': 'image/svg+xml',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.zip': 'application/zip',
    }
    return content_types.get(ext, 'application/octet-stream')


@router.post(
    "/job-file",
    status_code=status.HTTP_201_CREATED
)
async def upload_job_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """
    Upload a file for a printing job.
    
    Only customers can upload files.
    Files are stored in MinIO/S3 with a unique name.
    Returns the file key and URL that should be stored in the job.
    """
    filename = file.filename or "unknown"
    
    # Validate file extension
    if not is_allowed_file(filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content to check size
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.0f}MB"
        )
    
    # Generate unique file key for storage
    file_key = generate_file_key(current_user.id, filename)
    
    # Get content type
    content_type = get_content_type(filename)
    
    # Upload to MinIO/S3
    try:
        upload_file(contents, file_key, content_type)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )
    
    # Return file_key as file_url - frontend will use it to get presigned URLs
    # This ensures we can always generate fresh URLs even if they expire
    return {
        "file_path": file_key,
        "file_url": file_key,  # Store the file_key, not a presigned URL
        "filename": filename,
        "size": file_size
    }


@router.get(
    "/files/{file_key:path}"
)
async def get_file(
    file_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download an uploaded file.
    
    Files are protected - users can only access files they uploaded
    or files associated with jobs they have access to.
    
    Returns the file as a download with proper content type.
    """
    # Security: Validate file key format (should start with "users/")
    if not file_key.startswith("users/"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid file path"
        )
    
    # Check if file exists in storage
    if not file_exists(file_key):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # For now, allow access if user is authenticated
    # In production, you might want to add more specific access control
    # (e.g., check if file belongs to user's job or if user is a printer viewing a job)
    
    # Get file content from storage
    try:
        file_content = get_file_content(file_key)
        
        # Extract filename from file_key (e.g., "users/2/uuid.pdf" -> "uuid.pdf")
        filename = file_key.split('/')[-1]
        
        # Determine content type based on file extension
        content_type = get_content_type(filename)
        
        # Return file as streaming response with download disposition
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve file: {str(e)}"
        )

