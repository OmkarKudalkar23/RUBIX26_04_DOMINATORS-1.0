"""
Early Warning System Workflow
Integrates all agents for complete early warning system
"""
from langgraph.graph import StateGraph, END
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from .early_signals import EarlySignalCollector
from .anomaly_detector import AnomalyDetector
from .forecaster import Forecaster
from .hospital_load import HospitalLoadCalculator
from .alert_generator import AlertGenerator

class EarlyWarningWorkflow:
    """Complete early warning system workflow"""
    
    def __init__(self):
        self.signal_collector = EarlySignalCollector()
        self.anomaly_detector = AnomalyDetector()
        self.forecaster = Forecaster()
        self.hospital_calculator = HospitalLoadCalculator()
        self.alert_generator = AlertGenerator()
    
    def run_early_warning(
        self,
        city: str,
        date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Run complete early warning system
        
        Args:
            city: City name
            date: Date to analyze (default: today)
        
        Returns:
            Complete early warning results
        """
        if date is None:
            date = datetime.now()
        
        # Step 1: Collect early signals
        current_signals = self.signal_collector.collect_all_signals(city, date)
        
        # Step 2: Get historical data for baseline and forecasting
        historical_data = self.signal_collector.get_recent_signals(city, days=90)
        
        # Step 3: Detect anomalies
        anomaly_results = self.anomaly_detector.detect_anomalies(
            city, current_signals, historical_data
        )
        
        # Add anomaly summary
        anomaly_summary = self.anomaly_detector.get_anomaly_summary(anomaly_results)
        anomaly_results["anomaly_summary"] = anomaly_summary
        
        # Step 4: Forecast future trends
        recent_data = self.signal_collector.get_recent_signals(city, days=30)
        forecasts = self.forecaster.forecast_all_signals(city, recent_data)
        forecast_summary = self.forecaster.get_forecast_summary(forecasts)
        
        # Step 5: Calculate hospital load (using ER visits total as primary indicator)
        hospital_load = None
        if "er_visits" in forecasts and "total" in forecasts["er_visits"]:
            er_forecast = forecasts["er_visits"]["total"]
            if er_forecast.get("forecast_available", False):
                hospital_load = self.hospital_calculator.calculate_load_from_forecast(
                    er_forecast, "er_visits", "total"
                )
        
        # Step 6: Generate alert
        alert = self.alert_generator.generate_alert(
            city, anomaly_results, forecast_summary, hospital_load
        )
        
        # Compile complete results
        return {
            "city": city,
            "timestamp": date.isoformat(),
            "current_signals": current_signals,
            "anomaly_detection": anomaly_results,
            "forecasts": forecasts,
            "forecast_summary": forecast_summary,
            "hospital_load": hospital_load,
            "alert": alert,
            "status": "success"
        }
    
    def run_daily_check(self, city: str) -> Dict[str, Any]:
        """Run daily early warning check (convenience method)"""
        return self.run_early_warning(city, datetime.now())

# Create workflow graph (optional - for LangGraph integration)
def create_early_warning_graph():
    """Create LangGraph workflow for early warning system"""
    workflow = StateGraph(dict)
    early_warning = EarlyWarningWorkflow()
    
    def collect_signals_node(state: Dict[str, Any]) -> Dict[str, Any]:
        """Agent 1: Collect signals"""
        city = state.get("city", "Mumbai")
        date_str = state.get("date")
        date = datetime.fromisoformat(date_str) if date_str else datetime.now()
        
        signals = early_warning.signal_collector.collect_all_signals(city, date)
        return {"signals": signals, "city": city, "date": date.isoformat()}
    
    def detect_anomalies_node(state: Dict[str, Any]) -> Dict[str, Any]:
        """Agent 2: Detect anomalies"""
        city = state.get("city", "Mumbai")
        signals = state.get("signals", {})
        
        historical = early_warning.signal_collector.get_recent_signals(city, days=90)
        anomaly_results = early_warning.anomaly_detector.detect_anomalies(
            city, signals, historical
        )
        
        anomaly_summary = early_warning.anomaly_detector.get_anomaly_summary(anomaly_results)
        anomaly_results["anomaly_summary"] = anomaly_summary
        
        return {"anomaly_results": anomaly_results}
    
    def forecast_node(state: Dict[str, Any]) -> Dict[str, Any]:
        """Agent 3: Forecast future trends"""
        city = state.get("city", "Mumbai")
        recent_data = early_warning.signal_collector.get_recent_signals(city, days=30)
        
        forecasts = early_warning.forecaster.forecast_all_signals(city, recent_data)
        forecast_summary = early_warning.forecaster.get_forecast_summary(forecasts)
        
        return {"forecasts": forecasts, "forecast_summary": forecast_summary}
    
    def calculate_hospital_load_node(state: Dict[str, Any]) -> Dict[str, Any]:
        """Agent 4: Calculate hospital load"""
        forecasts = state.get("forecasts", {})
        
        hospital_load = None
        if "er_visits" in forecasts and "total" in forecasts["er_visits"]:
            er_forecast = forecasts["er_visits"]["total"]
            if er_forecast.get("forecast_available", False):
                hospital_load = early_warning.hospital_calculator.calculate_load_from_forecast(
                    er_forecast, "er_visits", "total"
                )
        
        return {"hospital_load": hospital_load}
    
    def generate_alert_node(state: Dict[str, Any]) -> Dict[str, Any]:
        """Agent 5: Generate alert"""
        city = state.get("city", "Mumbai")
        anomaly_results = state.get("anomaly_results", {})
        forecast_summary = state.get("forecast_summary", {})
        hospital_load = state.get("hospital_load")
        
        alert = early_warning.alert_generator.generate_alert(
            city, anomaly_results, forecast_summary, hospital_load
        )
        
        return {
            "alert": alert,
            "status": "success",
            "timestamp": datetime.now().isoformat()
        }
    
    # Add nodes
    workflow.add_node("collect_signals", collect_signals_node)
    workflow.add_node("detect_anomalies", detect_anomalies_node)
    workflow.add_node("forecast", forecast_node)
    workflow.add_node("calculate_hospital_load", calculate_hospital_load_node)
    workflow.add_node("generate_alert", generate_alert_node)
    
    # Set entry point
    workflow.set_entry_point("collect_signals")
    
    # Add edges (sequential flow)
    workflow.add_edge("collect_signals", "detect_anomalies")
    workflow.add_edge("detect_anomalies", "forecast")
    workflow.add_edge("forecast", "calculate_hospital_load")
    workflow.add_edge("calculate_hospital_load", "generate_alert")
    workflow.add_edge("generate_alert", END)
    
    return workflow.compile()

