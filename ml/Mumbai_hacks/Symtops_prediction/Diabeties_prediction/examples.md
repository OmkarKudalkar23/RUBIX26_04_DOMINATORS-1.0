# API Usage Examples

## Sample curl Request

### Basic Prediction Request
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

### High Risk Example
```bash
curl -X POST "http://localhost:8000/predict" \
-H "Content-Type: application/json" \
-d '{
  "pregnancies": 6,
  "glucose": 180.0,
  "bloodpressure": 90.0,
  "skinthickness": 35.0,
  "insulin": 150.0,
  "BMI": 35.2,
  "diabetespedigree": 0.8,
  "age": 45
}'
```

## Example Responses

### Successful Prediction (Low Risk)
```json
{
  "prediction": 0,
  "probability": 0.25,
  "risk_level": "Low",
  "timestamp": "2024-01-01T12:00:00.123456"
}
```

### Successful Prediction (Medium Risk)
```json
{
  "prediction": 0,
  "probability": 0.55,
  "risk_level": "Medium",
  "timestamp": "2024-01-01T12:00:00.123456"
}
```

### Successful Prediction (High Risk)
```json
{
  "prediction": 1,
  "probability": 0.85,
  "risk_level": "High",
  "timestamp": "2024-01-01T12:00:00.123456"
}
```

### Validation Error Response
```json
{
  "error": "Validation Error",
  "detail": "Value must be greater than 0",
  "timestamp": "2024-01-01T12:00:00.123456"
}
```

### Model Not Available Error
```json
{
  "error": "Internal Server Error",
  "detail": "Model not available",
  "timestamp": "2024-01-01T12:00:00.123456"
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2024-01-01T12:00:00.123456"
}
```

### Root Endpoint Response
```json
{
  "message": "Diabetes Prediction API",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs"
}
```

## Python Client Examples

### Basic Usage
```python
import requests
import json

# API endpoint
url = "http://localhost:8000/predict"

# Request data
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

# Make request
response = requests.post(url, json=data)

# Handle response
if response.status_code == 200:
    result = response.json()
    print(f"Prediction: {result['prediction']}")
    print(f"Probability: {result['probability']:.3f}")
    print(f"Risk Level: {result['risk_level']}")
else:
    print(f"Error: {response.status_code}")
    print(f"Details: {response.json()}")

# Output:
# Prediction: 0
# Probability: 0.250
# Risk Level: Low
```

### Batch Predictions
```python
import requests

url = "http://localhost:8000/predict"

# Multiple test cases
test_cases = [
    {
        "pregnancies": 2,
        "glucose": 120.0,
        "bloodpressure": 80.0,
        "skinthickness": 20.0,
        "insulin": 85.0,
        "BMI": 25.6,
        "diabetespedigree": 0.5,
        "age": 35
    },
    {
        "pregnancies": 6,
        "glucose": 180.0,
        "bloodpressure": 90.0,
        "skinthickness": 35.0,
        "insulin": 150.0,
        "BMI": 35.2,
        "diabetespedigree": 0.8,
        "age": 45
    }
]

for i, data in enumerate(test_cases, 1):
    response = requests.post(url, json=data)
    if response.status_code == 200:
        result = response.json()
        print(f"Test Case {i}: {result['risk_level']} risk ({result['probability']:.3f})")
    else:
        print(f"Test Case {i}: Error - {response.json()}")

# Output:
# Test Case 1: Low risk (0.250)
# Test Case 2: High risk (0.850)
```

### Error Handling
```python
import requests

url = "http://localhost:8000/predict"

# Invalid data (negative glucose)
data = {
    "pregnancies": 2,
    "glucose": -50.0,  # Invalid!
    "bloodpressure": 80.0,
    "skinthickness": 20.0,
    "insulin": 85.0,
    "BMI": 25.6,
    "diabetespedigree": 0.5,
    "age": 35
}

response = requests.post(url, json=data)

if response.status_code == 422:
    error = response.json()
    print(f"Validation Error: {error['detail']}")
elif response.status_code == 500:
    error = response.json()
    print(f"Server Error: {error['error']}")
else:
    print(f"Unexpected status: {response.status_code}")

# Output:
# Validation Error: Value must be greater than 0
```

## JavaScript Client Example

### Using Fetch API
```javascript
const url = 'http://localhost:8000/predict';

const data = {
    pregnancies: 2,
    glucose: 120.0,
    bloodpressure: 80.0,
    skinthickness: 20.0,
    insulin: 85.0,
    BMI: 25.6,
    diabetespedigree: 0.5,
    age: 35
};

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
})
.then(response => response.json())
.then(result => {
    console.log('Prediction:', result.prediction);
    console.log('Probability:', result.probability);
    console.log('Risk Level:', result.risk_level);
})
.catch(error => console.error('Error:', error));
```

## Testing with Postman

1. **Method**: POST
2. **URL**: `http://localhost:8000/predict`
3. **Headers**: 
   - Content-Type: application/json
4. **Body** (raw JSON):
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

## Load Testing Example

### Using Apache Bench
```bash
# Install Apache Bench if needed
# Test with 100 concurrent requests, total 1000 requests
ab -n 1000 -c 100 -H "Content-Type: application/json" -p test_data.json http://localhost:8000/predict
```

### Test Data File (test_data.json)
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
