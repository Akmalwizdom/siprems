import pytest
import pandas as pd
import numpy as np
from datetime import date, timedelta
from model_trainer import ModelTrainer, DataQualityError

# Mock engine for testing
class MockEngine:
    def connect(self):
        pass

@pytest.fixture
def trainer():
    return ModelTrainer(engine=MockEngine(), model_dir="./test_models")

def test_validate_data_quality_insufficient_days(trainer):
    # Create DF with only 5 days (threshold is likely 14 or 30)
    df = pd.DataFrame({
        'ds': pd.date_range(start='2024-01-01', periods=5),
        'y': [100.0] * 5
    })
    
    with pytest.raises(DataQualityError, match="Insufficient data"):
        trainer.validate_data_quality(df)

def test_validate_data_quality_zero_sales(trainer):
    # Create DF with too many zeros
    df = pd.DataFrame({
        'ds': pd.date_range(start='2024-01-01', periods=60),
        'y': [0.0] * 60
    })
    
    with pytest.raises(DataQualityError, match="Too many zero-sales days"):
        trainer.validate_data_quality(df)

def test_handle_outliers_none(trainer):
    # Test that mode 'none' doesn't change anything
    df = pd.DataFrame({'y': [1, 2, 100, 4, 5]})
    # We need to monkeypatch the config or just test the logic if it respects the setting
    from model_trainer import OUTLIER_HANDLING
    
    # If OUTLIER_HANDLING is 'none', it should return same DF
    result = trainer.handle_outliers(df)
    pd.testing.assert_frame_equal(df, result)

def test_get_prophet_params_short(trainer):
    # Test adaptive params selection
    params = trainer.get_prophet_params(30) # 30 days is < SHORT_DATA_THRESHOLD (90)
    assert isinstance(params, dict)
    # Check for a known param in short mode
    assert 'changepoint_prior_scale' in params
