#!/bin/bash
set -e

# Force output to be unbuffered
export PYTHONUNBUFFERED=1

# Use both stdout and stderr - Railway should capture both
echo "[STARTUP] Starting container..." 1>&2
echo "[STARTUP] PORT: ${PORT:-3000}" 1>&2

echo "[STARTUP] Checking DATABASE_URL..." 1>&2
if [ -z "$DATABASE_URL" ]; then
    echo "[ERROR] DATABASE_URL environment variable is not set!" 1>&2
    exit 1
fi
echo "[STARTUP] DATABASE_URL is set (length: ${#DATABASE_URL})" 1>&2

echo "[STARTUP] Running database migrations..." 1>&2
alembic upgrade head
MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "[STARTUP] Migrations completed successfully" 1>&2
else
    echo "[ERROR] Database migrations failed with exit code $MIGRATION_EXIT_CODE!" 1>&2
    exit 1
fi

echo "[STARTUP] Starting server on port ${PORT:-3000}" 1>&2
echo "[STARTUP] Server startup command: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}" 1>&2

# Test if we can import the app before starting
echo "[STARTUP] Testing app import..." 1>&2
python -c "from app.main import app; print('[STARTUP] App imported successfully')" 1>&2

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to import app!" 1>&2
    exit 1
fi

# Start uvicorn (use exec to replace shell process)
echo "[STARTUP] Launching uvicorn..." 1>&2
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}
