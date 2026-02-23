-- Create ML Metrics tracking table
CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_type VARCHAR(50) NOT NULL, -- 'prophet_store', 'prophet_category'
    target_id VARCHAR(100) NOT NULL, -- store_id or category_name
    version VARCHAR(50) NOT NULL,
    accuracy DOUBLE PRECISION,
    mape DOUBLE PRECISION,
    y_mean DOUBLE PRECISION,
    y_std DOUBLE PRECISION,
    data_points INTEGER,
    training_time_seconds DOUBLE PRECISION,
    quality_report JSONB,
    parameters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup of latest model metrics
CREATE INDEX idx_ml_metrics_target_created ON ml_model_metrics(target_id, created_at DESC);
CREATE INDEX idx_ml_metrics_type ON ml_model_metrics(model_type);

-- Table for Model Drift tracking
CREATE TABLE IF NOT EXISTS ml_drift_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id VARCHAR(100) NOT NULL, -- target_id from ml_model_metrics
    drift_score DOUBLE PRECISION, -- e.g., real-world MAPE vs training MAPE
    actual_mape DOUBLE PRECISION,
    data_drift_detected BOOLEAN DEFAULT FALSE,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    period_start DATE,
    period_end DATE
);

COMMENT ON TABLE ml_model_metrics IS 'Stores historical performance metrics for ML models';
COMMENT ON TABLE ml_drift_metrics IS 'Tracks prediction accuracy vs actual realizations to detect model drift';
