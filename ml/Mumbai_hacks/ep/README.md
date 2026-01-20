# Early Warning System Agents

This folder contains the complete early warning system for disease outbreak detection.

## Structure

```
ep/
├── __init__.py                    # Package initialization
├── early_signals.py               # Agent 1: Signal Collection
├── seasonal_baseline.py           # Baseline Calculation Module
├── anomaly_detector.py            # Agent 2: Anomaly Detection
├── forecaster.py                  # Agent 3: Forecasting
├── hospital_load.py               # Agent 4: Hospital Load Calculation
├── alert_generator.py             # Agent 5: Alert Generation
└── early_warning_workflow.py      # Integrated Workflow
```

## Agents

### Agent 1: Early Signal Collector (`early_signals.py`)
Collects signals from multiple data sources:
- ER visits (fever, cough, rash)
- Lab test positivity rates
- Ambulance call volume
- Pharmacy OTC sales
- Weather data
- Search/social trends
- Mosquito index

### Agent 2: Anomaly Detector (`anomaly_detector.py`)
- Compares current data vs seasonal baseline
- Detects spikes: `(Today - Baseline) / Baseline * 100`
- Requires consecutive days to confirm anomalies

### Agent 3: Forecaster (`forecaster.py`)
- Forecasts next 7-14 days using linear regression
- Calculates trend direction and change percentage

### Agent 4: Hospital Load Calculator (`hospital_load.py`)
- Translates forecasted cases to hospital needs
- Disease-specific rates (viral fever, dengue, respiratory)
- Calculates peak beds and ICU requirements

### Agent 5: Alert Generator (`alert_generator.py`)
- Generates graded alerts: INFO, WATCH, WARNING, CRITICAL
- Multi-indicator confirmation logic
- Actionable recommendations

## Usage

```python
from ep.early_warning_workflow import EarlyWarningWorkflow

# Initialize workflow
workflow = EarlyWarningWorkflow()

# Run daily check
result = workflow.run_daily_check("Mumbai")

# Access results
alert = result["alert"]
print(f"Alert Level: {alert['alert_level']}")
print(f"Message: {alert['message']}")
print(f"Recommendations: {alert['recommendations']}")
```

## Dependencies

The agents import from the parent `Whether_pollution_agent` package:
- `Whether_pollution_agent.tools` - Weather and pollution data
- `Whether_pollution_agent.city_data` - City information

## Complete Workflow

1. **Collect Signals** → Gather all early signals
2. **Calculate Baseline** → Determine seasonal baseline
3. **Detect Anomalies** → Compare current vs baseline
4. **Forecast** → Predict next 7-14 days
5. **Calculate Hospital Load** → Convert cases to resource needs
6. **Generate Alert** → Create graded alert with recommendations

## Alert Levels

- **INFO**: 1+ anomaly, 20%+ spike
- **WATCH**: 2+ anomalies, 40%+ spike, 20%+ forecast increase
- **WARNING**: 2+ anomalies, 50%+ spike, 30%+ forecast increase, 2+ consecutive days
- **CRITICAL**: 3+ anomalies, 75%+ spike, 50%+ forecast increase, 2+ consecutive days

## Status

✅ All agents implemented and tested
✅ Integrated workflow functional
✅ Ready for production use (replace mock data with real sources)

