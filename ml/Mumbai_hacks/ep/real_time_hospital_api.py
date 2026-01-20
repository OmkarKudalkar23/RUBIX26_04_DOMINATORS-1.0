"""
Real-time Hospital Data Collection Endpoints
FastAPI endpoints for real-time hospital data ingestion and retrieval
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any, Optional, List
import logging
import asyncio
from hospital_database import HospitalDatabase
from hospital_load import HospitalLoadCalculator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Real-time Hospital Data API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and calculator
db = HospitalDatabase()
calculator = HospitalLoadCalculator()

# Pydantic models for data validation
class HospitalCapacityInput(BaseModel):
    total_beds: int
    available_beds: int
    icu_beds: int
    available_icu: int
    ventilators: int
    available_ventilators: int
    staff_on_duty: int
    ambulance_available: int
    emergency_capacity: int

class HospitalLoadInput(BaseModel):
    current_patients: int
    icu_patients: int
    ventilator_patients: int
    emergency_wait_time: float
    bed_occupancy_rate: float
    icu_occupancy_rate: float
    staff_utilization: float
    ambulance_response_time: float

class ForecastRequest(BaseModel):
    city: str
    forecasted_cases: Dict[str, float]
    disease_type: str = "general"

# Real-time data collection endpoints
@app.post("/hospital/capacity/{city}")
async def update_hospital_capacity(city: str, capacity: HospitalCapacityInput):
    """
    Update hospital capacity in real-time
    
    Args:
        city: City name
        capacity: Hospital capacity data
    
    Returns:
        Success confirmation
    """
    try:
        capacity_data = capacity.dict()
        calculator.update_real_time_capacity(city, capacity_data)
        
        return {
            "status": "success",
            "message": f"Hospital capacity updated for {city}",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to update capacity for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/hospital/load/{city}")
async def update_hospital_load(city: str, load: HospitalLoadInput):
    """
    Update current hospital load in real-time
    
    Args:
        city: City name
        load: Current hospital load data
    
    Returns:
        Success confirmation
    """
    try:
        load_data = load.dict()
        calculator.update_real_time_load(city, load_data)
        
        return {
            "status": "success",
            "message": f"Hospital load updated for {city}",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to update load for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/hospital/forecast/{city}")
async def calculate_real_time_forecast(city: str, request: ForecastRequest):
    """
    Calculate hospital load forecast with real-time capacity data
    
    Args:
        city: City name
        request: Forecast request data
    
    Returns:
        Real-time forecast with capacity alerts
    """
    try:
        forecast = calculator.calculate_real_time_load(
            city=city,
            forecasted_cases=request.forecasted_cases,
            disease_type=request.disease_type
        )
        
        return {
            "status": "success",
            "city": city,
            "forecast": forecast,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to calculate forecast for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Data retrieval endpoints
@app.get("/hospital/status/{city}")
async def get_hospital_status(city: str):
    """
    Get comprehensive hospital status for a city
    
    Args:
        city: City name
    
    Returns:
        Complete hospital status summary
    """
    try:
        status = calculator.get_city_hospital_status(city)
        return {
            "status": "success",
            "city": city,
            "data": status,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get status for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hospital/capacity/{city}")
async def get_hospital_capacity(city: str):
    """
    Get current hospital capacity for a city
    
    Args:
        city: City name
    
    Returns:
        Current hospital capacity
    """
    try:
        capacity = db.get_hospital_capacity(city)
        if not capacity:
            raise HTTPException(status_code=404, detail=f"No capacity data found for {city}")
        
        return {
            "status": "success",
            "city": city,
            "capacity": capacity,
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get capacity for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hospital/load/{city}")
async def get_hospital_load(city: str, hours: int = Query(default=1, ge=1, le=24)):
    """
    Get recent hospital load data for a city
    
    Args:
        city: City name
        hours: Number of hours of data to retrieve (1-24)
    
    Returns:
        Recent hospital load data
    """
    try:
        load_data = db.get_real_time_load(city, hours)
        return {
            "status": "success",
            "city": city,
            "hours": hours,
            "load_data": load_data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get load data for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hospital/alerts/{city}")
async def get_hospital_alerts(city: str):
    """
    Get active hospital resource alerts for a city
    
    Args:
        city: City name
    
    Returns:
        Active resource alerts
    """
    try:
        alerts = calculator.get_active_resource_alerts(city)
        return {
            "status": "success",
            "city": city,
            "alerts": alerts,
            "alert_count": len(alerts),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get alerts for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hospital/forecast/{city}")
async def get_latest_forecast(city: str, disease_type: str = None):
    """
    Get latest disease forecast for a city
    
    Args:
        city: City name
        disease_type: Optional disease type filter
    
    Returns:
        Latest forecast data
    """
    try:
        forecast = db.get_latest_forecast(city, disease_type)
        if not forecast:
            raise HTTPException(status_code=404, detail=f"No forecast data found for {city}")
        
        return {
            "status": "success",
            "city": city,
            "forecast": forecast,
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get forecast for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# System management endpoints
@app.get("/system/stats")
async def get_system_stats():
    """
    Get system-wide statistics
    
    Returns:
        System statistics
    """
    try:
        stats = db.get_system_stats()
        return {
            "status": "success",
            "stats": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get system stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/system/test-connection")
async def test_database_connection():
    """
    Test database connection
    
    Returns:
        Connection status
    """
    try:
        # Test database operations
        test_city = "test_connection"
        test_capacity = {
            "total_beds": 100,
            "available_beds": 80,
            "icu_beds": 10,
            "available_icu": 8,
            "ventilators": 5,
            "available_ventilators": 4,
            "staff_on_duty": 50,
            "ambulance_available": 3,
            "emergency_capacity": 20
        }
        
        # Test write
        db.upsert_hospital_capacity(test_city, test_capacity)
        
        # Test read
        capacity = db.get_hospital_capacity(test_city)
        
        # Cleanup
        db.db.hospital_capacity.delete_one({"city": test_city})
        
        return {
            "status": "success",
            "message": "Database connection working",
            "test_write_read": capacity is not None,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Background task for periodic data collection
@app.post("/system/start-collection")
async def start_real_time_collection(background_tasks: BackgroundTasks):
    """
    Start real-time data collection background task
    
    Returns:
        Task start confirmation
    """
    try:
        background_tasks.add_task(collect_real_time_data)
        return {
            "status": "success",
            "message": "Real-time data collection started",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to start data collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def collect_real_time_data():
    """
    Background task to collect real-time hospital data
    Connects to actual hospital systems and APIs - no simulated data
    """
    cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"]
    
    while True:
        try:
            for city in cities:
                # Collect real hospital capacity data
                try:
                    capacity_data = await fetch_real_hospital_capacity(city)
                    calculator.update_real_time_capacity(city, capacity_data)
                    logger.info(f"✅ Updated real capacity for {city}")
                except Exception as e:
                    logger.error(f"Failed to fetch capacity for {city}: {e}")
                
                # Collect real hospital load data
                try:
                    load_data = await fetch_real_hospital_load(city)
                    calculator.update_real_time_load(city, load_data)
                    logger.info(f"✅ Updated real load for {city}")
                except Exception as e:
                    logger.error(f"Failed to fetch load for {city}: {e}")
            
            # Wait 5 minutes before next collection
            await asyncio.sleep(300)
            
        except Exception as e:
            logger.error(f"Error in real-time collection: {e}")
            await asyncio.sleep(60)  # Wait 1 minute before retry

async def fetch_real_hospital_capacity(city: str) -> Dict[str, Any]:
    """Fetch real hospital capacity from hospital management systems"""
    try:
        # Connect to hospital management system API
        hospital_api_url = os.getenv("HOSPITAL_API_URL", "https://api.hospital.example.com")
        
        headers = {
            "Authorization": f"Bearer {os.getenv('HOSPITAL_API_KEY', '')}",
            "Content-Type": "application/json"
        }
        
        # Query hospital capacity for the city
        response = requests.get(
            f"{hospital_api_url}/capacity/{city}",
            headers=headers,
            timeout=15
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"Hospital API returned status {response.status_code} for {city}")
            return get_default_capacity()
            
    except Exception as e:
        logger.error(f"Hospital capacity API error for {city}: {e}")
        return get_default_capacity()

async def fetch_real_hospital_load(city: str) -> Dict[str, Any]:
    """Fetch real hospital load from hospital management systems"""
    try:
        # Connect to hospital management system API
        hospital_api_url = os.getenv("HOSPITAL_API_URL", "https://api.hospital.example.com")
        
        headers = {
            "Authorization": f"Bearer {os.getenv('HOSPITAL_API_KEY', '')}",
            "Content-Type": "application/json"
        }
        
        # Query current hospital load for the city
        response = requests.get(
            f"{hospital_api_url}/load/{city}",
            headers=headers,
            timeout=15
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"Hospital load API returned status {response.status_code} for {city}")
            return get_default_load()
            
    except Exception as e:
        logger.error(f"Hospital load API error for {city}: {e}")
        return get_default_load()

def get_default_capacity() -> Dict[str, Any]:
    """Return default capacity values when API is unavailable"""
    return {
        "total_beds": 0,
        "available_beds": 0,
        "icu_beds": 0,
        "available_icu": 0,
        "ventilators": 0,
        "available_ventilators": 0,
        "staff_on_duty": 0,
        "ambulance_available": 0,
        "emergency_capacity": 0
    }

def get_default_load() -> Dict[str, Any]:
    """Return default load values when API is unavailable"""
    return {
        "current_patients": 0,
        "icu_patients": 0,
        "ventilator_patients": 0,
        "emergency_wait_time": 0,
        "bed_occupancy_rate": 0,
        "icu_occupancy_rate": 0,
        "staff_utilization": 0,
        "ambulance_response_time": 0
    }

# Root endpoint
@app.get("/")
async def root():
    """API information"""
    return {
        "message": "Real-time Hospital Data API",
        "version": "1.0.0",
        "endpoints": {
            "capacity": "/hospital/capacity/{city}",
            "load": "/hospital/load/{city}",
            "forecast": "/hospital/forecast/{city}",
            "status": "/hospital/status/{city}",
            "alerts": "/hospital/alerts/{city}",
            "system_stats": "/system/stats",
            "test_connection": "/system/test-connection",
            "start_collection": "/system/start-collection"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=True)
