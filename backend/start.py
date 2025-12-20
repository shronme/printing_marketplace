#!/usr/bin/env python3
"""Startup script that runs migrations and starts the server"""
import os
import sys
import subprocess

def log(message):
    """Print message with flush to ensure it appears in logs"""
    print(f"[STARTUP] {message}", flush=True)

def main():
    log("Starting container...")
    port = os.getenv("PORT", "3000")
    log(f"PORT: {port}")
    
    # Check DATABASE_URL
    if not os.getenv("DATABASE_URL"):
        log("ERROR: DATABASE_URL environment variable is not set!")
        sys.exit(1)
    log("DATABASE_URL is set")
    
    # Run migrations
    log("Running database migrations...")
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=False,  # Let output go to stdout/stderr
        text=True
    )
    
    if result.returncode != 0:
        log(f"ERROR: Database migrations failed with exit code {result.returncode}!")
        sys.exit(1)
    
    log("Migrations completed successfully")
    
    # Test app import
    log("Testing app import...")
    try:
        from app.main import app
        log("App imported successfully")
    except Exception as e:
        log(f"ERROR: Failed to import app: {e}")
        sys.exit(1)
    
    # Start uvicorn
    log(f"Starting server on port {port}...")
    log("Launching uvicorn...")
    
    # Use exec to replace this process with uvicorn
    os.execvp("uvicorn", [
        "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", port
    ])

if __name__ == "__main__":
    main()
