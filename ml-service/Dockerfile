FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create models directory
RUN mkdir -p /app/models

# Make startup script executable
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 8001

# Run startup script (auto-train check + FastAPI server)
CMD ["/bin/sh", "/app/start.sh"]
