# ML Model Integration Setup Guide

This guide explains how to set up and run the ML prediction services for the patient dashboard.

## ML Models Available

1. **Diabetes Prediction** - `omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Diabeties_prediction/`
2. **Chronic Kidney Disease (CKD)** - `omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Chronic_kidney_disease/`
3. **Heart Disease** - Currently using fallback logic (can be replaced with actual ML model)
4. **Sepsis** - Currently using fallback logic (can be replaced with actual ML model)

## Setup Instructions

### 1. Install Python Dependencies

For each ML model, install the required dependencies:

#### Diabetes Model
```bash
cd omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Diabeties_prediction
pip install -r requirements.txt
```

#### CKD Model
```bash
cd omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Chronic_kidney_disease
pip install -r requirements.txt
```

### 2. Start ML Services

#### Start Diabetes ML Service (Port 8000)
```bash
cd omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Diabeties_prediction
python main.py
# Or: uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Start CKD ML Service (Port 8002)
```bash
cd omkar/Mumbai_hacks/ml/Mumbai_hacks/Symtops_prediction/Chronic_kidney_disease
python main.py
# Or: uvicorn main:app --host 0.0.0.0 --port 8002
```

### 3. Configure Backend

The backend is configured to call ML services at these URLs (can be changed via environment variables):

- Diabetes: `http://localhost:8000`
- Kidney: `http://localhost:8002`
- Heart: `http://localhost:8001` (if available)
- Sepsis: `http://localhost:8003` (if available)

You can override these in your `.env` file:
```
DIABETES_ML_URL=http://localhost:8000
KIDNEY_ML_URL=http://localhost:8002
HEART_ML_URL=http://localhost:8001
SEPSIS_ML_URL=http://localhost:8003
```

### 4. Test the Integration

1. Start the Node.js backend:
   ```bash
   cd omkar/Mumbai_hacks/backend
   npm start
   ```

2. Start the frontend:
   ```bash
   cd omkar/Mumbai_hacks/Mumbai_hacks
   npm run dev
   ```

3. Test predictions:
   - Log in as a patient
   - Go to "Health Predictions" section
   - Click on any prediction type (Heart, Diabetes, Kidney, Sepsis)
   - Fill in the required fields
   - Submit to get ML prediction

## How It Works

1. **User submits prediction form** → Frontend calls `createPrediction()` API
2. **Backend receives request** → Maps frontend inputs to ML model format
3. **Backend calls ML service** → Sends HTTP POST to Python FastAPI service
4. **ML model processes** → Returns prediction with risk level and recommendations
5. **Backend saves to database** → Stores prediction in MongoDB
6. **Frontend displays result** → Shows prediction in Health Predictions section

## Input Mapping

### Diabetes Model
Frontend → ML Model:
- `pregnancies` → `pregnancies`
- `glucose` → `glucose`
- `bloodPressure` → `bloodpressure`
- `skinThickness` → `skinthickness`
- `insulin` → `insulin`
- `bmi` → `BMI`
- `diabetesPedigree` → `diabetespedigree`
- `age` → `age`

### Kidney Model
Frontend → ML Model:
- `age` → `age`
- `bloodPressure` → `bp`
- `albumin` (Normal/Abnormal) → `al` (0.0/1.0)
- `sugar` (Normal/Abnormal) → `su` (0.0/1.0)
- `redBloodCells` (Normal/Abnormal) → `rbc` (normal/abnormal)
- `pusCells` (Normal/Abnormal) → `pc` (normal/abnormal)
- `creatinine` → `sc`
- `sodium` → `sod`
- `potassium` → `pot`
- `hemoglobin` → `hemo`
- `hypertension` (Yes/No) → `htn` (yes/no)
- `diabetesHistory` (Yes/No) → `dm` (yes/no)

### Heart Disease & Sepsis
Currently using fallback calculation logic. Can be replaced with actual ML models when available.

## Troubleshooting

### ML Service Not Responding
- Check if Python services are running
- Verify ports are not in use
- Check firewall settings
- Review ML service logs for errors

### Prediction Fails
- Check backend logs for API call errors
- Verify input format matches ML model expectations
- Ensure all required fields are provided

### Model Files Missing
- Ensure `.pkl` model files are in the correct directories
- Check file paths in ML service code

## Notes

- The backend will gracefully handle ML service failures
- If ML service is unavailable, prediction will return a 503 error
- Heart and Sepsis predictions use fallback logic until ML models are available
- All predictions are saved to MongoDB for history tracking

