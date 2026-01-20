"""
Forecasting Agent
Forecasts next 7-14 days based on recent trends
"""
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import deque

class Forecaster:
    """Agent 3: Forecasts future cases based on trends"""
    
    def __init__(self, forecast_days: int = 7):
        """
        Args:
            forecast_days: Number of days to forecast (default 7, can be 14)
        """
        self.forecast_days = forecast_days
    
    def forecast(
        self,
        city: str,
        signal_type: str,
        signal_key: str,
        recent_data: List[Dict[str, Any]],
        forecast_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Forecast future values for a specific signal
        
        Args:
            city: City name
            signal_type: Type of signal
            signal_key: Specific key within signal type
            recent_data: Recent historical data (last 14-30 days recommended)
            forecast_days: Number of days to forecast (overrides default)
        
        Returns:
            Dictionary with forecast results
        """
        if forecast_days is None:
            forecast_days = self.forecast_days
        
        # Extract time series
        values = []
        dates = []
        
        for record in recent_data:
            try:
                signal_data = record.get(signal_type, {})
                if isinstance(signal_data, dict):
                    value = signal_data.get(signal_key)
                    if value is not None:
                        values.append(float(value))
                        dates.append(datetime.fromisoformat(record['timestamp']))
            except (KeyError, TypeError, ValueError):
                continue
        
        if len(values) < 3:
            # Not enough data for forecasting
            return {
                "forecast_available": False,
                "reason": "insufficient_data",
                "forecast_days": forecast_days
            }
        
        # Sort by date
        sorted_data = sorted(zip(dates, values))
        dates_sorted, values_sorted = zip(*sorted_data)
        
        # Use simple linear regression for trend
        x = np.array([(d - dates_sorted[0]).days for d in dates_sorted])
        y = np.array(values_sorted)
        
        # Calculate trend
        n = len(x)
        slope = (n * np.sum(x * y) - np.sum(x) * np.sum(y)) / (n * np.sum(x**2) - np.sum(x)**2)
        intercept = np.mean(y) - slope * np.mean(x)
        
        # Forecast future values
        last_date = dates_sorted[-1]
        forecast_values = []
        forecast_dates = []
        
        for i in range(1, forecast_days + 1):
            future_date = last_date + timedelta(days=i)
            future_x = (future_date - dates_sorted[0]).days
            forecast_value = intercept + slope * future_x
            
            # Don't allow negative forecasts
            forecast_value = max(0, forecast_value)
            
            forecast_values.append(forecast_value)
            forecast_dates.append(future_date.isoformat())
        
        # Calculate trend direction
        recent_trend = np.mean(values_sorted[-3:]) - np.mean(values_sorted[:3]) if len(values_sorted) >= 6 else 0
        trend_direction = "increasing" if recent_trend > 0 else "decreasing" if recent_trend < 0 else "stable"
        
        # Calculate forecast change percentage
        current_value = values_sorted[-1]
        forecast_7day = forecast_values[6] if len(forecast_values) > 6 else forecast_values[-1]
        forecast_change_pct = ((forecast_7day - current_value) / current_value * 100) if current_value > 0 else 0
        
        return {
            "forecast_available": True,
            "forecast_days": forecast_days,
            "current_value": float(current_value),
            "forecast_values": [float(v) for v in forecast_values],
            "forecast_dates": forecast_dates,
            "forecast_7day_value": float(forecast_7day),
            "forecast_change_percentage": round(forecast_change_pct, 1),
            "trend_direction": trend_direction,
            "slope": float(slope),
            "confidence": "high" if len(values) >= 14 else "medium" if len(values) >= 7 else "low"
        }
    
    def forecast_all_signals(
        self,
        city: str,
        recent_data: List[Dict[str, Any]],
        forecast_days: Optional[int] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Forecast all signal types
        
        Returns:
            Nested dictionary: {signal_type: {signal_key: forecast_info}}
        """
        forecasts = {}
        
        signal_configs = [
            ("er_visits", ["fever", "cough", "rash", "total"]),
            ("lab_positivity", ["viral_tests", "bacterial_tests", "dengue_tests"]),
            ("ambulance_calls", ["respiratory", "fever", "other", "total"]),
            ("pharmacy_otc_sales", ["antipyretics", "cough_syrup", "antihistamines", "total_index"]),
            ("search_trends", ["fever", "cough", "dengue", "flu"])
        ]
        
        for signal_type, keys in signal_configs:
            forecasts[signal_type] = {}
            for key in keys:
                forecasts[signal_type][key] = self.forecast(
                    city, signal_type, key, recent_data, forecast_days
                )
        
        return forecasts
    
    def get_forecast_summary(self, forecasts: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Get summary of forecasts for quick assessment"""
        summary = {
            "signals_increasing": [],
            "signals_decreasing": [],
            "max_increase_percentage": 0.0,
            "overall_trend": "stable"
        }
        
        for signal_type, signals in forecasts.items():
            for key, forecast_data in signals.items():
                if not forecast_data.get("forecast_available", False):
                    continue
                
                change_pct = forecast_data.get("forecast_change_percentage", 0)
                trend = forecast_data.get("trend_direction", "stable")
                
                if trend == "increasing" and change_pct > 10:
                    summary["signals_increasing"].append({
                        "signal_type": signal_type,
                        "signal_key": key,
                        "change_percentage": change_pct
                    })
                    if change_pct > summary["max_increase_percentage"]:
                        summary["max_increase_percentage"] = change_pct
                
                elif trend == "decreasing" and change_pct < -10:
                    summary["signals_decreasing"].append({
                        "signal_type": signal_type,
                        "signal_key": key,
                        "change_percentage": change_pct
                    })
        
        # Determine overall trend
        if len(summary["signals_increasing"]) > len(summary["signals_decreasing"]) * 2:
            summary["overall_trend"] = "increasing"
        elif len(summary["signals_decreasing"]) > len(summary["signals_increasing"]) * 2:
            summary["overall_trend"] = "decreasing"
        
        return summary

