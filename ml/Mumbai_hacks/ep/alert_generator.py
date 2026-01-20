"""
Alert Generation Agent
Generates graded alerts (INFO, WATCH, WARNING, CRITICAL) based on multiple indicators
"""
from typing import Dict, Any, List, Optional

class AlertGenerator:
    """Agent 5: Generates graded alerts based on anomaly detection and forecasts"""
    
    # Alert level thresholds
    THRESHOLDS = {
        "INFO": {
            "min_anomalies": 1,
            "min_spike": 20,  # 20% increase
            "forecast_increase": 10  # 10% forecast increase
        },
        "WATCH": {
            "min_anomalies": 2,
            "min_spike": 40,  # 40% increase
            "forecast_increase": 20,  # 20% forecast increase
            "consecutive_days": 1
        },
        "WARNING": {
            "min_anomalies": 2,
            "min_spike": 50,  # 50% increase
            "forecast_increase": 30,  # 30% forecast increase
            "consecutive_days": 2
        },
        "CRITICAL": {
            "min_anomalies": 3,
            "min_spike": 75,  # 75% increase
            "forecast_increase": 50,  # 50% forecast increase
            "consecutive_days": 2
        }
    }
    
    def __init__(self):
        pass
    
    def generate_alert(
        self,
        city: str,
        anomaly_results: Dict[str, Any],
        forecast_summary: Dict[str, Any],
        hospital_load: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate graded alert based on all indicators
        
        Args:
            city: City name
            anomaly_results: Results from AnomalyDetector
            forecast_summary: Summary from Forecaster.get_forecast_summary()
            hospital_load: Optional hospital load calculations
        
        Returns:
            Alert dictionary with level, message, and recommendations
        """
        # Extract key metrics
        total_anomalies = anomaly_results.get("total_anomalies", 0)
        consecutive_days = anomaly_results.get("consecutive_anomaly_days", 0)
        anomaly_confirmed = anomaly_results.get("anomaly_confirmed", False)
        
        anomaly_summary = anomaly_results.get("anomaly_summary", {})
        max_spike = anomaly_summary.get("max_spike_percentage", 0.0)
        
        forecast_increase = forecast_summary.get("max_increase_percentage", 0.0)
        overall_trend = forecast_summary.get("overall_trend", "stable")
        
        # Determine alert level
        alert_level = self._determine_alert_level(
            total_anomalies,
            max_spike,
            forecast_increase,
            consecutive_days,
            anomaly_confirmed
        )
        
        # Generate alert message
        message = self._generate_message(
            city,
            alert_level,
            total_anomalies,
            max_spike,
            forecast_increase,
            consecutive_days,
            anomaly_summary
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            alert_level,
            hospital_load,
            anomaly_summary,
            forecast_summary
        )
        
        return {
            "city": city,
            "alert_level": alert_level,
            "message": message,
            "recommendations": recommendations,
            "metrics": {
                "total_anomalies": total_anomalies,
                "max_spike_percentage": max_spike,
                "forecast_increase_percentage": forecast_increase,
                "consecutive_anomaly_days": consecutive_days,
                "anomaly_confirmed": anomaly_confirmed,
                "overall_trend": overall_trend
            },
            "timestamp": anomaly_results.get("timestamp")
        }
    
    def _determine_alert_level(
        self,
        total_anomalies: int,
        max_spike: float,
        forecast_increase: float,
        consecutive_days: int,
        anomaly_confirmed: bool
    ) -> str:
        """Determine alert level based on thresholds"""
        
        # Check CRITICAL
        if (total_anomalies >= self.THRESHOLDS["CRITICAL"]["min_anomalies"] and
            max_spike >= self.THRESHOLDS["CRITICAL"]["min_spike"] and
            forecast_increase >= self.THRESHOLDS["CRITICAL"]["forecast_increase"] and
            consecutive_days >= self.THRESHOLDS["CRITICAL"]["consecutive_days"]):
            return "CRITICAL"
        
        # Check WARNING
        if (total_anomalies >= self.THRESHOLDS["WARNING"]["min_anomalies"] and
            max_spike >= self.THRESHOLDS["WARNING"]["min_spike"] and
            forecast_increase >= self.THRESHOLDS["WARNING"]["forecast_increase"] and
            consecutive_days >= self.THRESHOLDS["WARNING"]["consecutive_days"]):
            return "WARNING"
        
        # Check WATCH
        if (total_anomalies >= self.THRESHOLDS["WATCH"]["min_anomalies"] and
            max_spike >= self.THRESHOLDS["WATCH"]["min_spike"] and
            (forecast_increase >= self.THRESHOLDS["WATCH"]["forecast_increase"] or anomaly_confirmed)):
            return "WATCH"
        
        # Check INFO
        if (total_anomalies >= self.THRESHOLDS["INFO"]["min_anomalies"] and
            max_spike >= self.THRESHOLDS["INFO"]["min_spike"]):
            return "INFO"
        
        return "NORMAL"
    
    def _generate_message(
        self,
        city: str,
        alert_level: str,
        total_anomalies: int,
        max_spike: float,
        forecast_increase: float,
        consecutive_days: int,
        anomaly_summary: Dict[str, Any]
    ) -> str:
        """Generate human-readable alert message"""
        
        if alert_level == "NORMAL":
            return f"All systems normal in {city.title()}. No unusual activity detected."
        
        most_severe = anomaly_summary.get("most_severe_anomaly", {})
        signal_type = most_severe.get("signal_type", "unknown")
        signal_key = most_severe.get("signal_key", "unknown")
        
        messages = {
            "INFO": f"⚠️ INFO: Slight increase detected in {city.title()}. {total_anomalies} signal(s) showing {max_spike:.1f}% increase. Monitor closely.",
            
            "WATCH": f"🔍 WATCH: Multiple indicators rising in {city.title()}. {total_anomalies} signal(s) showing {max_spike:.1f}% increase over {consecutive_days} day(s). Forecast suggests {forecast_increase:.1f}% increase in next 7 days.",
            
            "WARNING": f"⚠️ WARNING: Significant rise detected in {city.title()}. {total_anomalies} signal(s) showing {max_spike:.1f}% increase for {consecutive_days} consecutive days. Forecast indicates {forecast_increase:.1f}% increase. Prepare for potential surge.",
            
            "CRITICAL": f"🚨 CRITICAL: Major surge starting in {city.title()}. {total_anomalies} signal(s) showing {max_spike:.1f}% increase for {consecutive_days} consecutive days. Forecast shows {forecast_increase:.1f}% increase. Hospital capacity may be overwhelmed soon. Activate emergency protocols."
        }
        
        return messages.get(alert_level, messages["INFO"])
    
    def _generate_recommendations(
        self,
        alert_level: str,
        hospital_load: Optional[Dict[str, Any]],
        anomaly_summary: Dict[str, Any],
        forecast_summary: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable recommendations based on alert level"""
        
        recommendations = []
        
        if alert_level == "NORMAL":
            recommendations.append("Continue routine monitoring")
            return recommendations
        
        if alert_level == "INFO":
            recommendations.append("Increase monitoring frequency")
            recommendations.append("Review recent cases for patterns")
            return recommendations
        
        if alert_level == "WATCH":
            recommendations.append("Alert hospital staff of potential increase")
            recommendations.append("Review inventory of essential supplies")
            recommendations.append("Prepare additional OPD capacity")
            if hospital_load and hospital_load.get("load_available"):
                peak_beds = hospital_load.get("peak_beds_needed", 0)
                recommendations.append(f"Prepare for ~{int(peak_beds)} additional beds")
            return recommendations
        
        if alert_level == "WARNING":
            recommendations.append("Activate surge capacity planning")
            recommendations.append("Notify all department heads")
            recommendations.append("Increase staff on standby")
            recommendations.append("Review and prepare ICU capacity")
            if hospital_load and hospital_load.get("load_available"):
                peak_beds = hospital_load.get("peak_beds_needed", 0)
                peak_icu = hospital_load.get("peak_icu_beds_needed", 0)
                recommendations.append(f"Prepare {int(peak_beds)} additional beds and {int(peak_icu)} ICU beds")
            recommendations.append("Coordinate with other hospitals for capacity sharing")
            return recommendations
        
        if alert_level == "CRITICAL":
            recommendations.append("🚨 ACTIVATE EMERGENCY PROTOCOLS")
            recommendations.append("Immediate coordination with health department")
            recommendations.append("Activate all surge capacity immediately")
            recommendations.append("Call in additional staff from reserves")
            recommendations.append("Prepare for overflow capacity")
            if hospital_load and hospital_load.get("load_available"):
                peak_beds = hospital_load.get("peak_beds_needed", 0)
                peak_icu = hospital_load.get("peak_icu_beds_needed", 0)
                recommendations.append(f"URGENT: Prepare {int(peak_beds)} beds and {int(peak_icu)} ICU beds within 24-48 hours")
            recommendations.append("Coordinate with neighboring hospitals for patient transfer")
            recommendations.append("Alert public health authorities")
            recommendations.append("Consider public health advisories")
            return recommendations
        
        return recommendations

