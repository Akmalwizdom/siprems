"""
Prophet Predictor Module
Handles forecast generation with event calendar integration
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from prophet import Prophet
from typing import List, Dict, Any, Optional
import logging
from timezone_utils import get_current_date_wib

logger = logging.getLogger(__name__)


class Predictor:
    """
    Handles Prophet model prediction with event calendar integration
    """
    
    def __init__(self):
        pass
    
    def generate_future_dataframe(
        self,
        model: Prophet,
        periods: int,
        events: List[Dict[str, Any]],
        metadata: Dict[str, Any],
        start_date: Optional[date] = None
    ) -> pd.DataFrame:
        """
        Generate future dataframe with all required regressors
        
        Args:
            model: Trained Prophet model
            periods: Number of days to forecast
            events: List of calendar events
            metadata: Model metadata with scaler params and regressors
            start_date: Start date for forecast (default: tomorrow)
        
        Returns:
            DataFrame with ds and all regressor columns
        """
        if start_date is None:
            start_date = get_current_date_wib() + timedelta(days=1)
        
        # Create date range
        future_dates = pd.date_range(
            start=start_date,
            periods=periods,
            freq='D'
        )
        
        future_df = pd.DataFrame({'ds': future_dates})
        
        # Add basic calendar features
        future_df['is_weekend'] = future_df['ds'].dt.dayofweek.isin([5, 6]).astype(int)
        future_df['is_payday'] = (
            future_df['ds'].dt.day.isin([25, 26, 27, 28, 29, 30, 31]) | 
            (future_df['ds'].dt.day <= 5)
        ).astype(int)
        future_df['is_month_start'] = (future_df['ds'].dt.day <= 5).astype(int)
        future_df['is_month_end'] = (future_df['ds'].dt.day >= 26).astype(int)
        
        # Add event-based regressors
        future_df['promo_intensity'] = 0.0
        future_df['holiday_intensity'] = 0.0
        future_df['event_intensity'] = 0.0
        future_df['closure_intensity'] = 0.0
        
        # Process calendar events
        if events:
            future_df = self._apply_events_to_dataframe(future_df, events)
        
        # Add default calendar features (if not from events)
        future_df['is_day_before_holiday'] = 0
        future_df['is_school_holiday'] = 0
        
        # Add lag features (use RECENT historical data for more accurate prediction)
        # Use y_recent_mean (last 14 days) if available, fallback to y_mean
        recent_mean = metadata.get('y_recent_mean', metadata.get('y_mean', 0))
        recent_std = metadata.get('y_recent_std', metadata.get('y_std', 0))
        
        future_df['lag_7'] = recent_mean
        future_df['rolling_mean_7'] = recent_mean
        future_df['rolling_std_7'] = recent_std
        
        logger.info(f"Lag features set to recent_mean={recent_mean:.1f} (y_mean={metadata.get('y_mean', 0):.1f})")
        
        # Add transaction features (use historical averages)
        future_df['transactions_count'] = metadata.get('avg_transactions', 0)
        future_df['avg_ticket'] = metadata.get('avg_ticket_value', 0)
        
        # Apply scaler to scaled regressors
        future_df = self._apply_scaler(future_df, metadata.get('scaler_params', {}))
        
        logger.info(f"Generated future dataframe: {len(future_df)} days")
        logger.info(f"Columns: {future_df.columns.tolist()}")
        
        return future_df
    
    def _apply_events_to_dataframe(
        self,
        df: pd.DataFrame,
        events: List[Dict[str, Any]]
    ) -> pd.DataFrame:
        """
        Apply calendar events to regressor columns
        
        Event types:
        - promotion: affects promo_intensity
        - holiday: affects holiday_intensity
        - event: affects event_intensity
        - store-closed: affects closure_intensity (sets to 1)
        """
        df = df.copy()
        
        for event in events:
            event_date = event.get('date')
            event_type = event.get('type', 'event')
            impact = event.get('impact', 1.0)
            
            # Parse event date
            if isinstance(event_date, str):
                try:
                    event_date = pd.to_datetime(event_date).date()
                except:
                    logger.warning(f"Invalid event date: {event_date}")
                    continue
            
            # Find matching rows
            mask = df['ds'].dt.date == event_date
            
            if not mask.any():
                continue
            
            # Apply event impact to appropriate regressor
            if event_type == 'promotion':
                df.loc[mask, 'promo_intensity'] = impact
            elif event_type == 'holiday':
                df.loc[mask, 'holiday_intensity'] = impact
            elif event_type == 'store-closed':
                df.loc[mask, 'closure_intensity'] = 1.0  # Full closure
            else:  # 'event' or default
                df.loc[mask, 'event_intensity'] = impact
        
        return df
    
    def _apply_scaler(
        self,
        df: pd.DataFrame,
        scaler_params: Dict[str, Any]
    ) -> pd.DataFrame:
        """
        Apply StandardScaler transformation to scaled regressors
        
        Scaler params format:
        {
            "columns": ["promo_intensity", "holiday_intensity", ...],
            "mean_": {"promo_intensity": 0.5, ...},
            "scale_": {"promo_intensity": 0.3, ...}
        }
        """
        if not scaler_params:
            return df
        
        df = df.copy()
        
        cols_to_scale = scaler_params.get("columns", [])
        mean_dict = scaler_params.get("mean_", {})
        scale_dict = scaler_params.get("scale_", {})
        
        for col in cols_to_scale:
            if col in df.columns and col in mean_dict and col in scale_dict:
                mean = mean_dict[col]
                scale = scale_dict[col]
                if scale > 0:
                    df[col] = (df[col] - mean) / scale
        
        return df
    
    def predict(
        self,
        model: Prophet,
        future_df: pd.DataFrame,
        metadata: Dict[str, Any]
    ) -> pd.DataFrame:
        """
        Generate forecast predictions
        
        Args:
            model: Trained Prophet model
            future_df: Future dataframe with all regressors
            metadata: Model metadata
        
        Returns:
            Forecast dataframe with predictions
        """
        # Get active regressors from metadata
        active_regressors = metadata.get('regressors', [])
        
        # Ensure all required columns exist
        required_cols = ['ds'] + active_regressors
        missing_cols = [col for col in required_cols if col not in future_df.columns]
        
        if missing_cols:
            logger.warning(f"Missing columns in future dataframe: {missing_cols}")
            # Add missing columns with default value 0
            for col in missing_cols:
                future_df[col] = 0.0
        
        # Select only required columns for prediction
        predict_df = future_df[required_cols].copy()
        
        # Generate forecast
        forecast = model.predict(predict_df)
        
        # Apply inverse transform if log transform was used
        if metadata.get('log_transform', False):
            # Inverse log transform: y = exp(y_log) - 1
            forecast['yhat'] = np.expm1(forecast['yhat'].clip(-10, 20))
            forecast['yhat_lower'] = np.expm1(forecast['yhat_lower'].clip(-10, 20))
            forecast['yhat_upper'] = np.expm1(forecast['yhat_upper'].clip(-10, 20))
            logger.info("Applied inverse log transform to predictions")
        
        # Apply baseline adjustment based on recent sales trend
        # This fixes the issue where Prophet predictions anchor to overall historical mean
        # instead of reflecting recent sales levels
        y_mean = metadata.get('y_mean', 1)
        y_recent_mean = metadata.get('y_recent_mean', y_mean)
        prediction_mean = forecast['yhat'].mean()
        
        if prediction_mean > 0 and y_recent_mean > 0:
            # Calculate how far off the predictions are from recent sales levels
            # Target: predictions should be close to y_recent_mean
            adjustment_factor = y_recent_mean / prediction_mean
            
            # Cap adjustment to reasonable range (0.5 - 3.0)
            adjustment_factor = min(3.0, max(0.5, adjustment_factor))
            
            if abs(adjustment_factor - 1.0) > 0.1:  # Only apply if >10% difference
                logger.info(f"Applying baseline adjustment: factor={adjustment_factor:.3f}")
                logger.info(f"  Prediction mean={prediction_mean:.0f}, Recent sales mean={y_recent_mean:.0f}")
                forecast['yhat'] = forecast['yhat'] * adjustment_factor
                forecast['yhat_lower'] = forecast['yhat_lower'] * adjustment_factor
                forecast['yhat_upper'] = forecast['yhat_upper'] * adjustment_factor
        
        # Ensure non-negative predictions
        forecast['yhat'] = forecast['yhat'].clip(lower=0)
        forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0)
        forecast['yhat_upper'] = forecast['yhat_upper'].clip(lower=0)
        
        logger.info(f"Generated {len(forecast)} predictions")
        logger.info(f"Prediction range: [{forecast['yhat'].min():.2f}, {forecast['yhat'].max():.2f}]")
        
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    
    def predict_with_events(
        self,
        model: Prophet,
        metadata: Dict[str, Any],
        periods: int = 30,
        events: List[Dict[str, Any]] = None,
        start_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """
        Complete prediction pipeline with event integration
        
        Args:
            model: Trained Prophet model
            metadata: Model metadata
            periods: Number of days to forecast
            events: Calendar events
            start_date: Start date for forecast
        
        Returns:
            List of prediction dictionaries
        """
        # Generate future dataframe
        future_df = self.generate_future_dataframe(
            model=model,
            periods=periods,
            events=events or [],
            metadata=metadata,
            start_date=start_date
        )
        
        # Generate predictions
        forecast = self.predict(model, future_df, metadata)
        
        # Convert to list of dictionaries
        predictions = []
        for _, row in forecast.iterrows():
            predictions.append({
                'ds': row['ds'].strftime('%Y-%m-%d'),
                'yhat': float(row['yhat']),
                'yhat_lower': float(row['yhat_lower']),
                'yhat_upper': float(row['yhat_upper'])
            })
        
        return predictions


# Singleton instance
predictor = Predictor()
