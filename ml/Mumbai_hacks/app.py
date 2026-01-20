from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import pandas as pd
import pickle
import numpy as np
from typing import Optional, Union
import os

app = FastAPI(title="Heart Disease Prediction API", version="1.0.0")

# Pydantic model for input validation
class HeartDiseaseInput(BaseModel):
    age: int = Field(..., ge=1, le=120, description="Age in years")
    sex: str = Field(..., pattern="^(Male|Female)$", description="Sex: Male or Female")
    cp: str = Field(..., description="Chest pain type")
    trestbps: Optional[float] = Field(None, ge=70, le=250, description="Resting blood pressure (mm Hg)")
    chol: Optional[float] = Field(None, ge=50, le=600, description="Serum cholesterol (mg/dl)")
    fbs: Optional[bool] = Field(None, description="Fasting blood sugar > 120 mg/dl")
    restecg: Optional[str] = Field(None, description="Resting electrocardiographic results")
    thalch: Optional[float] = Field(None, ge=40, le=250, description="Maximum heart rate achieved")
    exang: Optional[bool] = Field(None, description="Exercise induced angina")
    oldpeak: Optional[float] = Field(None, ge=-10, le=20, description="ST depression induced by exercise")
    slope: Optional[str] = Field(None, description="Slope of the peak exercise ST segment")
    ca: Optional[float] = Field(None, ge=0, le=4, description="Number of major vessels colored by fluoroscopy")
    thal: Optional[str] = Field(None, description="Thallium stress test result")
    dataset: str = Field("Cleveland", description="Dataset source (default: Cleveland)")

class PredictionResponse(BaseModel):
    prediction: int
    prediction_label: str
    probability: float

# Global variables for model components
model = None
preprocessor = None
all_feature_names = None
categorical_features = None

def load_model_components():
    """Load all model components from pickle files"""
    global model, preprocessor, all_feature_names, categorical_features
    
    try:
        # Load the trained model with compatibility handling
        try:
            with open('model.pkl', 'rb') as f:
                model = pickle.load(f)
        except (pickle.PickleError, AttributeError) as e:
            print(f"Error loading model with standard pickle: {e}")
            # Try alternative loading method
            import joblib
            model = joblib.load('model.pkl')
        
        # Load the preprocessor
        try:
            with open('preprocessor.pkl', 'rb') as f:
                preprocessor = pickle.load(f)
        except (pickle.PickleError, AttributeError) as e:
            print(f"Error loading preprocessor with standard pickle: {e}")
            import joblib
            preprocessor = joblib.load('preprocessor.pkl')
        
        # Load feature names
        try:
            with open('all_feature_names_final.pkl', 'rb') as f:
                all_feature_names = pickle.load(f)
        except FileNotFoundError:
            print("Warning: all_feature_names_final.pkl not found, will generate from preprocessor")
            all_feature_names = None
        
        # Load categorical features or define them manually
        try:
            with open('categorical_features_for_preprocessor.pkl', 'rb') as f:
                categorical_features = pickle.load(f)
        except FileNotFoundError:
            print("Warning: categorical_features_for_preprocessor.pkl not found, using default categorical features")
            # Define categorical features based on the dataset
            categorical_features = ['sex', 'cp', 'fbs', 'restecg', 'exang', 'slope', 'thal', 'dataset']
            
        print("Model components loaded successfully")
        
    except Exception as e:
        print(f"Error loading model components: {e}")
        raise

def predict_heart_disease(input_data: HeartDiseaseInput) -> tuple[int, float]:
    """Make prediction using the loaded model"""
    global model, preprocessor, all_feature_names, categorical_features
    
    if model is None or preprocessor is None:
        load_model_components()
    
    # Convert input to DataFrame
    data_dict = input_data.dict()
    df = pd.DataFrame([data_dict])
    
    # Ensure categorical features are properly typed
    for feature in categorical_features:
        if feature in df.columns:
            df[feature] = df[feature].astype('object')
    
    try:
        # Preprocess the data
        X_processed = preprocessor.transform(df)
        
        # Generate feature names if not available
        if all_feature_names is None:
            if hasattr(preprocessor, 'get_feature_names_out'):
                all_feature_names = preprocessor.get_feature_names_out()
            else:
                # Fallback: create generic feature names
                n_features = X_processed.shape[1]
                all_feature_names = [f'feature_{i}' for i in range(n_features)]
        
        # Ensure the processed data has the correct feature names
        if hasattr(X_processed, 'toarray'):
            X_processed = X_processed.toarray()
        
        X_processed_df = pd.DataFrame(X_processed, columns=all_feature_names)
        
        # Make prediction
        prediction = model.predict(X_processed_df)[0]
        
        # Get probability for the positive class
        if hasattr(model, 'predict_proba'):
            probability = model.predict_proba(X_processed_df)[0, 1]
        else:
            # For models without predict_proba, use decision function or default
            if hasattr(model, 'decision_function'):
                decision = model.decision_function(X_processed_df)[0]
                probability = 1 / (1 + np.exp(-decision))  # Convert to probability
            else:
                probability = 0.5  # Default probability
        
        return int(prediction), float(probability)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Load model components on startup"""
    try:
        load_model_components()
    except Exception as e:
        print(f"Failed to load model components on startup: {e}")

@app.get("/")
async def root():
    return {"message": "Heart Disease Prediction API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionResponse)
async def predict(input_data: HeartDiseaseInput):
    """
    Predict heart disease based on input features
    
    - **age**: Age in years (1-120)
    - **sex**: Sex (Male/Female)
    - **cp**: Chest pain type
    - **trestbps**: Resting blood pressure in mm Hg (70-250)
    - **chol**: Serum cholesterol in mg/dl (50-600)
    - **fbs**: Fasting blood sugar > 120 mg/dl (True/False)
    - **restecg**: Resting electrocardiographic results
    - **thalch**: Maximum heart rate achieved (40-250)
    - **exang**: Exercise induced angina (True/False)
    - **oldpeak**: ST depression induced by exercise (-10 to 20)
    - **slope**: Slope of the peak exercise ST segment
    - **ca**: Number of major vessels colored by fluoroscopy (0-4)
    - **thal**: Thallium stress test result
    - **dataset**: Dataset source (default: Cleveland)
    """
    try:
        prediction, probability = predict_heart_disease(input_data)
        
        # Convert prediction to label
        prediction_label = "No Heart Disease" if prediction == 0 else "Heart Disease"
        
        return PredictionResponse(
            prediction=prediction,
            prediction_label=prediction_label,
            probability=probability
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/features")
async def get_features():
    """Get information about expected features"""
    return {
        "features": {
            "age": "Age in years (1-120)",
            "sex": "Sex (Male/Female)",
            "cp": "Chest pain type",
            "trestbps": "Resting blood pressure in mm Hg (70-250)",
            "chol": "Serum cholesterol in mg/dl (50-600)",
            "fbs": "Fasting blood sugar > 120 mg/dl (True/False)",
            "restecg": "Resting electrocardiographic results",
            "thalch": "Maximum heart rate achieved (40-250)",
            "exang": "Exercise induced angina (True/False)",
            "oldpeak": "ST depression induced by exercise (-10 to 20)",
            "slope": "Slope of the peak exercise ST segment",
            "ca": "Number of major vessels colored by fluoroscopy (0-4)",
            "thal": "Thallium stress test result",
            "dataset": "Dataset source (default: Cleveland)"
        },
        "required_fields": ["age", "sex", "cp"],
        "optional_fields": ["trestbps", "chol", "fbs", "restecg", "thalch", "exang", "oldpeak", "slope", "ca", "thal", "dataset"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
