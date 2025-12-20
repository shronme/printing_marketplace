#!/bin/bash
set -e

echo "Starting container..."
echo "Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

echo "Running database migrations..."
alembic upgrade head

if [ $? -ne 0 ]; then
    echo "ERROR: Database migrations failed!"
    exit 1
fi

echo "Migrations completed successfully. Starting server on port ${PORT:-3000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}
