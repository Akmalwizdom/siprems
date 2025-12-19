#!/bin/sh
# Startup script for ML Service
# Runs auto-training check, then starts the FastAPI server

echo "=========================================="
echo "  SIPREMS ML Service Starting..."
echo "=========================================="

# Run auto-train check
echo "Running startup training check..."
python train_on_startup.py

# Start FastAPI server
echo "Starting FastAPI server on port 8001..."
exec uvicorn main:app --host 0.0.0.0 --port 8001
