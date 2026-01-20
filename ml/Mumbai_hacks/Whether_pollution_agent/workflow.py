# workflow.py
from langgraph.graph import StateGraph, END
from datetime import datetime
from typing import Dict, Any, Optional
from .agent import decision_agent
from .tools import (
    fetch_weather_api,
    fetch_pollution_data,
    store_environment_data,
    predict_patient_count_and_surge,
    generate_dashboard_alerts,
    generate_recommended_actions
)
from .city_data import get_city_data

def collect_data_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Collect environmental data for a city"""
    city_name = state.get("city", "Mumbai")
    
    weather = fetch_weather_api(city_name)
    pollution = fetch_pollution_data(city_name)
    
    combined = {
        "datetime": datetime.now().isoformat(),
        "city": city_name,
        **weather,
        **pollution
    }
    
    store_environment_data(combined)
    
    pm25_value = pollution.get("pm25") or pollution.get("pm25_value")
    if pm25_value is None:
        pm25_value = 50.0
    
    aqi_value = pollution.get("aqi")
    if aqi_value is None:
        # Convert PM2.5 to AQI if AQI not available
        from .tools import pm25_to_aqi
        aqi_value = pm25_to_aqi(pm25_value)
    
    # Get hospital inputs from state if available
    bed_usage = state.get("bed_usage")
    last_7day_patients = state.get("last_7day_patients")
    
    # Predict patient count and surge
    predictions = predict_patient_count_and_surge(
        aqi=aqi_value,
        pm25=pm25_value,
        temperature=weather.get("temperature", 25.0),
        humidity=weather.get("humidity", 60.0),
        rainfall=weather.get("rainfall", 0.0),
        city_name=city_name,
        bed_usage=bed_usage,
        last_7day_patients=last_7day_patients
    )
    
    # Generate alerts
    alerts = generate_dashboard_alerts(
        pm25=pm25_value,
        aqi=aqi_value,
        city_name=city_name,
        expected_patients=predictions["expected_patients_next_24h"],
        surge_probability=predictions["surge_probability"]
    )
    
    # Handle error case
    if "error" in alerts:
        alerts = {
            "aqi": aqi_value,
            "patient_dashboard": f"Air quality data for {city_name.title()}: AQI {int(aqi_value)}",
            "doctor_dashboard": "Monitoring air quality conditions.",
            "hospital_dashboard": "Standard operations.",
        }
    
    # Generate recommended actions
    recommended_actions = generate_recommended_actions(
        aqi=aqi_value,
        expected_patients=predictions["expected_patients_next_24h"],
        surge_probability=predictions["surge_probability"],
        bed_usage=bed_usage
    )
    
    city_data = get_city_data(city_name)
    
    return {
        "status": "data_collected",
        "data": combined,
        "city": city_name,
        "state": city_data["state"],
        "aqi": aqi_value,
        "pm25": pm25_value,
        "expected_patients_next_24h": predictions["expected_patients_next_24h"],
        "surge_probability": predictions["surge_probability"],
        "patient_dashboard": alerts.get("patient_dashboard", "No data available"),
        "doctor_dashboard": alerts.get("doctor_dashboard", "No data available"),
        "hospital_dashboard": alerts.get("hospital_dashboard", "No data available"),
        "recommended_actions": recommended_actions,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

def prediction_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Run prediction based on collected data"""
    # Prediction is now integrated into collect_data_node
    # This node can be used for additional predictions if needed
    return {
        "status": "prediction_done",
        "prediction": "Prediction completed in collect_data_node"
    }

# Create workflow graph
workflow = StateGraph(dict)

workflow.add_node("decide", decision_agent)
workflow.add_node("collect", collect_data_node)
workflow.add_node("predict", prediction_node)

workflow.set_entry_point("decide")

# DECISION LOGIC
def router(state: Dict[str, Any]) -> str:
    """Route based on decision agent output"""
    decision = state.get("decision", {})
    if isinstance(decision, dict):
        if decision.get("collect") == "yes":
            return "collect"
        if decision.get("predict") == "yes":
            return "predict"
    else:
        decision_str = str(decision)
        if '"collect": "yes"' in decision_str or "collect" in decision_str.lower():
            return "collect"
        if '"predict": "yes"' in decision_str or "predict" in decision_str.lower():
            return "predict"
    return END

workflow.add_conditional_edges("decide", router, {
    "collect": "collect",
    "predict": "predict",
    END: END
})

workflow.add_edge("collect", END)
workflow.add_edge("predict", END)

app = workflow.compile()

# Main execution function for direct use
def run_prediction(city: str = "Mumbai", bed_usage: Optional[float] = None, last_7day_patients: Optional[int] = None) -> Dict[str, Any]:
    """
    Run prediction for a city with optional hospital inputs
    
    Returns the exact JSON structure required:
    {
        "status": "success",
        "city": "string",
        "state": "string",
        "aqi": number,
        "pm25": number,
        "expected_patients_next_24h": number,
        "surge_probability": number,
        "timestamp": "ISO-8601",
        "patient_dashboard": "string",
        "doctor_dashboard": "string",
        "hospital_dashboard": "string",
        "recommended_actions": {...}
    }
    """
    initial_state = {
        "weather": None,
        "pollution": None,
        "city": city,
        "bed_usage": bed_usage,
        "last_7day_patients": last_7day_patients,
        "time": datetime.now().isoformat()
    }
    
    result = app.invoke(initial_state)
    
    # Ensure we return the exact structure
    # Use the input city (it's what was requested)
    city_data = get_city_data(city)
    
    return {
        "status": "success",
        "city": city.title(),
        "state": city_data["state"],  # Always use the correct state for the requested city
        "aqi": float(result.get("aqi", 100)),
        "pm25": float(result.get("pm25", 50.0)),
        "expected_patients_next_24h": result.get("expected_patients_next_24h", 50),
        "surge_probability": float(result.get("surge_probability", 0.0)),
        "timestamp": result.get("timestamp", datetime.utcnow().isoformat() + "Z"),
        "patient_dashboard": result.get("patient_dashboard", "Data unavailable"),
        "doctor_dashboard": result.get("doctor_dashboard", "Data unavailable"),
        "hospital_dashboard": result.get("hospital_dashboard", "Data unavailable"),
        "recommended_actions": result.get("recommended_actions", {
            "oxygen_cylinder_increase_percent": 0,
            "emergency_beds_to_open": 0,
            "staff_alert_required": False,
            "mask_advisory": False
        })
    }
