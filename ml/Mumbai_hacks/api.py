# api.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
import uvicorn

from Whether_pollution_agent.tools import (
    fetch_weather_api,
    fetch_pollution_data,
    predict_patient_count_and_surge,
    generate_dashboard_alerts,
    generate_recommended_actions
)
from Whether_pollution_agent.city_data import get_city_data

app = FastAPI(title="Healthcare Risk & Resource Prediction API", version="1.0.0")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HospitalInputs(BaseModel):
    bed_usage: Optional[float] = None  # Percentage of beds currently in use
    last_7day_patients: Optional[int] = None  # Total patients in last 7 days

class PredictionRequest(BaseModel):
    city: str
    aqi: Optional[float] = None
    pm25: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    hospital_inputs: Optional[HospitalInputs] = None

class PredictionResponse(BaseModel):
    status: str
    city: str
    state: str
    aqi: float
    pm25: float
    expected_patients_next_24h: int
    surge_probability: float
    timestamp: str
    patient_dashboard: str
    doctor_dashboard: str
    hospital_dashboard: str
    recommended_actions: Dict[str, Any]

@app.get("/")
async def root():
    return {
        "message": "Healthcare Risk & Resource Prediction API",
        "version": "1.0.0",
        "endpoints": {
            "/predict": "POST - Get predictions for a city",
            "/predict/{city}": "GET - Quick prediction for a city"
        }
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_healthcare_risk(request: PredictionRequest):
    """
    Main prediction endpoint - accepts environmental and optional hospital inputs
    Returns predictions in the exact JSON structure required
    """
    city_name = request.city.strip()
    city_data = get_city_data(city_name)
    
    # Fetch or use provided environmental data
    if request.aqi is None or request.pm25 is None or request.temperature is None:
        # Fetch data if not provided
        weather_data = fetch_weather_api(city_name)
        pollution_data = fetch_pollution_data(city_name)
        
        aqi = request.aqi if request.aqi is not None else pollution_data.get("aqi", 100)
        pm25 = request.pm25 if request.pm25 is not None else pollution_data.get("pm25", 50.0)
        temperature = request.temperature if request.temperature is not None else weather_data.get("temperature", 25.0)
        humidity = request.humidity if request.humidity is not None else weather_data.get("humidity", 60.0)
        rainfall = request.rainfall if request.rainfall is not None else weather_data.get("rainfall", 0.0)
    else:
        aqi = request.aqi
        pm25 = request.pm25 if request.pm25 is not None else 50.0
        temperature = request.temperature
        humidity = request.humidity if request.humidity is not None else 60.0
        rainfall = request.rainfall if request.rainfall is not None else 0.0
    
    # Get hospital inputs
    bed_usage = None
    last_7day_patients = None
    if request.hospital_inputs:
        bed_usage = request.hospital_inputs.bed_usage
        last_7day_patients = request.hospital_inputs.last_7day_patients
    
    # Predict patient count and surge probability
    predictions = predict_patient_count_and_surge(
        aqi=aqi,
        pm25=pm25,
        temperature=temperature,
        humidity=humidity,
        rainfall=rainfall,
        city_name=city_name,
        bed_usage=bed_usage,
        last_7day_patients=last_7day_patients
    )
    
    expected_patients = predictions["expected_patients_next_24h"]
    surge_probability = predictions["surge_probability"]
    
    # Generate dashboard alerts
    alerts = generate_dashboard_alerts(
        pm25=pm25,
        aqi=aqi,
        city_name=city_name,
        expected_patients=expected_patients,
        surge_probability=surge_probability
    )
    
    # Generate recommended actions
    recommended_actions = generate_recommended_actions(
        aqi=aqi,
        expected_patients=expected_patients,
        surge_probability=surge_probability,
        bed_usage=bed_usage
    )
    
    # Return exact JSON structure as required
    return {
        "status": "success",
        "city": city_name.title(),
        "state": city_data["state"],
        "aqi": float(aqi),
        "pm25": float(pm25),
        "expected_patients_next_24h": expected_patients,
        "surge_probability": surge_probability,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "patient_dashboard": alerts["patient_dashboard"],
        "doctor_dashboard": alerts["doctor_dashboard"],
        "hospital_dashboard": alerts["hospital_dashboard"],
        "recommended_actions": recommended_actions
    }

@app.get("/predict/{city}", response_model=PredictionResponse)
async def quick_predict(
    city: str,
    aqi: Optional[float] = Query(None, description="Air Quality Index"),
    pm25: Optional[float] = Query(None, description="PM2.5 value"),
    temperature: Optional[float] = Query(None, description="Temperature in Celsius"),
    humidity: Optional[float] = Query(None, description="Humidity percentage"),
    rainfall: Optional[float] = Query(None, description="Rainfall in mm"),
    bed_usage: Optional[float] = Query(None, description="Bed usage percentage"),
    last_7day_patients: Optional[int] = Query(None, description="Total patients in last 7 days")
):
    """
    Quick prediction endpoint using query parameters
    """
    request = PredictionRequest(
        city=city,
        aqi=aqi,
        pm25=pm25,
        temperature=temperature,
        humidity=humidity,
        rainfall=rainfall,
        hospital_inputs=HospitalInputs(
            bed_usage=bed_usage,
            last_7day_patients=last_7day_patients
        ) if bed_usage is not None or last_7day_patients is not None else None
    )
    return await predict_healthcare_risk(request)

@app.get("/cities")
async def list_cities():
    """List all supported cities"""
    from Whether_pollution_agent.city_data import CITY_DATA
    cities = [{"name": name.title(), "state": data["state"]} for name, data in CITY_DATA.items()]
    return {"cities": cities, "count": len(cities)}

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
