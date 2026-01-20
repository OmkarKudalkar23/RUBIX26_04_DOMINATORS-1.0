"""
FastAPI Server for Early Warning System
Provides REST API endpoints for disease outbreak early warning
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import uvicorn
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ep.early_warning_workflow import EarlyWarningWorkflow

# Initialize FastAPI app
app = FastAPI(
    title="Early Warning System API",
    description="API for disease outbreak early warning system",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize workflow
workflow = EarlyWarningWorkflow()

# Request/Response Models
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

class QuickCheckResponse(BaseModel):
    status: str
    city: str
    timestamp: str
    alert_level: str
    message: str
    total_anomalies: int
    max_spike_percentage: float
    forecast_increase_percentage: float
    recommendations: List[str]

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Early Warning System API",
        "version": "1.0.0",
        "description": "Disease outbreak early warning system",
        "endpoints": {
            "GET /health": "Health check",
            "GET /cities": "List supported cities",
            "POST /early-warning": "Full early warning analysis",
            "GET /early-warning/{city}": "Quick early warning check",
            "GET /signals/{city}": "Get current signals",
            "GET /forecast/{city}": "Get forecast data",
            "GET /hospital-load/{city}": "Get hospital load forecast"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Early Warning System",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/cities")
async def get_cities():
    """Get list of supported cities"""
    # Import city data from parent package
    from Whether_pollution_agent.city_data import CITY_DATA
    
    cities = [
        {"name": name.title(), "state": data.get("state", "Unknown")}
        for name, data in CITY_DATA.items()
    ]
    
    return {
        "cities": cities,
        "count": len(cities)
    }

@app.post("/early-warning", response_model=EarlyWarningResponse)
async def get_early_warning(request: EarlyWarningRequest):
    """
    Get complete early warning analysis for a city
    
    This endpoint runs the complete early warning system:
    1. Collects early signals (ER visits, lab tests, ambulance calls, etc.)
    2. Compares with seasonal baseline
    3. Detects anomalies
    4. Forecasts next 7-14 days
    5. Calculates hospital load
    6. Generates graded alert (INFO, WATCH, WARNING, CRITICAL)
    """
    try:
        date = None
        if request.date:
            try:
                date = datetime.fromisoformat(request.date)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
                )
        
        result = workflow.run_early_warning(request.city, date)
        
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

@app.get("/early-warning/{city}", response_model=QuickCheckResponse)
async def quick_early_warning(
    city: str,
    date: Optional[str] = Query(None, description="ISO format date (optional)")
):
    """
    Quick early warning check for a city
    
    Returns a simplified response with key information
    """
    try:
        date_obj = None
        if date:
            try:
                date_obj = datetime.fromisoformat(date)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
                )
        
        result = workflow.run_early_warning(city, date_obj)
        
        alert = result.get("alert", {})
        metrics = alert.get("metrics", {})
        
        return QuickCheckResponse(
            status=result.get("status", "success"),
            city=result.get("city", city),
            timestamp=result.get("timestamp", datetime.now().isoformat()),
            alert_level=alert.get("alert_level", "NORMAL"),
            message=alert.get("message", ""),
            total_anomalies=metrics.get("total_anomalies", 0),
            max_spike_percentage=metrics.get("max_spike_percentage", 0.0),
            forecast_increase_percentage=metrics.get("forecast_increase_percentage", 0.0),
            recommendations=alert.get("recommendations", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running early warning: {str(e)}")

@app.get("/signals/{city}")
async def get_current_signals(
    city: str,
    date: Optional[str] = Query(None, description="ISO format date (optional)")
):
    """Get current early signals for a city"""
    try:
        date_obj = None
        if date:
            try:
                date_obj = datetime.fromisoformat(date)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
                )
        
        signals = workflow.signal_collector.collect_all_signals(city, date_obj)
        
        return {
            "status": "success",
            "city": city,
            "timestamp": signals.get("timestamp", datetime.now().isoformat()),
            "signals": {
                "er_visits": signals.get("er_visits", {}),
                "lab_positivity": signals.get("lab_positivity", {}),
                "ambulance_calls": signals.get("ambulance_calls", {}),
                "pharmacy_otc_sales": signals.get("pharmacy_otc_sales", {}),
                "weather": signals.get("weather", {}),
                "search_trends": signals.get("search_trends", {}),
                "mosquito_index": signals.get("mosquito_index", {})
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error collecting signals: {str(e)}")

@app.get("/forecast/{city}")
async def get_forecast(
    city: str,
    days: int = Query(7, description="Number of days to forecast (7 or 14)", ge=1, le=14)
):
    """Get forecast data for a city"""
    try:
        # Get recent signals for forecasting
        recent_data = workflow.signal_collector.get_recent_signals(city, days=30)
        
        if not recent_data:
            # Collect some initial data
            for days_ago in range(7, 0, -1):
                date = datetime.now() - timedelta(days=days_ago)
                workflow.signal_collector.collect_all_signals(city, date)
            recent_data = workflow.signal_collector.get_recent_signals(city, days=30)
        
        forecasts = workflow.forecaster.forecast_all_signals(city, recent_data, forecast_days=days)
        forecast_summary = workflow.forecaster.get_forecast_summary(forecasts)
        
        return {
            "status": "success",
            "city": city,
            "forecast_days": days,
            "forecast_summary": forecast_summary,
            "forecasts": forecasts,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

@app.get("/hospital-load/{city}")
async def get_hospital_load(
    city: str,
    disease_type: Optional[str] = Query("general", description="Disease type: viral_fever, dengue, respiratory, general")
):
    """Get hospital load forecast for a city"""
    try:
        # Get recent signals and forecast
        recent_data = workflow.signal_collector.get_recent_signals(city, days=30)
        
        if not recent_data:
            # Collect some initial data
            for days_ago in range(7, 0, -1):
                date = datetime.now() - timedelta(days=days_ago)
                workflow.signal_collector.collect_all_signals(city, date)
            recent_data = workflow.signal_collector.get_recent_signals(city, days=30)
        
        # Get ER visits forecast
        forecasts = workflow.forecaster.forecast_all_signals(city, recent_data)
        
        hospital_load = None
        if "er_visits" in forecasts and "total" in forecasts["er_visits"]:
            er_forecast = forecasts["er_visits"]["total"]
            if er_forecast.get("forecast_available", False):
                hospital_load = workflow.hospital_calculator.calculate_load_from_forecast(
                    er_forecast, "er_visits", "total"
                )
                
                # Override disease type if specified
                if disease_type != "general":
                    forecast_values = er_forecast.get("forecast_values", [])
                    forecasted_cases = {}
                    total_cases = sum(forecast_values)
                    for i, value in enumerate(forecast_values, 1):
                        forecasted_cases[f"day_{i}"] = value
                    forecasted_cases["total_7day"] = total_cases
                    hospital_load = workflow.hospital_calculator.calculate_load(
                        forecasted_cases, disease_type
                    )
                    hospital_load["load_available"] = True
        
        if not hospital_load or not hospital_load.get("load_available"):
            return {
                "status": "error",
                "message": "Forecast not available. Need more historical data.",
                "city": city
            }
        
        return {
            "status": "success",
            "city": city,
            "disease_type": disease_type,
            "hospital_load": hospital_load,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating hospital load: {str(e)}")

@app.get("/anomalies/{city}")
async def get_anomalies(city: str):
    """Get anomaly detection results for a city"""
    try:
        # Get current signals
        current_signals = workflow.signal_collector.collect_all_signals(city)
        
        # Get historical data
        historical_data = workflow.signal_collector.get_recent_signals(city, days=90)
        
        # Detect anomalies
        anomaly_results = workflow.anomaly_detector.detect_anomalies(
            city, current_signals, historical_data
        )
        
        # Add summary
        anomaly_summary = workflow.anomaly_detector.get_anomaly_summary(anomaly_results)
        anomaly_results["anomaly_summary"] = anomaly_summary
        
        return {
            "status": "success",
            "city": city,
            "anomaly_detection": anomaly_results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting anomalies: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )

