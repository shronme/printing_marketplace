FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy and set permissions for entrypoint scripts
COPY start.sh /start.sh
COPY start.py /start.py
RUN chmod +x /start.sh /start.py

# Expose port
EXPOSE 3000

# Use Python startup script (better log visibility in Railway)
CMD ["python", "/start.py"]