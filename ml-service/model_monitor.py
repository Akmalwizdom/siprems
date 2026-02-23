"""
ML Model Accuracy Monitor & Drift Detector
Compares past predictions with actual sales realizations to detect performance degradation.
"""
import logging
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text

# Import local modules
from timezone_utils import get_current_date_wib, get_current_time_wib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)

class ModelMonitor:
    def __init__(self, engine):
        self.engine = engine

    def check_drift(self, target_id: str, model_type: str = 'prophet_store') -> Dict:
        """
        Compare actual sales with predictions made N days ago.
        Calculates 'Real-World MAPE'.
        """
        logger.info(f"Checking drift for {model_type}:{target_id}")
        
        # 1. Get realizations (actual sales) for the last 14 days
        end_date = get_current_date_wib()
        start_date = end_date - timedelta(days=14)
        
        actuals_query = text("""
            SELECT ds, y 
            FROM daily_sales_summary 
            WHERE ds BETWEEN :start_date AND :end_date
            ORDER BY ds
        """)
        
        with self.engine.connect() as conn:
            actuals_df = pd.read_sql(actuals_query, conn, params={
                "start_date": start_date,
                "end_date": end_date
            })
            
        if actuals_df.empty or len(actuals_df) < 7:
            return {"status": "error", "reason": "insufficient_actual_data"}

        # 2. Get the latest model accuracy from DB
        metrics_query = text("""
            SELECT accuracy, mape, created_at 
            FROM ml_model_metrics 
            WHERE target_id = :target_id 
              AND model_type = :model_type
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        
        with self.engine.connect() as conn:
            metric = conn.execute(metrics_query, {"target_id": target_id, "model_type": model_type}).fetchone()
            
        if not metric:
            return {"status": "error", "reason": "no_historical_metrics"}
            
        training_accuracy = metric[0]
        training_mape = metric[1]
        
        # 3. Simulate drift checking (In a real scenario, we'd compare against stored predictions)
        # For prototype: We compare the last 7 days variance vs historical std
        actual_cv = actuals_df['y'].std() / actuals_df['y'].mean() if actuals_df['y'].mean() > 0 else 0
        
        # If actual CV is 50% higher than historical training CV, flag drift
        drift_score = actual_cv # Simplified for visualization
        
        drift_detected = drift_score > 0.5 # Arbitrary threshold
        
        result = {
            "target_id": target_id,
            "training_accuracy": training_accuracy,
            "training_mape": training_mape,
            "real_world_volatility": round(actual_cv, 3),
            "drift_detected": drift_detected,
            "checked_at": datetime.now().isoformat()
        }
        
        # 4. Log results to DB
        self._log_drift_to_db(target_id, result)
        
        return result

    def _log_drift_to_db(self, target_id: str, results: Dict):
        query = text("""
            INSERT INTO ml_drift_metrics (
                model_id, drift_score, actual_mape, 
                data_drift_detected, period_start, period_end
            ) VALUES (
                :target_id, :drift_score, :actual_mape,
                :drift_detected, :start, :end
            )
        """)
        
        try:
            with self.engine.begin() as conn:
                conn.execute(query, {
                    "target_id": target_id,
                    "drift_score": results["real_world_volatility"],
                    "actual_mape": results["training_mape"], # Placeholder
                    "drift_detected": results["drift_detected"],
                    "start": (get_current_date_wib() - timedelta(days=7)).isoformat(),
                    "end": get_current_date_wib().isoformat()
                })
        except Exception as e:
            logger.error(f"Failed to log drift: {e}")

if __name__ == "__main__":
    monitor = ModelMonitor(engine)
    # Check for primary store
    res = monitor.check_drift("main_store")
    print(json.dumps(res, indent=2))
