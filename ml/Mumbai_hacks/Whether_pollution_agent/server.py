"""
FastAPI server for Healthcare Risk & Resource Prediction Agent
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Whether_pollution_agent.workflow import run_prediction
from typing import Optional, List, Dict, Any
import uvicorn

app = FastAPI(title="Healthcare Risk Prediction API",
              description="API for predicting healthcare risks based on air quality",
              version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    city: str
    bed_usage: Optional[float] = None
    last_7day_patients: Optional[int] = None

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
    """Root endpoint with API information"""
    return {
        "message": "Healthcare Risk Prediction API",
        "endpoints": {
            "GET /cities": "List of supported cities",
            "GET /predict/{city}": "Get prediction for a city",
            "POST /predict": "Get prediction with custom parameters"
        }
    }

@app.get("/cities", response_model=List[str])
async def get_supported_cities():
    """Get list of supported cities"""
    return ["Delhi", "Mumbai", "Pune", "Jaipur", "Bengaluru", 
            "Chennai", "Hyderabad", "Kolkata", "Ahmedabad", "Lucknow"]

@app.get("/predict/{city}", response_model=PredictionResponse)
async def predict_city(city: str):
    """Get prediction for a specific city"""
    try:
        result = run_prediction(city=city)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/predict", response_model=PredictionResponse)
async def predict_with_params(request: PredictionRequest):
    """Get prediction with custom parameters"""
    try:
        result = run_prediction(
            city=request.city,
            bed_usage=request.bed_usage,
            last_7day_patients=request.last_7day_patients
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8003, reload=True)
