"""
Script to train the patient prediction ML model
"""
import sys
from ml_model import PatientPredictor
from data_manager import DataManager
import pandas as pd

def main():
    print("🚀 Starting model training...")
    
    # Initialize components
    predictor = PatientPredictor()
    data_manager = DataManager()
    
    # Load historical data
    print("📊 Loading historical data...")
    df = data_manager.load_historical_data()
    
    if df is None or len(df) < 10:
        print("❌ Not enough data for training. Need at least 10 records with actual patient counts.")
        print("Please make some predictions and update them with actual patient counts first.")
        return
    
    print(f"✅ Loaded {len(df)} records for training")
    
    # Train the model
    print("🤖 Training the model...")
    success, metrics = predictor.train(df)
    
    if success:
        print("\n🎉 Model trained successfully!")
        print("\n📈 Training Metrics:")
        for metric, value in metrics.items():
            print(f"  - {metric}: {value:.2f}")
        
        # Save the model
        if predictor.save_model():
            print("\n💾 Model saved to disk")
        
        # Show feature importance
        importance = predictor.get_feature_importance()
        if importance:
            print("\n🔍 Feature Importance:")
            for feature, score in sorted(importance.items(), key=lambda x: x[1], reverse=True):
                print(f"  - {feature}: {score*100:.1f}%")
    else:
        print("\n❌ Training failed:", metrics)

if __name__ == "__main__":
    main()
