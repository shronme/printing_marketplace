# Printing Marketplace Backend

FastAPI backend for the printing marketplace platform.

## Quick Start

### Local Development

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/printing_marketplace"
FRONTEND_URL=http://localhost:3001
PORT=3000
```

4. Run migrations:
```bash
alembic upgrade head
```

5. Start server:
```bash
uvicorn app.main:app --reload --port 3000
```

## Railway Deployment

The backend is configured for Railway deployment:
- `requirements.txt` - Python dependencies
- `runtime.txt` - Python version
- `Procfile` - Start command
- `railway.toml` - Railway configuration

Railway will auto-detect Python and deploy automatically.

## Project Structure

```
backend/
├── app/
│   ├── api/          # API routes
│   ├── domain/       # Domain models
│   ├── services/     # Business logic
│   ├── persistence/  # Database layer
│   └── main.py       # FastAPI app entry point
├── alembic/          # Database migrations
├── requirements.txt  # Python dependencies
├── runtime.txt      # Python version
├── Procfile         # Railway start command
└── railway.toml     # Railway configuration
```

