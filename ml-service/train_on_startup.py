"""
Auto-train model on Docker startup
Checks if model exists and is fresh, trains if needed
"""
import os
import sys
import time
import logging
from datetime import datetime, timedelta

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MAX_MODEL_AGE_DAYS = 7  # Retrain if model older than this
STORE_ID = os.getenv('DEFAULT_STORE_ID', 'store_1')


def check_and_train():
    """Check model status and train if needed"""
    try:
        # Import here to avoid circular imports
        from model_trainer import ModelTrainer
        from sqlalchemy import create_engine
        import os
        
        DATABASE_URL = os.getenv("DATABASE_URL")
        if not DATABASE_URL:
            logger.error("DATABASE_URL environment variable is required")
            return
            
        engine = create_engine(DATABASE_URL)
        trainer = ModelTrainer(engine)
        
        logger.info(f"Checking model status for store: {STORE_ID}")
        
        # Try to load existing model
        model, metadata = trainer.load_model(STORE_ID)
        
        if model is None:
            logger.info("No model found. Starting initial training...")
            train_model_with_engine(engine)
            return
        
        # Check model age
        age_days = trainer._get_model_age_days(metadata)
        logger.info(f"Model found. Age: {age_days:.1f} days")
        
        if age_days > MAX_MODEL_AGE_DAYS:
            logger.info(f"Model is older than {MAX_MODEL_AGE_DAYS} days. Retraining...")
            train_model_with_engine(engine)
        else:
            logger.info(f"Model is fresh. Skipping training.")
            
    except Exception as e:
        logger.error(f"Error checking model: {e}")
        logger.info("Attempting to train anyway...")
        try:
            from sqlalchemy import create_engine
            import os
            DATABASE_URL = os.getenv("DATABASE_URL")
            if DATABASE_URL:
                engine = create_engine(DATABASE_URL)
                train_model_with_engine(engine)
        except Exception as train_e:
            logger.error(f"Training also failed: {train_e}")


def train_model_with_engine(engine):
    """Train the model with current data using provided engine"""
    try:
        from model_trainer import ModelTrainer
        from timezone_utils import get_current_date_wib
        
        trainer = ModelTrainer(engine)
        
        logger.info("Starting model training...")
        start_time = time.time()
        
        # Train with data up to today (WIB)
        end_date = get_current_date_wib()
        
        model, metadata = trainer.train_model(
            store_id=STORE_ID,
            end_date=end_date,
            force_retrain=False
        )
        
        elapsed = time.time() - start_time
        
        if model:
            accuracy = metadata.get('accuracy', 'N/A')
            data_points = metadata.get('data_points', 'N/A')
            logger.info(f"Training completed in {elapsed:.1f}s")
            logger.info(f"  - Accuracy: {accuracy}%")
            logger.info(f"  - Data points: {data_points}")
        else:
            logger.warning("Training returned no model")
            
    except Exception as e:
        logger.error(f"Training failed: {e}")
        # Don't exit with error - let the service start anyway
        # User can train manually later


def train_model():
    """Train the model with current data (legacy compatibility)"""
    try:
        from sqlalchemy import create_engine
        import os
        
        DATABASE_URL = os.getenv("DATABASE_URL")
        if not DATABASE_URL:
            logger.error("DATABASE_URL environment variable is required")
            return
            
        engine = create_engine(DATABASE_URL)
        train_model_with_engine(engine)
    except Exception as e:
        logger.error(f"Training failed: {e}")


def wait_for_database(max_retries=10, delay=3):
    """Wait for database connection to be available"""
    logger.info("Waiting for database connection...")
    
    for i in range(max_retries):
        try:
            from sqlalchemy import create_engine, text
            import os
            
            DATABASE_URL = os.getenv("DATABASE_URL")
            if not DATABASE_URL:
                raise ValueError("DATABASE_URL not set")
                
            engine = create_engine(DATABASE_URL)
            
            # Try a simple query using SQLAlchemy
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
                
            logger.info(f"Database connection established!")
            return True
        except Exception as e:
            error_msg = str(e)[:80]
            if i < max_retries - 1:
                logger.info(f"Database not ready ({error_msg}), retrying in {delay}s... ({i+1}/{max_retries})")
                time.sleep(delay)
            else:
                logger.error(f"Could not connect to database after {max_retries} attempts")
                logger.error(f"Last error: {e}")
                return False
    
    return False


def main():
    """Main entry point"""
    logger.info("=" * 60)
    logger.info("  SIPREMS ML Service - Startup Training Check")
    logger.info("=" * 60)
    
    # Check if auto-train is disabled via environment variable
    if os.getenv('SKIP_AUTO_TRAIN', '').lower() in ('true', '1', 'yes'):
        logger.info("Auto-train disabled via SKIP_AUTO_TRAIN environment variable")
        return
    
    # Wait for database to be ready
    if not wait_for_database():
        logger.warning("Proceeding without training due to database connection issues")
        return
    
    # Check and train if needed
    check_and_train()
    
    logger.info("Startup training check completed")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
