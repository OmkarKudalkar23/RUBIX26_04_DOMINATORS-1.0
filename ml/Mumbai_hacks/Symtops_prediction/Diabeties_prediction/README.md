# Diabetes Prediction API

A FastAPI-based machine learning service for predicting diabetes using patient health data.

## Features

- **FastAPI Framework**: High-performance async web framework
- **Pydantic Validation**: Automatic request/response validation
- **ML Model Integration**: Uses pre-trained diabetes prediction model
- **Error Handling**: Comprehensive exception handling
- **CORS Support**: Cross-origin resource sharing enabled
- **Auto Documentation**: Swagger/OpenAPI docs at `/docs`
- **Health Check**: Service health monitoring endpoint

## Project Structure

```
c:\Symtops_prediction\Diabeties_prediction\
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── diabetes_model.pkl   # Trained ML model
├── diabetes.csv         # Dataset (for reference)
└── README.md           # This file
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure `diabetes_model.pkl` is in the project directory

## Running the Application

### Development
```bash
python main.py
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### 1. Root Endpoint
- **URL**: `GET /`
- **Description**: Basic API information

### 2. Health Check
- **URL**: `GET /health`
- **Description**: Service health status

### 3. Prediction Endpoint
- **URL**: `POST /predict`
- **Description**: Predict diabetes based on input features
- **Request Body**:
```json
{
  "pregnancies": 2,
  "glucose": 120.0,
  "bloodpressure": 80.0,
  "skinthickness": 20.0,
  "insulin": 85.0,
  "BMI": 25.6,
  "diabetespedigree": 0.5,
  "age": 35
}
```

- **Response**:
```json
{
  "risk": "High",
  "probability": "82%",
  "status": "Likely diabetic",
  "recommendations": [
    "Consult an endocrinologist immediately",
    "Start lifestyle modification and medication review",
    "Recommended tests: HbA1c, Fasting Sugar, Lipid Profile, Kidney Function Test"
  ],
  "diet_guidelines": [
    "Avoid sugar & processed carbohydrates",
    "Increase fiber-rich foods: vegetables, beans, oats",
    "Walk 30-45 minutes daily",
    "Drink plenty of water, avoid alcohol"
  ],
  "timestamp": "2024-01-01T12:00:00.123456"
}
```

## Field Descriptions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| pregnancies | int | >= 0 | Number of pregnancies |
| glucose | float | > 0 | Plasma glucose concentration (mg/dL) |
| bloodpressure | float | > 0 | Diastolic blood pressure (mm Hg) |
| skinthickness | float | > 0 | Triceps skin fold thickness (mm) |
| insulin | float | > 0 | 2-Hour serum insulin (mu U/ml) |
| BMI | float | > 0 | Body mass index |
| diabetespedigree | float | > 0 | Diabetes pedigree function |
| age | int | > 0 | Age in years |

## Risk Levels

- **Low**: Probability < 0.45
  - Status: "Low risk of diabetes"
  - Recommendations: Continue healthy lifestyle, periodic monitoring
  
- **Moderate**: Probability 0.45 - 0.75
  - Status: "At risk of diabetes"
  - Recommendations: Weekly monitoring, HbA1c testing, lifestyle changes
  
- **High**: Probability >= 0.75
  - Status: "Likely diabetic"
  - Recommendations: Immediate medical consultation, comprehensive testing

## Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Error Handling

The API includes comprehensive error handling for:
- Validation errors (HTTP 422)
- Model loading errors (HTTP 503)
- Prediction failures (HTTP 500)
- General exceptions (HTTP 500)

## Sample Usage

### curl Request
```bash
curl -X POST "http://localhost:8000/predict" \
-H "Content-Type: application/json" \
-d '{
  "pregnancies": 2,
  "glucose": 120.0,
  "bloodpressure": 80.0,
  "skinthickness": 20.0,
  "insulin": 85.0,
  "BMI": 25.6,
  "diabetespedigree": 0.5,
  "age": 35
}'
```

### Python Client
```python
import requests

url = "http://localhost:8000/predict"
data = {
    "pregnancies": 2,
    "glucose": 120.0,
    "bloodpressure": 80.0,
    "skinthickness": 20.0,
    "insulin": 85.0,
    "BMI": 25.6,
    "diabetespedigree": 0.5,
    "age": 35
}

response = requests.post(url, json=data)

# Handle response
if response.status_code == 200:
    result = response.json()
    print(f"Risk Level: {result['risk']}")
    print(f"Probability: {result['probability']}")
    print(f"Status: {result['status']}")
    print("Recommendations:")
    for rec in result['recommendations']:
        print(f"  - {rec}")
    print("Diet Guidelines:")
    for diet in result['diet_guidelines']:
        print(f"  - {diet}")
else:
    print(f"Error: {response.status_code}")
    print(f"Details: {response.json()}")

# Output:
# Risk Level: Low
# Probability: 25%
# Status: Low risk of diabetes
# Recommendations:
#   - Continue healthy lifestyle
#   - Check diabetes every 6-12 months for monitoring
# Diet Guidelines:
#   - Balanced diet with fruits & vegetables
#   - Maintain regular exercise

## Environment Variables

Optional environment variables for production:
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `LOG_LEVEL`: Logging level (default: INFO)
