# Early Warning System - FastAPI Server

## Overview

FastAPI server providing REST API endpoints for the early warning system.

## Running the Server

```bash
# From the ep directory
python server.py

# Or using uvicorn directly
uvicorn ep.server:app --host 0.0.0.0 --port 8001 --reload
```

The server will start on `http://localhost:8001`

## API Endpoints

### 1. Root & Health

#### `GET /`
Get API information and available endpoints

**Response:**
```json
{
  "message": "Early Warning System API",
  "version": "1.0.0",
  "endpoints": {...}
}
```

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "Early Warning System",
  "timestamp": "2024-01-15T12:00:00"
}
```

### 2. Cities

#### `GET /cities`
Get list of supported cities

**Response:**
```json
{
  "cities": [
    {"name": "Mumbai", "state": "Maharashtra"},
    {"name": "Delhi", "state": "Delhi"},
    ...
  ],
  "count": 20
}
```

### 3. Early Warning

#### `POST /early-warning`
Complete early warning analysis

**Request:**
```json
{
  "city": "Mumbai",
  "date": "2024-01-15T00:00:00"  // Optional
}
```

**Response:**
```json
{
  "status": "success",
  "city": "Mumbai",
  "timestamp": "2024-01-15T12:00:00",
  "alert": {
    "alert_level": "WARNING",
    "message": "...",
    "recommendations": [...],
    "metrics": {
      "total_anomalies": 3,
      "max_spike_percentage": 65.2,
      "forecast_increase_percentage": 35.5,
      "consecutive_anomaly_days": 2
    }
  },
  "current_signals": {...},
  "anomaly_detection": {...},
  "forecasts": {...},
  "hospital_load": {...}
}
```

#### `GET /early-warning/{city}`
Quick early warning check

**Query Parameters:**
- `date` (optional): ISO format date

**Example:**
```
GET /early-warning/Mumbai?date=2024-01-15T00:00:00
```

**Response:**
```json
{
  "status": "success",
  "city": "Mumbai",
  "alert_level": "WARNING",
  "message": "...",
  "total_anomalies": 3,
  "max_spike_percentage": 65.2,
  "forecast_increase_percentage": 35.5,
  "recommendations": [...]
}
```

### 4. Signals

#### `GET /signals/{city}`
Get current early signals

**Query Parameters:**
- `date` (optional): ISO format date

**Response:**
```json
{
  "status": "success",
  "city": "Mumbai",
  "signals": {
    "er_visits": {
      "fever": 16.0,
      "cough": 14.0,
      "rash": 10.0,
      "total": 40.0
    },
    "lab_positivity": {...},
    "ambulance_calls": {...},
    "pharmacy_otc_sales": {...},
    "weather": {...},
    "search_trends": {...},
    "mosquito_index": {...}
  }
}
```

### 5. Forecast

#### `GET /forecast/{city}`
Get forecast data

**Query Parameters:**
- `days` (optional): Number of days to forecast (default: 7, max: 14)

**Example:**
```
GET /forecast/Mumbai?days=14
```

**Response:**
```json
{
  "status": "success",
  "city": "Mumbai",
  "forecast_days": 7,
  "forecast_summary": {
    "overall_trend": "increasing",
    "max_increase_percentage": 25.5,
    "signals_increasing": [...]
  },
  "forecasts": {...}
}
```

### 6. Hospital Load

#### `GET /hospital-load/{city}`
Get hospital load forecast

**Query Parameters:**
- `disease_type` (optional): viral_fever, dengue, respiratory, general (default: general)

**Example:**
```
GET /hospital-load/Mumbai?disease_type=dengue
```

**Response:**
```json
{
  "status": "success",
  "city": "Mumbai",
  "disease_type": "dengue",
  "hospital_load": {
    "peak_beds_needed": 25,
    "peak_icu_beds_needed": 5,
    "daily_hospitalizations": 8.3,
    "daily_icu_needs": 1.7,
    "forecasted_7day_cases": 583.3,
    "total_7day_hospitalizations": 87.5,
    "total_7day_icu": 17.5
  }
}
```

### 7. Anomalies

#### `GET /anomalies/{city}`
Get anomaly detection results

**Response:**
```json
{
  "status": "success",
  "city": "Mumbai",
  "anomaly_detection": {
    "total_anomalies": 3,
    "consecutive_anomaly_days": 2,
    "anomaly_confirmed": true,
    "anomalies": {...},
    "anomaly_summary": {...}
  }
}
```

## Example Usage

### Using curl

```bash
# Quick check
curl http://localhost:8001/early-warning/Mumbai

# Full analysis
curl -X POST http://localhost:8001/early-warning \
  -H "Content-Type: application/json" \
  -d '{"city": "Mumbai"}'

# Get signals
curl http://localhost:8001/signals/Mumbai

# Get forecast
curl http://localhost:8001/forecast/Mumbai?days=14

# Get hospital load
curl http://localhost:8001/hospital-load/Mumbai?disease_type=dengue
```

### Using Python

```python
import requests

# Quick check
response = requests.get("http://localhost:8001/early-warning/Mumbai")
data = response.json()
print(f"Alert Level: {data['alert_level']}")
print(f"Message: {data['message']}")

# Full analysis
response = requests.post(
    "http://localhost:8001/early-warning",
    json={"city": "Mumbai"}
)
data = response.json()
print(f"Alert: {data['alert']['alert_level']}")
print(f"Recommendations: {data['alert']['recommendations']}")
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## Port Configuration

Default port is **8001** to avoid conflicts with other services.

To change the port, modify the `uvicorn.run()` call in `server.py`:

```python
uvicorn.run("server:app", host="0.0.0.0", port=8002, reload=True)
```

