"""
Hospital Load Calculation Agent
Translates forecasted cases into hospital resource needs
"""
from typing import Dict, Any, Optional

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

