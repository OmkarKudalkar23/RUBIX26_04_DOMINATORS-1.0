# Early Warning System for Disease Outbreaks

## Overview

This early warning system detects disease outbreaks before they become visible by analyzing multiple early signals, comparing them against seasonal baselines, and generating graded alerts.

## Core Logic

**ONE-LINE SUMMARY**: Detect early abnormal rise in symptoms/signals → compare with seasonal baseline → confirm using multiple data sources → forecast near-term growth → convert to hospital load → send graded alert.

## System Architecture

The system consists of 5 modular agents:

### Agent 1: Early Signal Collector (`early_signals.py`)
**Purpose**: Collects signals that change before outbreaks become visible

**Data Sources**:
- ER visits (fever, cough, rash)
- Lab test positivity rates
- Ambulance call volume
- Pharmacy OTC sales (antipyretics, cough syrup, antihistamines)
- Weather data (temperature, humidity, rainfall)
- Search/social trends (symptom-related searches)
- Mosquito index (for dengue warning)

**Usage**:
```python
from Whether_pollution_agent.early_signals import EarlySignalCollector

collector = EarlySignalCollector()
signals = collector.collect_all_signals("Mumbai")
```

### Agent 2: Anomaly Detector (`anomaly_detector.py`)
**Purpose**: Detects unusual increases by comparing current data vs seasonal baseline

**Logic**:
1. Calculate seasonal baseline (average of same week in last 3-5 years)
2. Calculate spike: `(Today - Baseline) / Baseline * 100`
3. If spike > threshold (default 40%) → anomaly detected
4. Require 2-3 consecutive days of anomalies to confirm (reduces false alarms)

**Usage**:
```python
from Whether_pollution_agent.anomaly_detector import AnomalyDetector

detector = AnomalyDetector(spike_threshold=0.4)  # 40% threshold
anomalies = detector.detect_anomalies(city, current_signals, historical_data)
```

### Agent 3: Forecaster (`forecaster.py`)
**Purpose**: Forecasts next 7-14 days based on recent trends

**Methods**:
- Linear regression for trend detection
- Forecasts future case counts
- Calculates trend direction (increasing/decreasing/stable)
- Provides confidence levels

**Usage**:
```python
from Whether_pollution_agent.forecaster import Forecaster

forecaster = Forecaster(forecast_days=7)
forecasts = forecaster.forecast_all_signals(city, recent_data)
```

### Agent 4: Hospital Load Calculator (`hospital_load.py`)
**Purpose**: Translates forecasted cases into hospital resource needs

**Calculations**:
- Hospitalization rate: 5% of cases (configurable by disease type)
- ICU rate: 1% of cases (configurable)
- Peak bed needs = Daily hospitalizations × Average stay days
- Peak ICU needs = Daily ICU needs × Average stay days

**Disease-specific rates**:
- Viral fever: 5% hospitalization, 1% ICU
- Dengue: 15% hospitalization, 3% ICU
- Respiratory: 10% hospitalization, 2% ICU

**Usage**:
```python
from Whether_pollution_agent.hospital_load import HospitalLoadCalculator

calculator = HospitalLoadCalculator()
load = calculator.calculate_load_from_forecast(forecast_results, "er_visits", "total")
```

### Agent 5: Alert Generator (`alert_generator.py`)
**Purpose**: Generates graded alerts based on multiple indicators

**Alert Levels**:

1. **INFO** - Slight rise
   - 1+ anomaly, 20%+ spike
   - Action: Increase monitoring

2. **WATCH** - Multiple indicators rising
   - 2+ anomalies, 40%+ spike, 20%+ forecast increase
   - Action: Alert staff, prepare capacity

3. **WARNING** - Significant rise
   - 2+ anomalies, 50%+ spike, 30%+ forecast increase, 2+ consecutive days
   - Action: Activate surge planning, notify departments

4. **CRITICAL** - Major surge starting
   - 3+ anomalies, 75%+ spike, 50%+ forecast increase, 2+ consecutive days
   - Action: Emergency protocols, coordinate with health department

**Usage**:
```python
from Whether_pollution_agent.alert_generator import AlertGenerator

generator = AlertGenerator()
alert = generator.generate_alert(city, anomaly_results, forecast_summary, hospital_load)
```

## Complete Workflow

### Using the Integrated Workflow

```python
from Whether_pollution_agent.early_warning_workflow import EarlyWarningWorkflow

# Initialize
workflow = EarlyWarningWorkflow()

# Run daily check
result = workflow.run_daily_check("Mumbai")

# Access results
alert = result["alert"]
print(f"Alert Level: {alert['alert_level']}")
print(f"Message: {alert['message']}")
print(f"Recommendations: {alert['recommendations']}")
```

### API Endpoints

#### POST `/early-warning`
Run complete early warning analysis

**Request**:
```json
{
  "city": "Mumbai",
  "date": "2024-01-15T00:00:00"  // Optional
}
```

**Response**:
```json
{
  "status": "success",
  "city": "Mumbai",
  "timestamp": "2024-01-15T12:00:00",
  "alert": {
    "alert_level": "WARNING",
    "message": "⚠️ WARNING: Significant rise detected...",
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
  "hospital_load": {
    "peak_beds_needed": 25,
    "peak_icu_beds_needed": 5,
    "daily_hospitalizations": 8.3
  }
}
```

#### GET `/early-warning/{city}`
Quick early warning check (uses current date)

## Example Scenarios

### Scenario 1: Normal Day
- ER visits: 40 (baseline: 40)
- Lab positivity: 15% (baseline: 15%)
- **Result**: NORMAL alert level

### Scenario 2: Early Warning
- ER visits: 75 (baseline: 40) → 87.5% increase
- Lab positivity: 25% (baseline: 15%) → 66.7% increase
- Ambulance calls: 45 (baseline: 25) → 80% increase
- Forecast: +25% in next 7 days
- **Result**: WARNING alert level

### Scenario 3: Critical Surge
- ER visits: 120 (baseline: 40) → 200% increase
- Lab positivity: 40% (baseline: 15%) → 166% increase
- Ambulance calls: 60 (baseline: 25) → 140% increase
- Pharmacy sales: +150%
- Forecast: +60% in next 7 days
- Consecutive days: 3
- **Result**: CRITICAL alert level
- **Hospital Load**: 50 beds, 10 ICU beds needed

## Configuration

### Adjusting Thresholds

```python
# Anomaly detector threshold (default 40%)
detector = AnomalyDetector(spike_threshold=0.5)  # 50% threshold

# Alert generator thresholds
# Edit THRESHOLDS in alert_generator.py
```

### Disease-specific Hospitalization Rates

```python
# Edit HOSPITALIZATION_RATES in hospital_load.py
HOSPITALIZATION_RATES = {
    "viral_fever": {
        "hospitalization_rate": 0.05,  # 5%
        "icu_rate": 0.01,  # 1%
        "avg_stay_days": 3
    },
    # ... add more diseases
}
```

## Testing

Run the test script:
```bash
cd Whether_pollution_agent
python test_early_warning.py
```

## Integration with Existing System

The early warning system can work alongside the existing pollution-based prediction system:

- **Pollution System**: Predicts based on AQI/PM2.5
- **Early Warning System**: Detects outbreaks from multiple early signals

Both systems can be used together for comprehensive healthcare risk assessment.

## Data Sources (Production)

In production, replace mock data with real connections:

1. **ER Visits**: Hospital information systems (HIS)
2. **Lab Tests**: Laboratory information systems (LIS)
3. **Ambulance Calls**: Emergency dispatch systems
4. **Pharmacy Sales**: Pharmacy chain APIs
5. **Search Trends**: Google Trends API, Twitter API
6. **Weather**: Already integrated (OpenWeatherMap)

## Future Enhancements

1. **Machine Learning**: Use LSTM/Prophet for better forecasting
2. **Real-time Data**: Connect to live data streams
3. **Multi-city Correlation**: Detect regional patterns
4. **Disease-specific Models**: Separate models for flu, dengue, etc.
5. **Public Health Integration**: Direct alerts to health departments

## Key Features

✅ **Multi-signal Detection**: Uses 7+ data sources  
✅ **Seasonal Baseline**: Accounts for normal seasonal patterns  
✅ **Anomaly Confirmation**: Requires consecutive days to reduce false alarms  
✅ **Multi-indicator Logic**: Never alerts on single indicator  
✅ **7-14 Day Forecasting**: Predicts near-term growth  
✅ **Hospital Load Translation**: Converts cases to resource needs  
✅ **Graded Alerts**: INFO → WATCH → WARNING → CRITICAL  
✅ **Modular Agents**: Each agent handles one responsibility  

## Summary

This system implements the complete early warning logic:

1. ✅ Collect early signals daily/real-time
2. ✅ Compare current vs seasonal baseline
3. ✅ Detect unusual increases (anomalies)
4. ✅ Use multiple indicators to confirm
5. ✅ Forecast next 7-14 days
6. ✅ Translate forecast to hospital load
7. ✅ Generate graded alerts
8. ✅ Modular agent architecture

**Result**: Early detection of disease outbreaks before they become visible, with actionable alerts and resource planning.

