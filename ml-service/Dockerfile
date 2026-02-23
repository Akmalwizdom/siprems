# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim AS runner

WORKDIR /app

# Create a non-root user
RUN groupadd -r python-group && useradd -r -g python-group python-user

# Copy installed packages from builder
COPY --from=builder /root/.local /home/python-user/.local
ENV PATH=/home/python-user/.local/bin:$PATH

# Copy application code
COPY --chown=python-user:python-group . .

# Create models directory and set permissions
RUN mkdir -p /app/models && chown -R python-user:python-group /app/models

# Make startup script executable
RUN chmod +x /app/start.sh

# Switch to non-root user
USER python-user

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/health')" || exit 1

EXPOSE 8001

# Run startup script
CMD ["/bin/sh", "/app/start.sh"]
