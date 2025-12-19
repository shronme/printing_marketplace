from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from app.api import auth, profiles

load_dotenv()

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

# Health check endpoint
@app.get("/health")
async def health():
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
    uvicorn.run(app, host="0.0.0.0", port=port)

