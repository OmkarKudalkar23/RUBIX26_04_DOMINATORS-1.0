# tools.py
import requests
import pandas as pd
from datetime import datetime
import joblib
from typing import Optional, Dict, Any, Tuple
import random
from datetime import datetime, time
from .city_data import get_city_data, is_festival_week, is_winter_north_india

# Configuration
MOCK_MODE = True  # Set to False to use real API data
MOCK_BASE_AQI = 160  # Base AQI for mock data (will vary ±15%)
MOCK_UPDATE_INTERVAL_MIN = 5  # Simulate data update every 5 minutes

def _get_mock_weather(city_name: str) -> Dict[str, float]:
    """Generate consistent mock weather data based on city and time of day"""
    now = datetime.now().time()
    city_data = get_city_data(city_name)
    
    # Simulate daily temperature curve
    if time(5, 0) <= now < time(12, 0):  # Morning
        base_temp = city_data["characteristics"].get("avg_temp", 25)
        humidity = 70
    elif time(12, 0) <= now < time(16, 0):  # Afternoon
        base_temp = city_data["characteristics"].get("avg_temp", 25) + 3
        humidity = 50
    else:  # Evening/Night
        base_temp = city_data["characteristics"].get("avg_temp", 25) - 2
        humidity = 80
        
    return {
        "temperature": round(base_temp + random.uniform(-2, 2), 1),
        "humidity": max(30, min(90, humidity + random.uniform(-10, 10))),
        "rainfall": 0.0  # No rain in mock data for consistency
    }

def fetch_weather_api(city_name: str = "Mumbai") -> Dict[str, float]:
    """Fetch weather data for any Indian city"""
    if MOCK_MODE:
        return _get_mock_weather(city_name)
        
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city_name},IN&appid=6ace1fe2bf41726e0b9de1a30d9c0fc7&units=metric"
        r = requests.get(url, timeout=5).json()
        if r.get("cod") == 200:
            return {
                "temperature": r["main"]["temp"],
                "humidity": r["main"]["humidity"],
                "rainfall": r.get("rain", {}).get("1h", 0) if "rain" in r else 0
            }
    except Exception as e:
        print(f"Weather API error: {e}")
    
    # Fallback to typical values based on city
    return _get_mock_weather(city_name)

try:
    from openaq import OpenAQ
    OPENAQ_AVAILABLE = True
except ImportError:
    OPENAQ_AVAILABLE = False

def _get_mock_pollution(city_name: str) -> Dict[str, Any]:
    """Generate consistent mock pollution data based on city and time of day"""
    city_data = get_city_data(city_name)
    now = datetime.now()
    
    # Base AQI varies by time of day (higher during rush hours)
    hour = now.hour
    if 7 <= hour < 10 or 17 <= hour < 21:  # Rush hours
        aqi_variation = MOCK_BASE_AQI * 1.2
    else:
        aqi_variation = MOCK_BASE_AQI * 0.9
    
    # Add slight randomness (but less than real API)
    base_aqi = aqi_variation * random.uniform(0.95, 1.05)
    pm25_value = aqi_to_pm25(base_aqi)
    
    return {
        "pm25": round(pm25_value, 2),
        "aqi": int(base_aqi),
        "unit": "µg/m³",
        "timestamp": now.isoformat(),
        "warning": "Using mock data for consistent testing"
    }

def fetch_pollution_data(city_name: str = "Mumbai") -> Dict[str, Any]:
    """Fetch PM2.5 and AQI data for any Indian city"""
    if MOCK_MODE:
        return _get_mock_pollution(city_name)
        
    city_data = get_city_data(city_name)
    coordinates = city_data["coordinates"]
    
    if OPENAQ_AVAILABLE:
        try:
            client = OpenAQ(api_key="cf5eb85b1c7a5da8bd58fbbcbaf5bca891ebe5dd2ed992f9a4b0f156793cd2df")
            
            # Find PM2.5 sensors near city
            locations = client.locations.list(
                coordinates=coordinates,
                radius=25000,  # 25km radius (API limit)
                parameters_id=2,  # PM2.5
                limit=10
            )
            
            if locations.results:
                first_sensor = locations.results[0]
                sensor_id = first_sensor.id
                
                pm25_data = client.measurements.list(
                    sensors_id=sensor_id,
                    limit=1
                )
                
                client.close()
                
                if pm25_data.results:
                    measurement = pm25_data.results[0]
                    pm25_value = measurement.value
                    
                    # Convert PM2.5 to AQI (simplified conversion)
                    aqi = pm25_to_aqi(pm25_value)
                    
                    return {
                        "pm25": pm25_value,
                        "aqi": aqi,
                        "unit": "µg/m³",
                        "timestamp": datetime.utcnow().isoformat()
                    }
        except Exception as e:
            print(f"OpenAQ API error: {e}")
    
    # Fallback to mock data if API fails
    return _get_mock_pollution(city_name)

def pm25_to_aqi(pm25: float) -> int:
    """Convert PM2.5 to AQI (simplified)"""
    if pm25 <= 12:
        return int(50 * (pm25 / 12))
    elif pm25 <= 35.4:
        return int(50 + 50 * ((pm25 - 12) / 23.4))
    elif pm25 <= 55.4:
        return int(100 + 50 * ((pm25 - 35.4) / 20))
    elif pm25 <= 150.4:
        return int(150 + 50 * ((pm25 - 55.4) / 95))
    elif pm25 <= 250.4:
        return int(200 + 100 * ((pm25 - 150.4) / 100))
    else:
        return min(400, int(300 + 100 * ((pm25 - 250.4) / 149.6)))

def aqi_to_pm25(aqi: float) -> float:
    """Convert AQI to PM2.5 (simplified reverse)"""
    if aqi <= 50:
        return aqi * 12 / 50
    elif aqi <= 100:
        return 12 + (aqi - 50) * 23.4 / 50
    elif aqi <= 150:
        return 35.4 + (aqi - 100) * 20 / 50
    elif aqi <= 200:
        return 55.4 + (aqi - 150) * 95 / 50
    elif aqi <= 300:
        return 150.4 + (aqi - 200) * 100 / 100
    else:
        return 250.4 + (aqi - 300) * 149.6 / 100

def store_environment_data(data):
    """Store environment data to CSV"""
    try:
        df = pd.DataFrame([data])
        df.to_csv("environment_log.csv", mode="a", header=False, index=False)
    except Exception as e:
        print(f"Error storing data: {e}")
    return "stored"

def predict_patient_count_and_surge(
    aqi: float,
    pm25: float,
    temperature: float,
    humidity: float,
    rainfall: float,
    city_name: str,
    bed_usage: Optional[float] = None,
    last_7day_patients: Optional[int] = None,
    day_of_week: Optional[int] = None,
    is_holiday: Optional[bool] = None
) -> Dict[str, Any]:
    """
    Predict expected patient count and surge probability for next 24 hours
    Enhanced with day of week and holiday factors
    """
    from datetime import datetime
    
    city_data = get_city_data(city_name)
    now = datetime.now()
    month = now.month
    day = now.day
    
    # Get day of week (0=Monday, 6=Sunday) if not provided
    if day_of_week is None:
        day_of_week = now.weekday()
    
    # Check if holiday if not provided
    if is_holiday is None:
        is_holiday = is_festival_week(month, day)
    
    # Base patient count calculation
    base_patients = 50  # Base daily patients
    
    # Adjust based on AQI
    if aqi <= 50:
        aqi_factor = 0.8
    elif aqi <= 100:
        aqi_factor = 1.0
    elif aqi <= 150:
        aqi_factor = 1.3
    elif aqi <= 200:
        aqi_factor = 1.6
    elif aqi <= 300:
        aqi_factor = 2.0
    else:
        aqi_factor = 2.5
    
    # Temperature factor (extreme temperatures increase respiratory issues)
    if temperature < 10 or temperature > 40:
        temp_factor = 1.2
    elif temperature < 15 or temperature > 35:
        temp_factor = 1.1
    else:
        temp_factor = 1.0
    
    # Humidity factor
    if humidity > 80:
        humidity_factor = 1.15
    elif humidity < 30:
        humidity_factor = 1.1
    else:
        humidity_factor = 1.0
    
    # Day of week factor (Monday and Friday typically higher, Sunday lower)
    if day_of_week == 0:  # Monday
        day_factor = 1.15  # Higher after weekend
    elif day_of_week == 4:  # Friday
        day_factor = 1.10  # Higher before weekend
    elif day_of_week == 6:  # Sunday
        day_factor = 0.85  # Lower on Sunday
    else:
        day_factor = 1.0
    
    # Holiday factor
    holiday_factor = 1.20 if is_holiday else 1.0  # Higher during holidays/festivals
    
    # City-specific multiplier
    city_multiplier = city_data["characteristics"]["surge_multiplier"]
    
    # Calculate expected patients with all factors
    expected_patients = int(
        base_patients * aqi_factor * temp_factor * humidity_factor * 
        day_factor * holiday_factor * city_multiplier
    )
    
    # If hospital data provided, adjust based on historical trend
    if last_7day_patients:
        avg_daily = last_7day_patients / 7
        expected_patients = int((expected_patients + avg_daily) / 2)
    
    # Surge probability calculation
    surge_probability = 0.0
    
    # AQI-based surge triggers
    if aqi > 300:
        surge_probability += 65
    elif aqi > 200:
        surge_probability += 40
    elif aqi > 150:
        surge_probability += 25
    
    # PM2.5 trend (simplified - would need historical data for real trend)
    # For now, if PM2.5 is very high, assume rising trend
    if pm25 > 150:
        surge_probability += 20
    
    # Festival week / Holiday
    if is_holiday or is_festival_week(month, day):
        surge_probability += 15
    
    # Winter + North India
    if is_winter_north_india(month, city_data):
        if city_data["characteristics"].get("extreme_pm25"):
            surge_probability += 25
        else:
            surge_probability += 10
    
    # Day of week surge adjustment
    if day_of_week == 0:  # Monday surge
        surge_probability += 5
    
    # Cap at 100%
    surge_probability = min(100, surge_probability)
    
    # If surge probability is high, increase expected patients
    if surge_probability > 50:
        expected_patients = int(expected_patients * (1 + surge_probability / 200))
    
    # Calculate confidence intervals (based on prediction stability)
    # Higher confidence when factors are moderate, lower when extreme
    prediction_std = expected_patients * 0.15  # 15% standard deviation estimate
    confidence_lower = max(0, int(expected_patients - 1.96 * prediction_std))
    confidence_upper = int(expected_patients + 1.96 * prediction_std)
    
    return {
        "expected_patients_next_24h": expected_patients,
        "surge_probability": round(surge_probability, 1),
        "day_of_week": day_of_week,
        "is_holiday": is_holiday,
        "day_factor": round(day_factor, 3),
        "holiday_factor": round(holiday_factor, 3),
        "confidence_interval": {
            "lower": confidence_lower,
            "upper": confidence_upper
        }
    }


def generate_dashboard_alerts(
    pm25: Optional[float] = None,
    aqi: Optional[float] = None,
    city_name: str = "Mumbai",
    expected_patients: Optional[int] = None,
    surge_probability: Optional[float] = None
) -> Dict[str, str]:
    """Generate city-specific patient/doctor/hospital alerts"""
    
    if aqi is None and pm25 is not None:
        aqi = pm25_to_aqi(pm25)
    elif aqi is None:
        return {"error": "Provide pm25 or aqi for generating alerts"}
    
    city_data = get_city_data(city_name)
    city_display = city_name.title()
    
    # Patient Dashboard - Simple language, behavioral guidance
    if aqi <= 50:
        patient_msg = f"Air quality is good in {city_display} today (AQI {int(aqi)}). Enjoy your day normally."
    elif aqi <= 100:
        patient_msg = f"Air quality is moderate in {city_display} (AQI {int(aqi)}). Sensitive groups should take care and limit outdoor activities."
    elif aqi <= 150:
        patient_msg = f"Air quality is unhealthy for sensitive groups in {city_display} (AQI {int(aqi)}). Wear a mask if outdoors, especially if you have respiratory conditions."
    elif aqi <= 200:
        patient_msg = f"Air quality is unhealthy in {city_display} today (AQI {int(aqi)}). Limit outdoor activities and wear N95 masks when outside."
    elif aqi <= 300:
        patient_msg = f"Very unhealthy air quality in {city_display} (AQI {int(aqi)}). Stay indoors as much as possible. Wear an N95 mask when outside."
    else:
        patient_msg = f"⚠ Dangerously high pollution in {city_display} (AQI {int(aqi)})! Avoid going out completely. Use air purifiers indoors."
    
    # Doctor Dashboard - Clinical alerts, disease-specific risks
    if aqi <= 50:
        doctor_msg = "Normal day. No expected respiratory increase."
    elif aqi <= 100:
        doctor_msg = "Mild risk for asthma/COPD patients. Keep inhalers and nebulizers ready."
    elif aqi <= 150:
        if expected_patients:
            doctor_msg = f"Expect 20-30% rise in asthma/COPD cases. Prepare for {expected_patients} respiratory patients in next 24 hours."
        else:
            doctor_msg = "Expect more visits from asthma patients today. Monitor patients with chronic respiratory conditions."
    elif aqi <= 200:
        if expected_patients:
            doctor_msg = f"High chance of 30-40% increase in asthma/bronchitis cases. Expected {expected_patients} patients. Monitor critical respiratory patients closely."
        else:
            doctor_msg = "High chance of increased asthma/bronchitis cases. Monitor critical patients. Review severe asthma/COPD cases."
    elif aqi <= 300:
        if expected_patients:
            doctor_msg = f"Expect heavy respiratory load. 40-50% surge in cases likely. Prepare for {expected_patients} patients. Review all severe asthma/COPD cases immediately."
        else:
            doctor_msg = "Expect heavy respiratory load. Review severe asthma/COPD cases. Prepare for emergency admissions."
    else:
        if expected_patients:
            doctor_msg = f"🚨 Severe spike expected. Treat pollution as medical emergency. Prepare for {expected_patients}+ patients. Activate emergency respiratory protocols."
        else:
            doctor_msg = "Severe spike expected. Treat pollution as a medical emergency. Activate emergency protocols for respiratory cases."
    
    # Hospital Dashboard - Operational alerts, resource needs
    if aqi <= 50:
        hospital_msg = "No special preparation required today."
    elif aqi <= 100:
        hospital_msg = "Ensure respiratory ward is staffed normally. Maintain standard inventory."
    elif aqi <= 150:
        if expected_patients:
            hospital_msg = f"Stock inhalers and nebulizers. Prepare for mild OPD increase. Expected {expected_patients} patients. Open 2-3 additional beds."
        else:
            hospital_msg = "Stock inhalers, nebulizers. Prepare for mild OPD increase."
    elif aqi <= 200:
        oxygen_increase = 15
        beds = 5
        if expected_patients:
            beds = max(5, expected_patients // 10)
        hospital_msg = f"Increase respiratory OPD capacity by 15%. Ready oxygen cylinders. Prepare {beds} emergency beds. Expected {expected_patients} patients."
    elif aqi <= 300:
        oxygen_increase = 30
        beds = 10
        if expected_patients:
            beds = max(10, expected_patients // 8)
        hospital_msg = f"⚠ Increase oxygen cylinder stock by 30%. Prepare {beds} emergency beds. Notify respiratory department heads. Expected {expected_patients} patients."
    else:
        oxygen_increase = 50
        beds = 15
        if expected_patients:
            beds = max(15, expected_patients // 6)
        hospital_msg = f"🚨 Emergency protocol: Increase oxygen by 50%. Prepare {beds} emergency beds. Activate surge plan. Call backup staff. Expected {expected_patients}+ patients."
    
    # Add surge probability context if available
    if surge_probability and surge_probability > 50:
        hospital_msg += f" Surge probability: {surge_probability}%."
    
    return {
        "aqi": int(aqi),
        "patient_dashboard": patient_msg,
        "doctor_dashboard": doctor_msg,
        "hospital_dashboard": hospital_msg,
    }

def generate_recommended_actions(
    aqi: float,
    expected_patients: int,
    surge_probability: float,
    bed_usage: Optional[float] = None
) -> Dict[str, Any]:
    """Generate recommended actions for hospital administration"""
    
    # Oxygen cylinder increase
    if aqi > 300:
        oxygen_increase = 50
    elif aqi > 200:
        oxygen_increase = 30
    elif aqi > 150:
        oxygen_increase = 20
    elif aqi > 100:
        oxygen_increase = 10
    else:
        oxygen_increase = 0
    
    # Emergency beds to open
    if expected_patients > 150:
        emergency_beds = max(20, expected_patients // 5)
    elif expected_patients > 100:
        emergency_beds = max(15, expected_patients // 6)
    elif expected_patients > 70:
        emergency_beds = max(10, expected_patients // 7)
    elif expected_patients > 50:
        emergency_beds = max(5, expected_patients // 10)
    else:
        emergency_beds = 0
    
    # Staff alert required
    staff_alert = surge_probability > 40 or aqi > 200 or expected_patients > 100
    
    # Mask advisory
    mask_advisory = aqi > 100
    
    return {
        "oxygen_cylinder_increase_percent": oxygen_increase,
        "emergency_beds_to_open": emergency_beds,
        "staff_alert_required": staff_alert,
        "mask_advisory": mask_advisory
    }

