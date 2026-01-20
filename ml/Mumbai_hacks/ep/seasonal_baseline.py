"""
Seasonal Baseline Calculation Module
Calculates expected seasonal baseline for comparison
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from collections import defaultdict

class SeasonalBaseline:
    """Calculates seasonal baselines from historical data"""
    
    def __init__(self, years_back: int = 5):
        self.years_back = years_back
        self.baselines = {}  # Cache calculated baselines
    
    def calculate_baseline(
        self,
        city: str,
        signal_type: str,
        signal_key: str,
        current_date: datetime,
        historical_data: List[Dict[str, Any]]
    ) -> Dict[str, float]: 
        """
        Calculate expected baseline for a signal
        
        Args:
            city: City name
            signal_type: Type of signal (er_visits, lab_positivity, etc.)
            signal_key: Specific key within signal type (e.g., "fever", "total")
            current_date: Current date
            historical_data: List of historical signal dictionaries
        
        Returns:
            Dictionary with baseline value and metadata
        """
        if not historical_data:
            # Return default baseline if no historical data
            return {
                "baseline_value": self._get_default_baseline(signal_type, signal_key),
                "confidence": "low",
                "data_points": 0,
                "method": "default"
            }
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['timestamp'])
        
        # Extract signal values
        signal_values = []
        dates = []
        
        for record in historical_data:
            try:
                signal_data = record.get(signal_type, {})
                if isinstance(signal_data, dict):
                    value = signal_data.get(signal_key)
                    if value is not None:
                        signal_values.append(float(value))
                        dates.append(pd.to_datetime(record['timestamp']))
            except (KeyError, TypeError, ValueError):
                continue
        
        if not signal_values:
            return {
                "baseline_value": self._get_default_baseline(signal_type, signal_key),
                "confidence": "low",
                "data_points": 0,
                "method": "default"
            }
        
        # Calculate baseline using same week in previous years
        current_week = current_date.isocalendar()[1]  # Week number
        current_year = current_date.year
        
        # Get values from same week in previous years
        same_week_values = []
        for i in range(1, self.years_back + 1):
            target_year = current_year - i
            target_date = datetime.strptime(f"{target_year}-W{current_week:02d}-1", "%Y-W%W-%w")
            
            # Find values within ±1 week of target date
            for date, value in zip(dates, signal_values):
                date_obj = date if isinstance(date, datetime) else pd.to_datetime(date)
                if abs((date_obj - target_date).days) <= 7:
                    same_week_values.append(value)
        
        if same_week_values:
            # Use average of same week in previous years
            baseline = np.mean(same_week_values)
            std = np.std(same_week_values)
            confidence = "high" if len(same_week_values) >= 3 else "medium" if len(same_week_values) >= 1 else "low"
            
            return {
                "baseline_value": float(baseline),
                "std": float(std),
                "confidence": confidence,
                "data_points": len(same_week_values),
                "method": "seasonal_average"
            }
        else:
            # Fallback: use rolling average of last 30 days
            recent_values = [v for d, v in zip(dates, signal_values) 
                           if (current_date - d).days <= 30]
            
            if recent_values:
                baseline = np.mean(recent_values)
                return {
                    "baseline_value": float(baseline),
                    "confidence": "medium",
                    "data_points": len(recent_values),
                    "method": "rolling_average"
                }
            else:
                return {
                    "baseline_value": self._get_default_baseline(signal_type, signal_key),
                    "confidence": "low",
                    "data_points": 0,
                    "method": "default"
                }
    
    def _get_default_baseline(self, signal_type: str, signal_key: str) -> float:
        """Get default baseline when no historical data available"""
        defaults = {
            "er_visits": {
                "fever": 16.0,
                "cough": 14.0,
                "rash": 10.0,
                "total": 40.0
            },
            "lab_positivity": {
                "viral_tests": 15.0,
                "bacterial_tests": 8.0,
                "dengue_tests": 5.0
            },
            "ambulance_calls": {
                "respiratory": 12.0,
                "fever": 8.0,
                "other": 5.0,
                "total": 25.0
            },
            "pharmacy_otc_sales": {
                "antipyretics": 100.0,
                "cough_syrup": 80.0,
                "antihistamines": 60.0,
                "total_index": 240.0
            },
            "search_trends": {
                "fever": 50.0,
                "cough": 45.0,
                "dengue": 30.0,
                "flu": 40.0
            }
        }
        
        return defaults.get(signal_type, {}).get(signal_key, 0.0)
    
    def calculate_all_baselines(
        self,
        city: str,
        current_date: datetime,
        historical_data: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Calculate baselines for all signal types
        
        Returns:
            Nested dictionary: {signal_type: {signal_key: baseline_info}}
        """
        baselines = {}
        
        signal_configs = [
            ("er_visits", ["fever", "cough", "rash", "total"]),
            ("lab_positivity", ["viral_tests", "bacterial_tests", "dengue_tests"]),
            ("ambulance_calls", ["respiratory", "fever", "other", "total"]),
            ("pharmacy_otc_sales", ["antipyretics", "cough_syrup", "antihistamines", "total_index"]),
            ("search_trends", ["fever", "cough", "dengue", "flu"])
        ]
        
        for signal_type, keys in signal_configs:
            baselines[signal_type] = {}
            for key in keys:
                baselines[signal_type][key] = self.calculate_baseline(
                    city, signal_type, key, current_date, historical_data
                )
        
        return baselines

