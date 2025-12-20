#!/bin/bash
set -e

# Force output to be unbuffered
export PYTHONUNBUFFERED=1

echo "=== Starting container ===" >&2
echo "PORT: ${PORT:-3000}" >&2

echo "=== Checking DATABASE_URL ===" >&2
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!" >&2
    exit 1
fi
echo "DATABASE_URL is set (length: ${#DATABASE_URL})" >&2

echo "=== Running database migrations ===" >&2
if alembic upgrade head 2>&1; then
    echo "=== Migrations completed successfully ===" >&2
else
    MIGRATION_EXIT_CODE=$?
    echo "ERROR: Database migrations failed with exit code $MIGRATION_EXIT_CODE!" >&2
    exit 1
fi

echo "=== Starting server on port ${PORT:-3000} ===" >&2
echo "=== Server startup command: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000} ===" >&2

# Test if we can import the app before starting
echo "=== Testing app import ===" >&2
python -c "from app.main import app; print('App imported successfully')" 2>&1

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to import app!" >&2
    exit 1
fi

# Start uvicorn (use exec to replace shell process)
echo "=== Launching uvicorn ===" >&2
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}
