"""
Machine Learning Model for Patient Prediction
"""
import os
import joblib
import numpy as np
from typing import Optional, Tuple
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import pandas as pd

MODEL_FILE = "patient_predictor_model.pkl"

class PatientPredictor:
    """Random Forest model for predicting patient counts"""
    
    def __init__(self, model_file: str = MODEL_FILE):
        self.model_file = model_file
        self.model: Optional[RandomForestRegressor] = None
        self.feature_columns = [
            "aqi", "pm25", "temperature", "humidity", "rainfall",
            "day_of_week", "is_holiday", "bed_usage", "last_7day_patients"
        ]
        self.is_trained = False
        self.training_metrics = {}
    
    def train(
        self,
        data: pd.DataFrame,
        test_size: float = 0.2,
        random_state: int = 42,
        n_estimators: int = 100,
        max_depth: Optional[int] = 10
    ) -> Tuple[bool, dict]:
        """
        Train the Random Forest model
        
        Args:
            data: DataFrame with features and 'actual_patients' column
            test_size: Proportion of data to use for testing
            random_state: Random seed for reproducibility
            n_estimators: Number of trees in the forest
            max_depth: Maximum depth of trees
        
        Returns:
            (success: bool, metrics: dict)
        """
        try:
            # Prepare features
            feature_cols = [col for col in self.feature_columns if col in data.columns]
            
            # Fill missing values
            X = data[feature_cols].copy()
            X = X.fillna(0)
            
            y = data["actual_patients"].values
            
            if len(X) < 10:
                return False, {"error": "Insufficient data for training (need at least 10 records)"}
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )
            
            # Train model
            self.model = RandomForestRegressor(
                n_estimators=n_estimators,
                max_depth=max_depth,
                random_state=random_state,
                n_jobs=-1
            )
            self.model.fit(X_train, y_train)
            
            # Evaluate
            train_pred = self.model.predict(X_train)
            test_pred = self.model.predict(X_test)
            
            train_mae = mean_absolute_error(y_train, train_pred)
            test_mae = mean_absolute_error(y_test, test_pred)
            train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
            test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
            
            self.is_trained = True
            self.training_metrics = {
                "train_mae": float(train_mae),
                "test_mae": float(test_mae),
                "train_rmse": float(train_rmse),
                "test_rmse": float(test_rmse),
                "train_samples": len(X_train),
                "test_samples": len(X_test)
            }
            
            return True, self.training_metrics
        except Exception as e:
            return False, {"error": str(e)}
    
    def predict(self, features: np.ndarray) -> Tuple[int, float]:
        """
        Predict patient count
        
        Args:
            features: Feature array of shape (1, n_features)
        
        Returns:
            (predicted_count: int, confidence_std: float)
        """
        if not self.is_trained or self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        prediction = self.model.predict(features)[0]
        
        # Get tree predictions for confidence estimation
        tree_predictions = np.array([tree.predict(features)[0] for tree in self.model.estimators_])
        confidence_std = float(np.std(tree_predictions))
        
        return int(max(0, round(prediction))), confidence_std
    
    def save_model(self) -> bool:
        """Save trained model to disk"""
        if not self.is_trained or self.model is None:
            return False
        
        try:
            model_data = {
                "model": self.model,
                "feature_columns": self.feature_columns,
                "training_metrics": self.training_metrics
            }
            joblib.dump(model_data, self.model_file)
            return True
        except Exception as e:
            print(f"Error saving model: {e}")
            return False
    
    def load_model(self) -> bool:
        """Load trained model from disk"""
        if not os.path.exists(self.model_file):
            return False
        
        try:
            model_data = joblib.load(self.model_file)
            self.model = model_data["model"]
            self.feature_columns = model_data.get("feature_columns", self.feature_columns)
            self.training_metrics = model_data.get("training_metrics", {})
            self.is_trained = True
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def get_feature_importance(self) -> Optional[dict]:
        """Get feature importance from trained model"""
        if not self.is_trained or self.model is None:
            return None
        
        importances = self.model.feature_importances_
        return dict(zip(self.feature_columns, importances.tolist()))

