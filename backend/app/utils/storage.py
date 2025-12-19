"""Storage utility for MinIO/S3 file operations."""

import os
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from typing import Optional
import uuid
from pathlib import Path

# MinIO/S3 configuration from environment
STORAGE_ENDPOINT = os.getenv("STORAGE_ENDPOINT", "http://localhost:9000")
STORAGE_ACCESS_KEY = os.getenv("STORAGE_ACCESS_KEY", "minioadmin")
STORAGE_SECRET_KEY = os.getenv("STORAGE_SECRET_KEY", "minioadmin")
STORAGE_BUCKET_NAME = os.getenv("STORAGE_BUCKET_NAME", "printing-marketplace")
STORAGE_USE_SSL = os.getenv("STORAGE_USE_SSL", "false").lower() == "true"

# Initialize S3 client (works with MinIO)
s3_client = boto3.client(
    's3',
    endpoint_url=STORAGE_ENDPOINT,
    aws_access_key_id=STORAGE_ACCESS_KEY,
    aws_secret_access_key=STORAGE_SECRET_KEY,
    config=Config(signature_version='s3v4'),
    use_ssl=STORAGE_USE_SSL
)


def ensure_bucket_exists():
    """Ensure the bucket exists, create if it doesn't."""
    try:
        s3_client.head_bucket(Bucket=STORAGE_BUCKET_NAME)
    except ClientError:
        # Bucket doesn't exist, create it
        try:
            s3_client.create_bucket(Bucket=STORAGE_BUCKET_NAME)
        except ClientError as e:
            # Bucket might have been created by another process
            if e.response['Error']['Code'] != 'BucketAlreadyOwnedByYou':
                raise


def upload_file(file_content: bytes, file_key: str, content_type: Optional[str] = None) -> str:
    """
    Upload a file to MinIO/S3.
    
    Args:
        file_content: File content as bytes
        file_key: S3 object key (path in bucket)
        content_type: Optional MIME type
    
    Returns:
        S3 object key
    """
    ensure_bucket_exists()
    
    extra_args = {}
    if content_type:
        extra_args['ContentType'] = content_type
    
    s3_client.put_object(
        Bucket=STORAGE_BUCKET_NAME,
        Key=file_key,
        Body=file_content,
        **extra_args
    )
    
    return file_key


def generate_presigned_url(file_key: str, expiration: int = 3600) -> str:
    """
    Generate a presigned URL for file access.
    
    Args:
        file_key: S3 object key
        expiration: URL expiration time in seconds (default 1 hour)
    
    Returns:
        Presigned URL
    """
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': STORAGE_BUCKET_NAME, 'Key': file_key},
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        raise Exception(f"Error generating presigned URL: {str(e)}")


def delete_file(file_key: str) -> bool:
    """
    Delete a file from MinIO/S3.
    
    Args:
        file_key: S3 object key
    
    Returns:
        True if successful, False otherwise
    """
    try:
        s3_client.delete_object(Bucket=STORAGE_BUCKET_NAME, Key=file_key)
        return True
    except ClientError:
        return False


def file_exists(file_key: str) -> bool:
    """
    Check if a file exists in MinIO/S3.
    
    Args:
        file_key: S3 object key
    
    Returns:
        True if file exists, False otherwise
    """
    try:
        s3_client.head_object(Bucket=STORAGE_BUCKET_NAME, Key=file_key)
        return True
    except ClientError:
        return False


def get_file_content(file_key: str) -> bytes:
    """
    Get file content from MinIO/S3.
    
    Args:
        file_key: S3 object key
    
    Returns:
        File content as bytes
    """
    try:
        response = s3_client.get_object(Bucket=STORAGE_BUCKET_NAME, Key=file_key)
        return response['Body'].read()
    except ClientError as e:
        raise Exception(f"Error retrieving file: {str(e)}")


def generate_file_key(user_id: int, filename: str) -> str:
    """
    Generate a unique file key for storage.
    
    Args:
        user_id: User ID
        filename: Original filename
    
    Returns:
        S3 object key (e.g., "users/123/uuid-filename.pdf")
    """
    file_ext = Path(filename).suffix.lower()
    unique_id = str(uuid.uuid4())
    return f"users/{user_id}/{unique_id}{file_ext}"

