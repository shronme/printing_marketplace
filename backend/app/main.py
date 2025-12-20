from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging
import sys
from dotenv import load_dotenv

from app.api import auth, profiles, jobs, uploads

load_dotenv()

# Configure logging to output to stdout/stderr for Railway
# Use DEBUG level to capture all logs including tracebacks
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
# Set uvicorn loggers to appropriate levels
logging.getLogger("uvicorn").setLevel(logging.INFO)
logging.getLogger("uvicorn.error").setLevel(logging.INFO)
logging.getLogger("uvicorn.access").setLevel(logging.INFO)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Printing Marketplace API",
    description="API for printing marketplace platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(jobs.router)
app.include_router(uploads.router)

@app.on_event("startup")
async def startup_event():
    logger.info("Printing Marketplace API starting up...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to log all unhandled exceptions with full stack traces.
    HTTPExceptions are handled by FastAPI by default, so this catches other exceptions.
    """
    # Skip HTTPExceptions - FastAPI handles those properly
    if isinstance(exc, HTTPException):
        raise exc
    
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}",
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "path": str(request.url.path),
            "method": request.method
        }
    )

# Health check endpoint
@app.get("/health")
async def health():
    logger.info("Health check requested")
    return {
        "status": "ok",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat()
    }

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Printing Marketplace API"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)

