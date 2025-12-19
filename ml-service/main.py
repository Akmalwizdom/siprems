"""
Minimal FastAPI ML Service for Prophet Model Training & Prediction
Only contains ML-related endpoints, business logic moved to TypeScript backend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date
import os
import logging
from sqlalchemy import create_engine

# Import local modules
from model_trainer import ModelTrainer
from predictor import predictor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Prophet ML Service",
    description="Microservice for Prophet model training and prediction",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)

# Initialize trainer
trainer = ModelTrainer(engine)


# ===== REQUEST MODELS =====

class TrainRequest(BaseModel):
    store_id: str
    end_date: Optional[str] = None
    force_retrain: bool = False


class EventInput(BaseModel):
    date: str
    type: str
    impact: float


class PredictRequest(BaseModel):
    store_id: str
    periods: int = 30
    events: List[EventInput] = []


# ===== ENDPOINTS =====

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "ml-service"}


@app.post("/ml/train")
def train_model(req: TrainRequest):
    """
    Train Prophet model for a specific store
    
    Args:
        store_id: Store identifier
        end_date: Optional end date for training data (YYYY-MM-DD)
        force_retrain: Force retraining even if model exists
    
    Returns:
        Model metadata including accuracy, MAPE, etc.
    """
    try:
        logger.info(f"Training model for store {req.store_id}")
        
        # Parse end_date if provided
        end_date_obj = None
        if req.end_date:
            try:
                from datetime import datetime
                end_date_obj = datetime.fromisoformat(req.end_date).date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        
        # Train model
        model, metadata = trainer.train_model(
            req.store_id,
            end_date=end_date_obj,
            force_retrain=req.force_retrain
        )
        
        logger.info(f"Training completed: accuracy={metadata.get('accuracy')}%")
        
        return {
            "status": "success",
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.post("/ml/predict")
def predict(req: PredictRequest):
    """
    Generate forecast predictions
    
    Args:
        store_id: Store identifier
        periods: Number of days to forecast
        events: List of calendar events to consider
    
    Returns:
        Forecast predictions with yhat, yhat_lower, yhat_upper
    """
    try:
        logger.info(f"Predicting {req.periods} periods for store {req.store_id}")
        
        # Load model
        model, metadata = trainer.load_model(req.store_id)
        
        if not model:
            raise HTTPException(
                status_code=404,
                detail=f"Model not found for store {req.store_id}. Train the model first."
            )
        
        # Convert events to dict format
        events_list = [
            {
                "date": event.date,
                "type": event.type,
                "impact": event.impact
            }
            for event in req.events
        ]
        
        # Generate predictions using predictor
        predictions = predictor.predict_with_events(
            model=model,
            metadata=metadata,
            periods=req.periods,
            events=events_list,
            start_date=None  # Start from tomorrow
        )
        
        logger.info(f"Prediction completed: {len(predictions)} data points")
        
        return {
            "status": "success",
            "predictions": predictions,
            "metadata": {
                "model_age_days": trainer._get_model_age_days(metadata),
                "model_accuracy": metadata.get("accuracy"),
                "periods": len(predictions),
                "events_applied": len(events_list)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/ml/model/{store_id}/status")
def get_model_status(store_id: str):
    """
    Get model status and metadata
    
    Args:
        store_id: Store identifier
    
    Returns:
        Model existence, age, accuracy, last trained time
    """
    try:
        model, metadata = trainer.load_model(store_id)
        
        if not model:
            return {
                "exists": False,
                "store_id": store_id
            }
        
        age_days = trainer._get_model_age_days(metadata)
        
        return {
            "exists": True,
            "store_id": store_id,
            "age_days": age_days,
            "accuracy": metadata.get("accuracy"),
            "train_mape": metadata.get("train_mape"),
            "validation_mape": metadata.get("validation_mape"),
            "last_trained": metadata.get("saved_at"),
            "data_points": metadata.get("data_points"),
            "cv": metadata.get("cv"),
        }
        
    except Exception as e:
        logger.error(f"Get model status failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get model status: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
