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
from Whether_pollution_agent.early_warning_workflow import EarlyWarningWorkflow
from data_manager import DataManager
from ml_model import PatientPredictor

app = FastAPI(title="Healthcare Risk & Resource Prediction API", version="1.0.0")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize data manager and ML model
data_manager = DataManager()
ml_predictor = PatientPredictor()

# Try to load existing ML model
ml_model_available = ml_predictor.load_model()
if ml_model_available:
    print(f"✅ Loaded ML model from disk. Training metrics: {ml_predictor.training_metrics}")
else:
    print("ℹ️  No ML model found. Will use rule-based predictions. Train model after collecting data.")

# Initialize early warning system
early_warning = EarlyWarningWorkflow()

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
    day_of_week: Optional[int] = None  # 0=Monday, 6=Sunday
    is_holiday: Optional[bool] = None
    actual_patients: Optional[int] = None  # For feedback after prediction

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
    prediction_method: Optional[str] = None  # "ml_model" or "rule_based"
    confidence_interval: Optional[Dict[str, int]] = None
    factors: Optional[Dict[str, Any]] = None  # day_factor, holiday_factor, etc.

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
    
    # Get day of week and holiday status
    day_of_week = request.day_of_week
    is_holiday = request.is_holiday
    
    # Set defaults if not provided
    if day_of_week is None:
        day_of_week = datetime.now().weekday()
    if is_holiday is None:
        from Whether_pollution_agent.city_data import is_festival_week
        is_holiday = is_festival_week(datetime.now().month, datetime.now().day)
    
    # Try ML model prediction first, fall back to rule-based
    prediction_method = "rule_based"
    expected_patients = None
    surge_probability = 0.0
    confidence_interval = None
    factors = None
    
    if ml_predictor.is_trained:
        try:
            # Prepare features for ML model (day_of_week and is_holiday already set)
            features = data_manager.prepare_features(
                aqi=aqi,
                pm25=pm25,
                temperature=temperature,
                humidity=humidity,
                rainfall=rainfall,
                day_of_week=day_of_week,
                is_holiday=is_holiday,
                bed_usage=bed_usage,
                last_7day_patients=last_7day_patients
            )
            
            # Get ML prediction
            ml_prediction, ml_confidence_std = ml_predictor.predict(features)
            
            # Also get rule-based prediction for surge probability
            rule_based_pred = predict_patient_count_and_surge(
                aqi=aqi,
                pm25=pm25,
                temperature=temperature,
                humidity=humidity,
                rainfall=rainfall,
                city_name=city_name,
                bed_usage=bed_usage,
                last_7day_patients=last_7day_patients,
                day_of_week=day_of_week,
                is_holiday=is_holiday
            )
            
            # Use ML prediction for patient count, rule-based for surge
            expected_patients = ml_prediction
            surge_probability = rule_based_pred["surge_probability"]
            prediction_method = "ml_model"
            
            # Calculate confidence interval from ML model
            confidence_lower = max(0, int(expected_patients - 1.96 * ml_confidence_std))
            confidence_upper = int(expected_patients + 1.96 * ml_confidence_std)
            confidence_interval = {
                "lower": confidence_lower,
                "upper": confidence_upper
            }
            
            # Get factors from rule-based model
            factors = {
                "day_factor": rule_based_pred.get("day_factor", 1.0),
                "holiday_factor": rule_based_pred.get("holiday_factor", 1.0),
                "day_of_week": day_of_week,
                "is_holiday": is_holiday
            }
        except Exception as e:
            print(f"ML model prediction failed: {e}. Falling back to rule-based.")
            prediction_method = "rule_based"
    
    # Use rule-based if ML model not available or failed
    if prediction_method == "rule_based":
        predictions = predict_patient_count_and_surge(
            aqi=aqi,
            pm25=pm25,
            temperature=temperature,
            humidity=humidity,
            rainfall=rainfall,
            city_name=city_name,
            bed_usage=bed_usage,
            last_7day_patients=last_7day_patients,
            day_of_week=day_of_week,
            is_holiday=is_holiday
        )
        
        expected_patients = predictions["expected_patients_next_24h"]
        surge_probability = predictions["surge_probability"]
        confidence_interval = predictions.get("confidence_interval")
        factors = {
            "day_factor": predictions.get("day_factor", 1.0),
            "holiday_factor": predictions.get("holiday_factor", 1.0),
            "day_of_week": predictions.get("day_of_week"),
            "is_holiday": predictions.get("is_holiday")
        }
    
    # Log prediction to data manager (for future training)
    timestamp_str = datetime.utcnow().isoformat() + "Z"
    data_manager.save_prediction(
        city=city_name,
        aqi=aqi,
        pm25=pm25,
        temperature=temperature,
        humidity=humidity,
        rainfall=rainfall,
        predicted_patients=expected_patients,
        surge_probability=surge_probability,
        day_of_week=day_of_week,
        is_holiday=is_holiday,
        bed_usage=bed_usage,
        last_7day_patients=last_7day_patients,
        prediction_method=prediction_method,
        actual_patients=request.actual_patients  # If provided, log it
    )
    
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
    response = {
        "status": "success",
        "city": city_name.title(),
        "state": city_data["state"],
        "aqi": float(aqi),
        "pm25": float(pm25),
        "expected_patients_next_24h": expected_patients,
        "surge_probability": surge_probability,
        "timestamp": timestamp_str,
        "patient_dashboard": alerts["patient_dashboard"],
        "doctor_dashboard": alerts["doctor_dashboard"],
        "hospital_dashboard": alerts["hospital_dashboard"],
        "recommended_actions": recommended_actions,
        "prediction_method": prediction_method,
        "confidence_interval": confidence_interval,
        "factors": factors
    }
    return response

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

class FeedbackRequest(BaseModel):
    timestamp: str  # ISO format timestamp from prediction
    city: str
    actual_patients: int

class FeedbackResponse(BaseModel):
    status: str
    message: str
    metrics: Optional[Dict[str, Any]] = None

@app.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackRequest):
    """
    Submit actual patient count after prediction for model improvement
    """
    try:
        success = data_manager.update_actual_patients(
            timestamp=request.timestamp,
            city=request.city,
            actual_patients=request.actual_patients
        )
        
        if success:
            # Calculate updated metrics
            metrics = data_manager.calculate_metrics(city=request.city)
            
            # Check if we have enough data to retrain ML model
            historical_data = data_manager.load_historical_data(min_records=20, city=request.city)
            if historical_data is not None and len(historical_data) >= 20:
                # Retrain model with new data
                train_success, train_metrics = ml_predictor.train(historical_data)
                if train_success:
                    ml_predictor.save_model()
                    metrics["model_retrained"] = True
                    metrics["training_metrics"] = train_metrics
                else:
                    metrics["model_retrained"] = False
                    metrics["training_error"] = train_metrics.get("error", "Unknown error")
            else:
                metrics["model_retrained"] = False
                metrics["message"] = f"Need at least 20 records for training. Current: {len(historical_data) if historical_data is not None else 0}"
            
            return {
                "status": "success",
                "message": "Feedback recorded successfully",
                "metrics": metrics
            }
        else:
            raise HTTPException(status_code=404, detail="Prediction record not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")

@app.get("/metrics")
async def get_metrics(city: Optional[str] = None):
    """Get prediction accuracy metrics"""
    metrics = data_manager.calculate_metrics(city=city)
    
    # Add model status
    metrics["ml_model_available"] = ml_predictor.is_trained
    if ml_predictor.is_trained:
        metrics["ml_model_metrics"] = ml_predictor.training_metrics
        metrics["feature_importance"] = ml_predictor.get_feature_importance()
    
    return metrics

# Early Warning System Endpoints

class EarlyWarningRequest(BaseModel):
    city: str
    date: Optional[str] = None  # ISO format date string

class EarlyWarningResponse(BaseModel):
    status: str
    city: str
    timestamp: str
    alert: Dict[str, Any]
    current_signals: Dict[str, Any]
    anomaly_detection: Dict[str, Any]
    forecasts: Dict[str, Any]
    hospital_load: Optional[Dict[str, Any]] = None

@app.post("/early-warning", response_model=EarlyWarningResponse)
async def get_early_warning(request: EarlyWarningRequest):
    """
    Get early warning system analysis for a city
    
    This endpoint runs the complete early warning system:
    1. Collects early signals (ER visits, lab tests, ambulance calls, etc.)
    2. Compares with seasonal baseline
    3. Detects anomalies
    4. Forecasts next 7-14 days
    5. Calculates hospital load
    6. Generates graded alert (INFO, WATCH, WARNING, CRITICAL)
    """
    try:
        from datetime import datetime
        
        date = None
        if request.date:
            date = datetime.fromisoformat(request.date)
        
        result = early_warning.run_early_warning(request.city, date)
        
        return EarlyWarningResponse(
            status=result.get("status", "success"),
            city=result.get("city", request.city),
            timestamp=result.get("timestamp", datetime.now().isoformat()),
            alert=result.get("alert", {}),
            current_signals=result.get("current_signals", {}),
            anomaly_detection=result.get("anomaly_detection", {}),
            forecasts=result.get("forecasts", {}),
            hospital_load=result.get("hospital_load")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running early warning: {str(e)}")

@app.get("/early-warning/{city}")
async def get_early_warning_quick(city: str):
    """Quick early warning check for a city (uses current date)"""
    try:
        result = early_warning.run_daily_check(city)
        
        return {
            "status": result.get("status", "success"),
            "city": result.get("city", city),
            "timestamp": result.get("timestamp"),
            "alert": result.get("alert", {}),
            "summary": {
                "alert_level": result.get("alert", {}).get("alert_level", "NORMAL"),
                "message": result.get("alert", {}).get("message", ""),
                "total_anomalies": result.get("anomaly_detection", {}).get("total_anomalies", 0),
                "forecast_increase": result.get("forecast_summary", {}).get("max_increase_percentage", 0.0)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running early warning: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
