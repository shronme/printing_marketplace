"""Authentication utilities for JWT token handling."""

from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError, ExpiredSignatureError
import os
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing claims (typically user_id, email, role)
        expires_delta: Optional timedelta for expiration. Defaults to ACCESS_TOKEN_EXPIRE_HOURS
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload if valid, None otherwise
    """
    if not token or not isinstance(token, str):
        print(f"Invalid token type or empty token")
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        print(f"JWT token has expired")
        return None
    except JWTError as e:
        # Log the error for debugging (in production, you might want to use a logger)
        print(f"JWT verification failed: {type(e).__name__}: {str(e)}")
        return None
    except Exception as e:
        # Catch any other exceptions (e.g., malformed token)
        print(f"Token verification error: {type(e).__name__}: {str(e)}")
        return None

