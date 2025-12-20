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
alembic upgrade head 2>&1

MIGRATION_EXIT_CODE=$?
if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
    echo "ERROR: Database migrations failed with exit code $MIGRATION_EXIT_CODE!" >&2
    exit 1
fi

echo "=== Migrations completed successfully ===" >&2
echo "=== Starting server on port ${PORT:-3000} ===" >&2
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}
