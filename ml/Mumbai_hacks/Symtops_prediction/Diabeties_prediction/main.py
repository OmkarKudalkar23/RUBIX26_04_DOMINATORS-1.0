from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional
import joblib
import numpy as np
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Diabetes Prediction API",
    description="API for predicting diabetes using machine learning",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class PredictionRequest(BaseModel):
    """Request model for diabetes prediction"""
    pregnancies: int = Field(
        ..., 
        ge=0, 
        description="Number of pregnancies",
        example=2
    )
    glucose: float = Field(
        ..., 
        gt=0, 
        description="Plasma glucose concentration (mg/dL)",
        example=120.0
    )
    bloodpressure: float = Field(
        ..., 
        gt=0, 
        description="Diastolic blood pressure (mm Hg)",
        example=80.0
    )
    skinthickness: float = Field(
        ..., 
        gt=0, 
        description="Triceps skin fold thickness (mm)",
        example=20.0
    )
    insulin: float = Field(
        ..., 
        gt=0, 
        description="2-Hour serum insulin (mu U/ml)",
        example=85.0
    )
    BMI: float = Field(
        ..., 
        gt=0, 
        description="Body mass index (weight in kg/(height in m)^2)",
        example=25.6
    )
    diabetespedigree: float = Field(
        ..., 
        gt=0, 
        description="Diabetes pedigree function",
        example=0.5
    )
    age: int = Field(
        ..., 
        gt=0, 
        description="Age in years",
        example=35
    )

    class Config:
        schema_extra = {
            "example": {
                "pregnancies": 2,
                "glucose": 120.0,
                "bloodpressure": 80.0,
                "skinthickness": 20.0,
                "insulin": 85.0,
                "BMI": 25.6,
                "diabetespedigree": 0.5,
                "age": 35
            }
        }

    @validator('pregnancies', 'age')
    def validate_age_fields(cls, v):
        if v < 0:
            raise ValueError("Value must be non-negative")
        return v

    @validator('glucose', 'bloodpressure', 'skinthickness', 'insulin', 'BMI', 'diabetespedigree')
    def validate_positive_floats(cls, v):
        if v <= 0:
            raise ValueError("Value must be greater than 0")
        return v

class PredictionResponse(BaseModel):
    """Enhanced response model for diabetes prediction"""
    risk: str = Field(
        ..., 
        description="Risk level assessment",
        example="High"
    )
    probability: str = Field(
        ..., 
        description="Probability as percentage",
        example="82%"
    )
    status: str = Field(
        ..., 
        description="Diabetes status",
        example="Likely diabetic"
    )
    recommendations: list[str] = Field(
        ..., 
        description="Medical recommendations based on risk level",
        example=["Consult an endocrinologist", "Take HbA1c & kidney function test"]
    )
    diet_guidelines: list[str] = Field(
        ..., 
        description="Diet and lifestyle guidelines",
        example=["Avoid white rice, sugar, cold drinks", "Eat oats, vegetables"]
    )
    timestamp: str = Field(
        ..., 
        description="Prediction timestamp",
        example="2024-01-01T12:00:00"
    )

    class Config:
        schema_extra = {
            "example": {
                "risk": "High",
                "probability": "82%",
                "status": "Likely diabetic",
                "recommendations": [
                    "Consult an endocrinologist",
                    "Take HbA1c & kidney function test",
                    "Follow strict low-sugar diet and exercise"
                ],
                "diet_guidelines": [
                    "Avoid white rice, sugar, cold drinks, bakery foods",
                    "Eat oats, vegetables, sprouts, salads",
                    "45 min walking every day"
                ],
                "timestamp": "2024-01-01T12:00:00"
            }
        }

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: str = Field(..., description="Error timestamp")

# Global variables
model = None
import os
# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'diabetes_model.pkl')

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        logger.info(f"Model loaded successfully from {MODEL_PATH}")
    else:
        logger.error(f"Model file not found at {MODEL_PATH}")
        logger.error(f"Current working directory: {os.getcwd()}")
        logger.error(f"Files in directory: {os.listdir(BASE_DIR)}")
        model = None
except Exception as e:
    logger.error(f"Error loading model: {e}")
    logger.error(f"Model path attempted: {MODEL_PATH}")
    model = None

def get_enhanced_risk_assessment(probability: float) -> dict:
    """Get comprehensive risk assessment with recommendations and diet guidelines"""
    probability_percent = int(probability * 100)
    
    if probability >= 0.75:
        risk_level = "High"
        status = "Likely diabetic"
        recommendation = [
            "Consult an endocrinologist immediately",
            "Start lifestyle modification and medication review",
            "Recommended tests: HbA1c, Fasting Sugar, Lipid Profile, Kidney Function Test"
        ]
        diet = [
            "Avoid sugar & processed carbohydrates",
            "Increase fiber-rich foods: vegetables, beans, oats",
            "Walk 30-45 minutes daily",
            "Drink plenty of water, avoid alcohol"
        ]
    elif probability >= 0.45:
        risk_level = "Moderate"
        status = "At risk of diabetes"
        recommendation = [
            "Monitor blood glucose weekly",
            "Recommended tests: HbA1c test in 3 months",
            "Reduce calories & increase physical activity"
        ]
        diet = [
            "Low GI foods (brown rice, millets, whole wheat)",
            "Increase salads & lean protein",
            "Avoid fried & oily foods"
        ]
    else:
        risk_level = "Low"
        status = "Low risk of diabetes"
        recommendation = [
            "Continue healthy lifestyle",
            "Check diabetes every 6-12 months for monitoring"
        ]
        diet = [
            "Balanced diet with fruits & vegetables",
            "Maintain regular exercise"
        ]
    
    return {
        "risk": risk_level,
        "probability": f"{probability_percent}%",
        "status": status,
        "recommendations": recommendation,
        "diet_guidelines": diet
    }

# Exception Handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="Validation Error",
            detail=str(exc),
            timestamp=datetime.now().isoformat()
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error",
            detail="An unexpected error occurred",
            timestamp=datetime.now().isoformat()
        ).dict()
    )

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Diabetes Prediction API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_diabetes(request: PredictionRequest):
    """
    Predict diabetes based on input features
    
    - **pregnancies**: Number of pregnancies
    - **glucose**: Plasma glucose concentration (mg/dL)
    - **bloodpressure**: Diastolic blood pressure (mm Hg)
    - **skinthickness**: Triceps skin fold thickness (mm)
    - **insulin**: 2-Hour serum insulin (mu U/ml)
    - **BMI**: Body mass index
    - **diabetespedigree**: Diabetes pedigree function
    - **age**: Age in years
    
    Returns prediction, probability, and risk level
    """
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not available"
        )
    
    try:
        # Prepare input data
        features = np.array([[
            request.pregnancies,
            request.glucose,
            request.bloodpressure,
            request.skinthickness,
            request.insulin,
            request.BMI,
            request.diabetespedigree,
            request.age
        ]])
        
        # Make prediction
        prediction = model.predict(features)[0]
        
        # Get probability if model supports it
        if hasattr(model, 'predict_proba'):
            probability = model.predict_proba(features)[0][1]
        else:
            probability = float(prediction)
        
        # Get comprehensive risk assessment
        risk_assessment = get_enhanced_risk_assessment(probability)
        
        # Create enhanced response
        response = PredictionResponse(
            risk=risk_assessment["risk"],
            probability=risk_assessment["probability"],
            status=risk_assessment["status"],
            recommendations=risk_assessment["recommendations"],
            diet_guidelines=risk_assessment["diet_guidelines"],
            timestamp=datetime.now().isoformat()
        )
        
        logger.info(f"Prediction made: {risk_assessment['risk']} risk ({risk_assessment['probability']})")
        return response
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
