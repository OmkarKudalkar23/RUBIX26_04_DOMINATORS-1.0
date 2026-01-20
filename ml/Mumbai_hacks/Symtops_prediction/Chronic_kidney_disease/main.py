from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import numpy as np
import joblib
import logging
from typing import List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CKD Prediction API",
    description="Chronic Kidney Disease Prediction API using Machine Learning",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
import os
# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'ckd_model.pkl')

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

class PredictionRequest(BaseModel):
    """Request model for CKD prediction"""
    age: float = Field(..., gt=0, description="Age in years", example=48.0)
    bp: float = Field(..., gt=0, description="Blood Pressure in mm Hg (normal 70-120, range 50-180)", example=80.0)
    sg: float = Field(..., gt=0, description="Specific Gravity - kidney concentration ability (1.005-1.025)", example=1.020)
    al: float = Field(..., ge=0, description="Albumin level in urine (0-5 scale)", example=1.0)
    su: float = Field(..., ge=0, description="Sugar level in urine (0-5 scale)", example=0.0)
    rbc: str = Field(..., description="Red Blood Cells: 'normal' or 'abnormal'", example="normal")
    pc: str = Field(..., description="Pus Cell: 'normal' or 'abnormal'", example="normal")
    pcc: str = Field(..., description="Pus Cell Clumps: 'present' or 'notpresent'", example="notpresent")
    ba: str = Field(..., description="Bacteria: 'present' or 'notpresent'", example="notpresent")
    bgr: float = Field(..., gt=0, description="Blood Glucose Random in mg/dl (normal 70-140, range 70-490)", example=120.0)
    bu: float = Field(..., gt=0, description="Blood Urea in mg/dl (normal 7-20, range 1.5-391)", example=36.0)
    sc: float = Field(..., gt=0, description="Serum Creatinine in mg/dl (normal 0.6-1.2, range 0.4-15)", example=1.2)
    sod: float = Field(..., gt=0, description="Sodium in mEq/L (normal 135-145, range 4.5-163)", example=135.0)
    pot: float = Field(..., gt=0, description="Potassium in mEq/L (normal 3.5-5.0, range 2.5-47)", example=4.5)
    hemo: float = Field(..., gt=0, description="Hemoglobin in g/dl (normal 12-16, range 3.1-17.8)", example=12.5)
    pcv: float = Field(..., gt=0, description="Packed Cell Volume % (normal range 32-45)", example=44.0)
    wc: float = Field(..., gt=0, description="White Blood Cell Count in cells/cumm (normal 4000-11000)", example=7800.0)
    rc: float = Field(..., gt=0, description="Red Blood Cell Count in millions/cumm (normal 3.6-6)", example=4.5)
    htn: str = Field(..., description="Hypertension: 'yes' or 'no'", example="no")
    dm: str = Field(..., description="Diabetes Mellitus: 'yes' or 'no'", example="no")
    cad: str = Field(..., description="Coronary Artery Disease: 'yes' or 'no'", example="no")
    appet: str = Field(..., description="Appetite: 'good' or 'poor'", example="good")
    pe: str = Field(..., description="Pedal Edema (swelling): 'yes' or 'no'", example="no")
    ane: str = Field(..., description="Anemia: 'yes' or 'no'", example="no")

    @validator('rbc', 'pc')
    def validate_rbc_pc(cls, v):
        if v not in ['normal', 'abnormal']:
            raise ValueError('Must be "normal" or "abnormal"')
        return v

    @validator('pcc', 'ba')
    def validate_pcc_ba(cls, v):
        if v not in ['present', 'notpresent']:
            raise ValueError('Must be "present" or "notpresent"')
        return v

    @validator('htn', 'dm', 'cad', 'pe', 'ane')
    def validate_binary_str(cls, v):
        if v not in ['yes', 'no']:
            raise ValueError('Must be "yes" or "no"')
        return v

    @validator('appet')
    def validate_appetite(cls, v):
        if v not in ['good', 'poor']:
            raise ValueError('Must be "good" or "poor"')
        return v

    class Config:
        schema_extra = {
            "example": {
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
        }

class PredictionResponse(BaseModel):
    """Response model for CKD prediction"""
    prediction: str = Field(..., description="Prediction result: 'CKD' or 'Not CKD'")
    probability: Optional[float] = Field(None, description="Prediction probability (0-1)")
    risk_level: str = Field(..., description="Risk level: 'High', 'Moderate', or 'Low'")
    recommendations: List[str] = Field(..., description="List of recommendations")
    
    class Config:
        schema_extra = {
            "example": {
                "prediction": "Not CKD",
                "probability": 0.15,
                "risk_level": "Low",
                "recommendations": [
                    "Maintain a healthy diet low in sodium and processed foods",
                    "Stay hydrated with adequate water intake",
                    "Exercise regularly for 30 minutes most days of the week",
                    "Visit your doctor for regular check-ups",
                    "Monitor blood pressure and blood sugar levels"
                ]
            }
        }

def get_recommendations(prediction: str, risk_level: str) -> List[str]:
    """Generate recommendations based on prediction and risk level"""
    base_recommendations = [
        "Maintain a healthy diet low in sodium and processed foods",
        "Stay hydrated with adequate water intake",
        "Exercise regularly for 30 minutes most days of the week"
    ]
    
    if prediction == "CKD" or risk_level == "High":
        specific_recommendations = [
            "Consult a nephrologist immediately",
            "Follow prescribed medications strictly",
            "Monitor blood pressure and blood sugar levels daily",
            "Limit protein intake as per doctor's advice",
            "Avoid NSAIDs and other kidney-harming medications",
            "Regular blood tests to monitor kidney function"
        ]
    elif risk_level == "Moderate":
        specific_recommendations = [
            "Visit your doctor for regular check-ups every 3 months",
            "Monitor blood pressure and blood sugar levels weekly",
            "Reduce salt and protein intake moderately",
            "Stay well-hydrated but avoid excessive fluid intake"
        ]
    else:
        specific_recommendations = [
            "Visit your doctor for regular check-ups annually",
            "Monitor blood pressure and blood sugar levels periodically",
            "Maintain a balanced lifestyle"
        ]
    
    return base_recommendations + specific_recommendations

def calculate_risk_level(probability: float) -> str:
    """Calculate risk level based on probability"""
    if probability >= 0.7:
        return "High"
    elif probability >= 0.4:
        return "Moderate"
    else:
        return "Low"

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CKD Prediction API",
        "version": "1.0.0",
        "endpoints": {
            "predict": "/predict",
            "docs": "/docs",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_ckd(request: PredictionRequest):
    """Predict CKD based on input parameters"""
    
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not available. Please try again later."
        )
    
    try:
        # Convert categorical features to numerical values
        categorical_mapping = {
            'rbc': {'normal': 1, 'abnormal': 0},
            'pc': {'normal': 1, 'abnormal': 0},
            'pcc': {'present': 1, 'notpresent': 0},
            'ba': {'present': 1, 'notpresent': 0},
            'htn': {'yes': 1, 'no': 0},
            'dm': {'yes': 1, 'no': 0},
            'cad': {'yes': 1, 'no': 0},
            'appet': {'good': 1, 'poor': 0},
            'pe': {'yes': 1, 'no': 0},
            'ane': {'yes': 1, 'no': 0}
        }
        
        # Convert categorical features
        rbc_num = categorical_mapping['rbc'][request.rbc]
        pc_num = categorical_mapping['pc'][request.pc]
        pcc_num = categorical_mapping['pcc'][request.pcc]
        ba_num = categorical_mapping['ba'][request.ba]
        htn_num = categorical_mapping['htn'][request.htn]
        dm_num = categorical_mapping['dm'][request.dm]
        cad_num = categorical_mapping['cad'][request.cad]
        appet_num = categorical_mapping['appet'][request.appet]
        pe_num = categorical_mapping['pe'][request.pe]
        ane_num = categorical_mapping['ane'][request.ane]
        
        # Convert input to numpy array in the correct order (age, bp, sg, al, su, rbc, pc, pcc, ba, bgr, bu, sc, sod, pot, hemo, pcv, wc, rc, htn, dm, cad, appet, pe, ane)
        features = np.array([[
            request.age, request.bp, request.sg, request.al, request.su,
            rbc_num, pc_num, pcc_num, ba_num, request.bgr,
            request.bu, request.sc, request.sod, request.pot, request.hemo,
            request.pcv, request.wc, request.rc, htn_num, dm_num, cad_num,
            appet_num, pe_num, ane_num
        ]])
        
        # Make prediction
        prediction = model.predict(features)[0]
        
        # Get probability if the model supports it
        probability = None
        if hasattr(model, 'predict_proba'):
            probability = model.predict_proba(features)[0][1]
        elif hasattr(model, 'decision_function'):
            # For SVM-like models, convert decision function to probability-like score
            decision_score = model.decision_function(features)[0]
            probability = 1 / (1 + np.exp(-decision_score))
        else:
            # Default probability based on prediction
            probability = 0.8 if prediction == 1 else 0.2
        
        # Convert prediction to string
        prediction_str = "CKD" if prediction == 1 else "Not CKD"
        
        # Calculate risk level
        risk_level = calculate_risk_level(probability)
        
        # Get recommendations
        recommendations = get_recommendations(prediction_str, risk_level)
        
        return PredictionResponse(
            prediction=prediction_str,
            probability=round(probability, 3),
            risk_level=risk_level,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle validation errors"""
    raise HTTPException(
        status_code=422,
        detail=f"Validation error: {str(exc)}"
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {exc}")
    raise HTTPException(
        status_code=500,
        detail="Internal server error"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
