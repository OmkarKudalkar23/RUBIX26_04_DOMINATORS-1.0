# CKD Prediction API

A FastAPI backend for Chronic Kidney Disease (CKD) prediction using machine learning.

## Features

- FastAPI with Pydantic models for request validation
- ML model integration with probability calculation
- Risk level assessment (High/Moderate/Low)
- Personalized recommendations
- CORS enabled for frontend integration
- Comprehensive error handling
- Automatic API documentation

## Directory Structure

```
c:\Symtops_prediction\Chronic_kidney_disease\
├── main.py              # FastAPI application
├── ckd_model.pkl        # Trained ML model
├── kidney_disease.csv   # Dataset (for reference)
├── requirements.txt     # Python dependencies
├── README.md           # This file
└── field_documentation.py  # Detailed field info for frontend
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### POST /predict

Predict CKD based on medical parameters.

**Request Body Example:**
```json
{
  "age": 48.0,
  "bp": 80.0,
  "sg": 1.020,
  "al": 1.0,
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

**Successful Response Example:**
```json
{
  "prediction": "Not CKD",
  "probability": 0.15,
  "risk_level": "Low",
  "recommendations": [
    "Maintain a healthy diet low in sodium and processed foods",
    "Stay hydrated with adequate water intake",
    "Exercise regularly for 30 minutes most days of the week",
    "Visit your doctor for regular check-ups annually",
    "Monitor blood pressure and blood sugar levels periodically",
    "Maintain a balanced lifestyle"
  ]
}
```

### GET /health

Health check endpoint to verify API status and model availability.

### GET /docs

Interactive API documentation (Swagger UI).

## Field Descriptions

### Numerical Fields
- **age**: Age in years (> 0)
- **bp**: Blood Pressure in mm Hg (normal 70-120, range 50-180)
- **sg**: Specific Gravity - kidney concentration ability (1.005-1.025)
- **al**: Albumin level in urine (0-5 scale, 0=normal, 5=high)
- **su**: Sugar level in urine (0-5 scale, 0=normal, 5=high)
- **bgr**: Blood Glucose Random in mg/dl (normal 70-140, range 70-490)
- **bu**: Blood Urea in mg/dl (normal 7-20, range 1.5-391)
- **sc**: Serum Creatinine in mg/dl (normal 0.6-1.2, range 0.4-15)
- **sod**: Sodium in mEq/L (normal 135-145, range 4.5-163)
- **pot**: Potassium in mEq/L (normal 3.5-5.0, range 2.5-47)
- **hemo**: Hemoglobin in g/dl (normal 12-16, range 3.1-17.8)
- **pcv**: Packed Cell Volume % (normal range 32-45)
- **wc**: White Blood Cell Count in cells/cumm (normal 4000-11000)
- **rc**: Red Blood Cell Count in millions/cumm (normal 3.6-6)

### Categorical Fields
- **rbc**: Red Blood Cells ("normal" or "abnormal")
- **pc**: Pus Cell ("normal" or "abnormal")
- **pcc**: Pus Cell Clumps ("present" or "notpresent")
- **ba**: Bacteria ("present" or "notpresent")
- **htn**: Hypertension ("yes" or "no")
- **dm**: Diabetes Mellitus ("yes" or "no")
- **cad**: Coronary Artery Disease ("yes" or "no")
- **appet**: Appetite ("good" or "poor")
- **pe**: Pedal Edema (swelling) ("yes" or "no")
- **ane**: Anemia ("yes" or "no")

### Medical Context
- **Albumin**: Protein normally not found in urine; presence indicates kidney damage
- **Sugar**: Glucose in urine; may indicate diabetes or kidney issues
- **Specific Gravity**: Measures kidney's ability to concentrate urine
- **Serum Creatinine**: Waste product filtered by kidneys; elevated levels indicate poor kidney function
- **Blood Urea**: Another waste product; high levels suggest kidney problems
- **Pedal Edema**: Swelling in feet/legs; common symptom of kidney disease
- **Pus Cell/Bacteria**: Indicate urinary tract infections affecting kidneys

## Testing

### curl Test Command

```bash
curl -X POST "http://localhost:8000/predict" \
-H "Content-Type: application/json" \
-d '{
  "age": 48.0,
  "bp": 80.0,
  "sg": 1.020,
  "al": 1.0,
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

### Health Check

```bash
curl -X GET "http://localhost:8000/health"
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- **422**: Validation errors (invalid input values)
- **500**: Internal server errors
- **503**: Model not available

## Risk Levels

- **High**: Probability >= 0.7
- **Moderate**: Probability >= 0.4 and < 0.7
- **Low**: Probability < 0.4

## Enhanced Documentation

### Field Documentation File
The `field_documentation.py` file contains comprehensive field information for frontend development:

- **Detailed descriptions** with medical context
- **Tooltips** for user guidance
- **Valid ranges** and normal values
- **Streamlit configurations** for form inputs
- **Field types** for frontend development

### Usage Examples

```python
from field_documentation import get_field_info, get_streamlit_config

# Get field information
field_info = get_field_info('bp')
print(field_info['tooltip'])  # "Normal: 70-120 mm Hg. High blood pressure can damage kidneys."

# Get Streamlit configuration
config = get_streamlit_config('bp')
print(config)  # {'min_value': 50, 'max_value': 180, 'value': 80, 'step': 1}
```

### Frontend Integration
The documentation provides:
- **Labels and descriptions** for form fields
- **Placeholders** for input fields
- **Tooltips** for user education
- **Validation ranges** for input validation
- **Medical context** for better understanding

### Swagger Documentation
All field descriptions, ranges, and examples are automatically included in the Swagger UI at `/docs`, providing comprehensive API documentation for developers.
