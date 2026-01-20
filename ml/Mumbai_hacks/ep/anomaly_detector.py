"""
Anomaly Detection Agent
Detects unusual increases by comparing current data vs seasonal baseline
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from .seasonal_baseline import SeasonalBaseline

class AnomalyDetector:
    """Agent 2: Detects anomalies by comparing current vs baseline"""
    
    def __init__(self, spike_threshold: float = 0.4):
        """
        Args:
            spike_threshold: Minimum percentage increase to consider as spike (default 40%)
        """
        self.spike_threshold = spike_threshold
        self.baseline_calculator = SeasonalBaseline()
        self.anomaly_history = {}  # Track consecutive days of anomalies
    
    def detect_anomalies(
        self,
        city: str,
        current_signals: Dict[str, Any],
        historical_data: List[Dict[str, Any]],
        consecutive_days_required: int = 2
    ) -> Dict[str, Any]:
        """
        Detect anomalies across all signal types
        
        Args:
            city: City name
            current_signals: Current day's signals
            historical_data: Historical signals for baseline calculation
            consecutive_days_required: Number of consecutive days with spike to confirm anomaly
        
        Returns:
            Dictionary with anomaly detection results
        """
        current_date = datetime.fromisoformat(current_signals["timestamp"])
        
        # Calculate baselines
        baselines = self.baseline_calculator.calculate_all_baselines(
            city, current_date, historical_data
        )
        
        # Detect spikes for each signal
        anomalies = {}
        total_anomalies = 0
        
        signal_configs = [
            ("er_visits", ["fever", "cough", "rash", "total"]),
            ("lab_positivity", ["viral_tests", "bacterial_tests", "dengue_tests"]),
            ("ambulance_calls", ["respiratory", "fever", "other", "total"]),
            ("pharmacy_otc_sales", ["antipyretics", "cough_syrup", "antihistamines", "total_index"]),
            ("search_trends", ["fever", "cough", "dengue", "flu"])
        ]
        
        for signal_type, keys in signal_configs:
            anomalies[signal_type] = {}
            current_signal_data = current_signals.get(signal_type, {})
            
            for key in keys:
                current_value = current_signal_data.get(key, 0)
                baseline_info = baselines[signal_type].get(key, {})
                baseline_value = baseline_info.get("baseline_value", 0)
                
                if baseline_value == 0:
                    spike_percentage = 0.0
                    is_anomaly = False
                else:
                    spike_percentage = ((current_value - baseline_value) / baseline_value) * 100
                    is_anomaly = spike_percentage >= (self.spike_threshold * 100)
                
                anomalies[signal_type][key] = {
                    "current_value": float(current_value),
                    "baseline_value": float(baseline_value),
                    "spike_percentage": round(spike_percentage, 1),
                    "is_anomaly": is_anomaly,
                    "confidence": baseline_info.get("confidence", "low")
                }
                
                if is_anomaly:
                    total_anomalies += 1
        
        # Check for consecutive days of anomalies
        city_key = f"{city}_{current_date.date()}"
        if city not in self.anomaly_history:
            self.anomaly_history[city] = []
        
        # Add today's anomaly status
        has_anomaly = total_anomalies > 0
        self.anomaly_history[city].append({
            "date": current_date.date(),
            "has_anomaly": has_anomaly,
            "anomaly_count": total_anomalies
        })
        
        # Keep only last 7 days
        self.anomaly_history[city] = self.anomaly_history[city][-7:]
        
        # Count consecutive anomaly days
        consecutive_days = 0
        for record in reversed(self.anomaly_history[city]):
            if record["has_anomaly"]:
                consecutive_days += 1
            else:
                break
        
        # Determine if anomaly is confirmed (consecutive days requirement)
        anomaly_confirmed = consecutive_days >= consecutive_days_required
        
        return {
            "city": city,
            "timestamp": current_signals["timestamp"],
            "anomalies": anomalies,
            "total_anomalies": total_anomalies,
            "consecutive_anomaly_days": consecutive_days,
            "anomaly_confirmed": anomaly_confirmed,
            "baselines": baselines
        }
    
    def get_anomaly_summary(self, anomaly_results: Dict[str, Any]) -> Dict[str, Any]:
        """Get summary of anomalies for quick assessment"""
        anomalies = anomaly_results["anomalies"]
        summary = {
            "signal_types_with_anomalies": [],
            "total_anomaly_signals": 0,
            "most_severe_anomaly": None,
            "max_spike_percentage": 0.0
        }
        
        for signal_type, signals in anomalies.items():
            type_anomalies = [k for k, v in signals.items() if v.get("is_anomaly", False)]
            if type_anomalies:
                summary["signal_types_with_anomalies"].append(signal_type)
                summary["total_anomaly_signals"] += len(type_anomalies)
                
                # Find most severe anomaly
                for key, data in signals.items():
                    spike = data.get("spike_percentage", 0)
                    if spike > summary["max_spike_percentage"]:
                        summary["max_spike_percentage"] = spike
                        summary["most_severe_anomaly"] = {
                            "signal_type": signal_type,
                            "signal_key": key,
                            "spike_percentage": spike,
                            "current": data.get("current_value"),
                            "baseline": data.get("baseline_value")
                        }
        
        return summary

