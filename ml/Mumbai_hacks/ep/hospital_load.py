"""
Hospital Load Calculation Agent
Translates forecasted cases into hospital resource needs
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from .hospital_database import HospitalDatabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HospitalLoadCalculator:
    """Agent 4: Calculates hospital load from forecasted cases"""
    
    # Disease-specific hospitalization rates (configurable)
    HOSPITALIZATION_RATES = {
        "viral_fever": {
            "hospitalization_rate": 0.05,  # 5% need hospitalization
            "icu_rate": 0.01,  # 1% need ICU
            "avg_stay_days": 3
        },
        "dengue": {
            "hospitalization_rate": 0.15,  # 15% need hospitalization
            "icu_rate": 0.03,  # 3% need ICU
            "avg_stay_days": 5
        },
        "respiratory": {
            "hospitalization_rate": 0.10,  # 10% need hospitalization
            "icu_rate": 0.02,  # 2% need ICU
            "avg_stay_days": 4
        },
        "general": {
            "hospitalization_rate": 0.05,  # Default 5%
            "icu_rate": 0.01,  # Default 1%
            "avg_stay_days": 3
        }
    }
    
    def __init__(self):
        self.rates = self.HOSPITALIZATION_RATES
        self.db = HospitalDatabase()
        logger.info("✅ Hospital Load Calculator initialized with MongoDB")
    
    def calculate_load(
        self,
        forecasted_cases: Dict[str, float],
        disease_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Calculate hospital load from forecasted cases
        
        Args:
            forecasted_cases: Dictionary with forecasted case counts
                Format: {"day_1": 100, "day_2": 120, ...} or {"total_7day": 800}
            disease_type: Type of disease (viral_fever, dengue, respiratory, general)
        
        Returns:
            Dictionary with hospital load calculations
        """
        rates = self.rates.get(disease_type, self.rates["general"])
        hosp_rate = rates["hospitalization_rate"]
        icu_rate = rates["icu_rate"]
        avg_stay = rates["avg_stay_days"]
        
        # Calculate total cases
        if "total_7day" in forecasted_cases:
            total_cases = forecasted_cases["total_7day"]
            daily_cases = total_cases / 7
        elif "total_14day" in forecasted_cases:
            total_cases = forecasted_cases["total_14day"]
            daily_cases = total_cases / 14
        else:
            # Sum all day values
            total_cases = sum(v for k, v in forecasted_cases.items() if k.startswith("day_"))
            daily_cases = total_cases / len([k for k in forecasted_cases.keys() if k.startswith("day_")]) if forecasted_cases else 0
        
        # Calculate hospital needs
        daily_hospitalizations = daily_cases * hosp_rate
        daily_icu_needs = daily_cases * icu_rate
        
        # Calculate peak load (considering average stay)
        peak_beds_needed = daily_hospitalizations * avg_stay
        peak_icu_beds_needed = daily_icu_needs * avg_stay
        
        # Calculate 7-day and 14-day totals
        total_7day_cases = daily_cases * 7
        total_14day_cases = daily_cases * 14
        
        total_7day_hospitalizations = total_7day_cases * hosp_rate
        total_14day_hospitalizations = total_14day_cases * hosp_rate
        
        total_7day_icu = total_7day_cases * icu_rate
        total_14day_icu = total_14day_cases * icu_rate
        
        return {
            "disease_type": disease_type,
            "forecasted_daily_cases": round(daily_cases, 1),
            "forecasted_7day_cases": round(total_7day_cases, 1),
            "forecasted_14day_cases": round(total_14day_cases, 1),
            "daily_hospitalizations": round(daily_hospitalizations, 1),
            "daily_icu_needs": round(daily_icu_needs, 1),
            "peak_beds_needed": round(peak_beds_needed, 0),
            "peak_icu_beds_needed": round(peak_icu_beds_needed, 0),
            "total_7day_hospitalizations": round(total_7day_hospitalizations, 1),
            "total_14day_hospitalizations": round(total_14day_hospitalizations, 1),
            "total_7day_icu": round(total_7day_icu, 1),
            "total_14day_icu": round(total_14day_icu, 1),
            "hospitalization_rate": hosp_rate,
            "icu_rate": icu_rate,
            "avg_stay_days": avg_stay
        }
    
    def calculate_load_from_forecast(
        self,
        forecast_results: Dict[str, Any],
        signal_type: str = "er_visits",
        signal_key: str = "total"
    ) -> Dict[str, Any]:
        """
        Calculate hospital load from forecast results
        
        Args:
            forecast_results: Results from Forecaster.forecast()
            signal_type: Type of signal used for forecast
            signal_key: Key within signal type
        
        Returns:
            Hospital load calculations
        """
        if not forecast_results.get("forecast_available", False):
            return {
                "load_available": False,
                "reason": "forecast_not_available"
            }
        
        # Extract forecast values
        forecast_values = forecast_results.get("forecast_values", [])
        forecast_days = len(forecast_values)
        
        # Determine disease type from signal
        disease_type = "general"
        if "dengue" in signal_key.lower() or "dengue" in signal_type.lower():
            disease_type = "dengue"
        elif "respiratory" in signal_key.lower() or "cough" in signal_key.lower():
            disease_type = "respiratory"
        elif "fever" in signal_key.lower():
            disease_type = "viral_fever"
        
        # Create forecasted_cases dictionary
        forecasted_cases = {}
        total_cases = sum(forecast_values)
        
        for i, value in enumerate(forecast_values, 1):
            forecasted_cases[f"day_{i}"] = value
        
        if forecast_days == 7:
            forecasted_cases["total_7day"] = total_cases
        elif forecast_days == 14:
            forecasted_cases["total_14day"] = total_cases
        
        # Calculate load
        load = self.calculate_load(forecasted_cases, disease_type)
        load["load_available"] = True
        load["forecast_days"] = forecast_days
        
        return load
    
    def get_capacity_alert(
        self,
        hospital_load: Dict[str, Any],
        current_bed_capacity: Optional[int] = None,
        current_icu_capacity: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate capacity alert based on hospital load
        
        Args:
            hospital_load: Results from calculate_load()
            current_bed_capacity: Current available bed capacity
            current_icu_capacity: Current available ICU capacity
        
        Returns:
            Capacity alert information
        """
        if not hospital_load.get("load_available", False):
            return {"alert_available": False}
        
        peak_beds = hospital_load.get("peak_beds_needed", 0)
        peak_icu = hospital_load.get("peak_icu_beds_needed", 0)
        
        alert = {
            "alert_available": True,
            "peak_beds_needed": peak_beds,
            "peak_icu_needed": peak_icu,
            "capacity_status": {}
        }
        
        if current_bed_capacity is not None:
            utilization = (peak_beds / current_bed_capacity * 100) if current_bed_capacity > 0 else 0
            alert["capacity_status"]["beds"] = {
                "utilization_percentage": round(utilization, 1),
                "status": "critical" if utilization > 90 else "warning" if utilization > 70 else "normal"
            }
        
        if current_icu_capacity is not None:
            utilization = (peak_icu / current_icu_capacity * 100) if current_icu_capacity > 0 else 0
            alert["capacity_status"]["icu"] = {
                "utilization_percentage": round(utilization, 1),
                "status": "critical" if utilization > 90 else "warning" if utilization > 70 else "normal"
            }
        
        return alert
    
    def calculate_real_time_load(
        self,
        city: str,
        forecasted_cases: Dict[str, float],
        disease_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Calculate hospital load with real-time capacity data from MongoDB
        
        Args:
            city: City name
            forecasted_cases: Dictionary with forecasted case counts
            disease_type: Type of disease
        
        Returns:
            Dictionary with hospital load calculations and capacity alerts
        """
        # Calculate basic load
        load = self.calculate_load(forecasted_cases, disease_type)
        
        # Get real-time hospital capacity
        capacity = self.db.get_hospital_capacity(city)
        current_load = self.db.get_real_time_load(city, hours=1)
        
        if capacity:
            # Add capacity information
            load["current_capacity"] = {
                "total_beds": capacity.get("total_beds", 0),
                "available_beds": capacity.get("available_beds", 0),
                "icu_beds": capacity.get("icu_beds", 0),
                "available_icu": capacity.get("available_icu", 0),
                "ventilators": capacity.get("ventilators", 0),
                "available_ventilators": capacity.get("available_ventilators", 0)
            }
            
            # Calculate capacity alerts
            peak_beds = load.get("peak_beds_needed", 0)
            peak_icu = load.get("peak_icu_beds_needed", 0)
            
            bed_utilization = (peak_beds / capacity.get("available_beds", 1) * 100) if capacity.get("available_beds", 0) > 0 else 0
            icu_utilization = (peak_icu / capacity.get("available_icu", 1) * 100) if capacity.get("available_icu", 0) > 0 else 0
            
            load["capacity_alerts"] = {
                "beds": {
                    "utilization_percentage": round(bed_utilization, 1),
                    "status": "critical" if bed_utilization > 90 else "warning" if bed_utilization > 70 else "normal",
                    "shortage_beds": max(0, peak_beds - capacity.get("available_beds", 0))
                },
                "icu": {
                    "utilization_percentage": round(icu_utilization, 1),
                    "status": "critical" if icu_utilization > 90 else "warning" if icu_utilization > 70 else "normal",
                    "shortage_icu": max(0, peak_icu - capacity.get("available_icu", 0))
                }
            }
            
            # Create resource alerts if needed
            if bed_utilization > 70 or icu_utilization > 70:
                alert_level = "critical" if bed_utilization > 90 or icu_utilization > 90 else "warning"
                
                alert_data = {
                    "alert_level": alert_level,
                    "resource_type": "hospital_capacity",
                    "current_utilization": max(bed_utilization, icu_utilization),
                    "predicted_shortage": max(
                        load["capacity_alerts"]["beds"]["shortage_beds"],
                        load["capacity_alerts"]["icu"]["shortage_icu"]
                    ),
                    "recommended_action": self._get_capacity_recommendation(bed_utilization, icu_utilization)
                }
                
                self.db.create_resource_alert(city, alert_data)
        
        # Add current load information
        if current_load:
            load["current_load"] = current_load[0] if current_load else None
        
        # Store forecast in database
        forecast_data = {
            "forecast_period_days": 7 if "total_7day" in forecasted_cases else 14,
            "predicted_cases": load.get("forecasted_7day_cases", 0),
            "predicted_hospitalizations": load.get("total_7day_hospitalizations", 0),
            "predicted_icu_needs": load.get("total_7day_icu", 0),
            "confidence_level": "high" if load.get("forecast_days", 7) >= 7 else "medium"
        }
        
        self.db.store_forecast(city, disease_type, forecast_data)
        
        load["real_time_enabled"] = True
        load["timestamp"] = datetime.utcnow().isoformat()
        
        return load
    
    def _get_capacity_recommendation(self, bed_utilization: float, icu_utilization: float) -> str:
        """Generate capacity recommendations based on utilization"""
        if bed_utilization > 90 or icu_utilization > 90:
            return "URGENT: Activate emergency overflow capacity, redirect patients to nearby hospitals"
        elif bed_utilization > 80 or icu_utilization > 80:
            return "Prepare overflow beds, cancel elective procedures, recall staff"
        elif bed_utilization > 70 or icu_utilization > 70:
            return "Monitor capacity closely, prepare contingency plans"
        else:
            return "Capacity adequate, continue normal operations"
    
    def update_real_time_capacity(self, city: str, capacity_data: Dict[str, Any]):
        """
        Update hospital capacity in real-time
        
        Args:
            city: City name
            capacity_data: Current capacity information
        """
        self.db.upsert_hospital_capacity(city, capacity_data)
        logger.info(f"✅ Updated real-time capacity for {city}")
    
    def update_real_time_load(self, city: str, load_data: Dict[str, Any]):
        """
        Update current hospital load in real-time
        
        Args:
            city: City name
            load_data: Current load information
        """
        self.db.store_real_time_load(city, load_data)
        logger.info(f"✅ Updated real-time load for {city}")
    
    def get_city_hospital_status(self, city: str) -> Dict[str, Any]:
        """
        Get comprehensive hospital status for a city
        
        Args:
            city: City name
        
        Returns:
            Complete hospital status summary
        """
        return self.db.get_city_summary(city)
    
    def get_active_resource_alerts(self, city: str) -> list:
        """
        Get active resource alerts for a city
        
        Args:
            city: City name
        
        Returns:
            List of active alerts
        """
        return self.db.get_active_alerts(city)

