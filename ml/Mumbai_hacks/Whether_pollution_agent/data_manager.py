"""
Data Manager for patient prediction historical data storage and retrieval
"""
import pandas as pd
import os
from datetime import datetime
from typing import Optional, Dict, Any, List
import numpy as np

CSV_FILE = "patient_data.csv"

class DataManager:
    """Manages historical patient prediction data storage and retrieval"""
    
    def __init__(self, csv_file: str = CSV_FILE):
        self.csv_file = csv_file
        self._ensure_csv_exists()
    
    def _ensure_csv_exists(self):
        """Create CSV file with headers if it doesn't exist"""
        if not os.path.exists(self.csv_file):
            columns = [
                "timestamp", "city", "aqi", "pm25", "temperature", "humidity", 
                "rainfall", "day_of_week", "is_holiday", "bed_usage", 
                "last_7day_patients", "predicted_patients", "actual_patients",
                "prediction_method", "surge_probability"
            ]
            df = pd.DataFrame(columns=columns)
            df.to_csv(self.csv_file, index=False)
    
    def save_prediction(
        self,
        city: str,
        aqi: float,
        pm25: float,
        temperature: float,
        humidity: float,
        rainfall: float,
        predicted_patients: int,
        surge_probability: float,
        day_of_week: Optional[int] = None,
        is_holiday: Optional[bool] = None,
        bed_usage: Optional[float] = None,
        last_7day_patients: Optional[int] = None,
        prediction_method: str = "rule_based",
        actual_patients: Optional[int] = None
    ):
        """Save a prediction record to CSV"""
        if day_of_week is None:
            day_of_week = datetime.now().weekday()  # 0=Monday, 6=Sunday
        
        record = {
            "timestamp": datetime.now().isoformat(),
            "city": city,
            "aqi": aqi,
            "pm25": pm25,
            "temperature": temperature,
            "humidity": humidity,
            "rainfall": rainfall,
            "day_of_week": day_of_week,
            "is_holiday": is_holiday if is_holiday is not None else False,
            "bed_usage": bed_usage if bed_usage is not None else None,
            "last_7day_patients": last_7day_patients if last_7day_patients is not None else None,
            "predicted_patients": predicted_patients,
            "actual_patients": actual_patients if actual_patients is not None else None,
            "prediction_method": prediction_method,
            "surge_probability": surge_probability
        }
        
        df = pd.DataFrame([record])
        df.to_csv(self.csv_file, mode="a", header=False, index=False)
    
    def update_actual_patients(
        self,
        timestamp: str,
        city: str,
        actual_patients: int
    ) -> bool:
        """Update a prediction record with actual patient count"""
        try:
            df = pd.read_csv(self.csv_file)
            
            # Find matching record (by timestamp and city)
            mask = (df["timestamp"] == timestamp) & (df["city"] == city)
            if not mask.any():
                return False
            
            df.loc[mask, "actual_patients"] = actual_patients
            df.to_csv(self.csv_file, index=False)
            return True
        except Exception as e:
            print(f"Error updating actual patients: {e}")
            return False
    
    def load_historical_data(
        self,
        min_records: int = 10,
        city: Optional[str] = None
    ) -> Optional[pd.DataFrame]:
        """Load historical data for training"""
        try:
            df = pd.read_csv(self.csv_file)
            
            if len(df) < min_records:
                return None
            
            # Filter by city if specified
            if city:
                df = df[df["city"] == city]
                if len(df) < min_records:
                    return None
            
            # Only return records with actual_patients (for training)
            df = df.dropna(subset=["actual_patients"])
            
            if len(df) < min_records:
                return None
            
            return df
        except Exception as e:
            print(f"Error loading historical data: {e}")
            return None
    
    def calculate_metrics(self, city: Optional[str] = None) -> Dict[str, float]:
        """Calculate MAE and RMSE for predictions"""
        try:
            df = pd.read_csv(self.csv_file)
            
            # Filter by city if specified
            if city:
                df = df[df["city"] == city]
            
            # Only use records with actual patients
            df = df.dropna(subset=["actual_patients", "predicted_patients"])
            
            if len(df) == 0:
                return {"mae": None, "rmse": None, "count": 0}
            
            actual = df["actual_patients"].values
            predicted = df["predicted_patients"].values
            
            # Calculate MAE (Mean Absolute Error)
            mae = np.mean(np.abs(actual - predicted))
            
            # Calculate RMSE (Root Mean Squared Error)
            rmse = np.sqrt(np.mean((actual - predicted) ** 2))
            
            return {
                "mae": float(mae),
                "rmse": float(rmse),
                "count": len(df)
            }
        except Exception as e:
            print(f"Error calculating metrics: {e}")
            return {"mae": None, "rmse": None, "count": 0}
    
    def get_feature_columns(self) -> List[str]:
        """Get list of feature columns for ML model"""
        return [
            "aqi", "pm25", "temperature", "humidity", "rainfall",
            "day_of_week", "is_holiday", "bed_usage", "last_7day_patients"
        ]
    
    def prepare_features(
        self,
        aqi: float,
        pm25: float,
        temperature: float,
        humidity: float,
        rainfall: float,
        day_of_week: int,
        is_holiday: bool,
        bed_usage: Optional[float] = None,
        last_7day_patients: Optional[int] = None
    ) -> np.ndarray:
        """Prepare feature array for ML model"""
        features = [
            aqi, pm25, temperature, humidity, rainfall,
            float(day_of_week), float(is_holiday),
            bed_usage if bed_usage is not None else 0.0,
            last_7day_patients if last_7day_patients is not None else 0.0
        ]
        return np.array(features).reshape(1, -1)

