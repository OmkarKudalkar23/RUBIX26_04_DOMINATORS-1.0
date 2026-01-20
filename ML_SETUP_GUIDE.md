# ML Models Integration Setup Guide

This guide explains how to set up and run the ML prediction models for the patient dashboard.

## Overview

The patient dashboard integrates 4 ML models for disease prediction:
1. **Diabetes Prediction** - Port 8000
2. **Chronic Kidney Disease (CKD) Prediction** - Port 8002
3. **Heart Disease Prediction** - Currently using enhanced clinical logic (can be replaced with ML model)
4. **Sepsis Prediction** - Currently using enhanced clinical logic (can be replaced with ML model)

## Prerequisites

- Python 3.8 or higher
- Node.js backend running on port 5000
- ML model files located in `omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/`

## Setup Instructions

### 1. Diabetes Model (Port 8000)

The diabetes model is located at: `omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Diabeties_prediction/main.py`

**To run:**
```bash
cd omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Diabeties_prediction
python main.py
```

The API will start on `http://localhost:8000/predict`

**Expected Input Format:**
```json
{
  "pregnancies": 6,
  "glucose": 148,
  "bloodpressure": 72,
  "skinthickness": 35,
  "insulin": 0,
  "BMI": 33.6,
  "diabetespedigree": 0.627,
  "age": 50
}
```

**Expected Output Format:**
```json
{
  "risk": "High",
  "probability": "75.5%",
  "status": "High risk of diabetes",
  "recommendations": ["...", "..."],
  "diet_guidelines": ["...", "..."]
}
```

### 2. Chronic Kidney Disease Model (Port 8002)

The CKD model is located at: `omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Chronic_kidney_disease/main.py`

**To run:**
```bash
cd omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Chronic_kidney_disease
python main.py
```

The API will start on `http://localhost:8002/predict`

**Expected Input Format:**
```json
{
  "age": 50,
  "bp": 80,
  "sg": 1.020,
  "al": 0.0,
  "su": 0.0,
  "rbc": "normal",
  "pc": "normal",
  "pcc": "notpresent",
  "ba": "notpresent",
  "bgr": 120.0,
  "bu": 36.0,
  "sc": 1.2,
  "sod": 135.0,
  "pot": 4.5,
  "hemo": 12.5,
  "pcv": 44.0,
  "wc": 7800.0,
  "rc": 4.5,
  "htn": "no",
  "dm": "no",
  "cad": "no",
  "appet": "good",
  "pe": "no",
  "ane": "no"
}
```

**Expected Output Format:**
```json
{
  "prediction": "CKD" or "Not CKD",
  "probability": 0.75,
  "risk_level": "High",
  "recommendations": ["...", "..."]
}
```

### 3. Heart Disease Prediction (Currently Enhanced Clinical Logic)

The heart disease prediction currently uses enhanced clinical logic based on:
- Age, sex, cholesterol, blood pressure
- Heart rate, ST depression, major vessels
- Chest pain type, exercise-induced angina
- Fasting blood sugar

**To replace with ML model:**
1. Create a FastAPI service similar to `diabetes_api.py`
2. Update the `ML_API_URLS.heart` in `backend/routes/patient.js`
3. Update the `callMLModel` function to call the new API

**Current Implementation:**
- Uses clinical scoring based on multiple risk factors
- Provides risk level (High/Moderate/Low)
- Returns probability percentage
- Includes detailed recommendations and diet guidelines

### 4. Sepsis Prediction (Currently Enhanced Clinical Logic)

The sepsis prediction currently uses enhanced clinical logic based on SIRS criteria:
- Temperature, Heart Rate, Respiratory Rate
- White Blood Cell Count
- Lactate, Mean Arterial Pressure, Oxygen Saturation
- Creatinine, Hematocrit, Age

**To replace with ML model:**
1. Create a FastAPI service similar to `diabetes_api.py`
2. Update the `ML_API_URLS.sepsis` in `backend/routes/patient.js`
3. Update the `callMLModel` function to call the new API

**Current Implementation:**
- Uses SIRS (Systemic Inflammatory Response Syndrome) criteria
- Provides risk level (High/Moderate/Low)
- Returns probability percentage
- Includes urgent care recommendations for high-risk cases

## Backend Configuration

The backend routes are configured in: `omkar/Mumbai_hacks/backend/routes/patient.js`

**ML API URLs Configuration:**
```javascript
const ML_API_URLS = {
  diabetes: 'http://localhost:8000',
  kidney: 'http://localhost:8002',
  heart: 'http://localhost:8001', // Not currently used
  sepsis: 'http://localhost:8003' // Not currently used
};
```

## Frontend Integration

The frontend prediction UI is in: `omkar/Mumbai_hacks/Mumbai_hacks/src/components/PatientDashboard.tsx`

**API Call:**
```typescript
const predictionResult = await createPrediction(patientId, {
  type: 'diabetes' | 'heart' | 'kidney' | 'sepsis',
  inputs: { ...predictionInputs }
});
```

## Testing

### Test Diabetes Prediction:
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pregnancies": 6,
    "glucose": 148,
    "bloodpressure": 72,
    "skinthickness": 35,
    "insulin": 0,
    "BMI": 33.6,
    "diabetespedigree": 0.627,
    "age": 50
  }'
```

### Test CKD Prediction:
```bash
curl -X POST http://localhost:8002/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 50,
    "bp": 80,
    "sg": 1.020,
    "al": 0.0,
    "su": 0.0,
    "rbc": "normal",
    "pc": "normal",
    "pcc": "notpresent",
    "ba": "notpresent",
    "bgr": 120.0,
    "bu": 36.0,
    "sc": 1.2,
    "sod": 135.0,
    "pot": 4.5,
    "hemo": 12.5,
    "pcv": 44.0,
    "wc": 7800.0,
    "rc": 4.5,
    "htn": "no",
    "dm": "no",
    "cad": "no",
    "appet": "good",
    "pe": "no",
    "ane": "no"
  }'
```

### Test Backend Prediction Endpoint:
```bash
curl -X POST http://localhost:5000/api/patient/DEMO_PATIENT_ID/predictions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "diabetes",
    "inputs": {
      "pregnancies": 6,
      "glucose": 148,
      "bloodPressure": 72,
      "skinThickness": 35,
      "insulin": 0,
      "bmi": 33.6,
      "diabetesPedigree": 0.627,
      "age": 50
    }
  }'
```

## Troubleshooting

### Issue: ML API not responding
- **Solution:** Ensure the Python ML API service is running on the correct port
- Check if the port is already in use: `netstat -ano | findstr :8000` (Windows) or `lsof -i :8000` (Mac/Linux)

### Issue: Prediction returns error
- **Solution:** Check backend logs for detailed error messages
- Verify input format matches expected ML model input
- Check CORS settings in ML API if calling from browser

### Issue: Frontend not showing predictions
- **Solution:** 
  - Check browser console for errors
  - Verify backend is running on port 5000
  - Check network tab to see API call status
  - Verify patient ID is correct

## Notes

- The diabetes and CKD models use actual ML models via FastAPI
- Heart disease and sepsis currently use enhanced clinical logic (can be replaced with ML models)
- All predictions are saved to the database in the `Prediction` collection
- Predictions are linked to patients via `patientId`
- The frontend displays predictions in the "Health Predictions" section

## Next Steps

1. **To add Heart Disease ML Model:**
   - Create `heart_disease_api.py` similar to `diabetes_api.py`
   - Update `ML_API_URLS.heart` in backend
   - Update `callMLModel` function for heart disease case

2. **To add Sepsis ML Model:**
   - Create `sepsis_api.py` similar to `diabetes_api.py`
   - Update `ML_API_URLS.sepsis` in backend
   - Update `callMLModel` function for sepsis case

3. **To improve predictions:**
   - Collect more training data
   - Retrain models with updated data
   - Update API endpoints with new model versions

