"""
Script to bootstrap the ML model with sample data and train it
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from data_manager import DataManager
from ml_model import PatientPredictor
import random

def generate_sample_data(num_samples=100):
    """Generate sample training data"""
    print(f"Generating {num_samples} sample records...")
    
    cities = ['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai']
    data = []
    
    for i in range(num_samples):
        # Generate random but realistic values
        city = random.choice(cities)
        aqi = random.uniform(50, 300)
        pm25 = aqi * random.uniform(0.4, 0.7)  # Rough conversion
        temperature = random.uniform(15, 40)
        humidity = random.uniform(30, 90)
        rainfall = random.uniform(0, 20)
        
        # Generate date in the past 90 days
        date = datetime.now() - timedelta(days=random.randint(0, 90))
        day_of_week = date.weekday()
        is_holiday = random.random() < 0.1  # 10% chance of being a holiday
        
        # Generate related values
        bed_usage = random.uniform(30, 95)
        last_7day_patients = random.randint(50, 300)
        
        # Generate actual patients based on factors (with some noise)
        base_patients = 50
        aqi_factor = 1 + (aqi - 100) / 200  # 0.75 to 2.0
        temp_factor = 1.2 if temperature < 10 or temperature > 35 else 1.0
        humidity_factor = 1.1 if humidity > 80 or humidity < 30 else 1.0
        
        # Add some noise
        noise = random.uniform(0.8, 1.2)
        actual_patients = int(base_patients * aqi_factor * temp_factor * humidity_factor * noise)
        
        data.append({
            'timestamp': date.isoformat(),
            'city': city,
            'aqi': aqi,
            'pm25': pm25,
            'temperature': temperature,
            'humidity': humidity,
            'rainfall': rainfall,
            'day_of_week': day_of_week,
            'is_holiday': is_holiday,
            'bed_usage': bed_usage,
            'last_7day_patients': last_7day_patients,
            'predicted_patients': actual_patients + random.randint(-10, 10),  # Add some prediction error
            'actual_patients': actual_patients,
            'prediction_method': 'rule_based',
            'surge_probability': random.uniform(10, 80)
        })
    
    return pd.DataFrame(data)

def main():
    print("🚀 Bootstrapping ML model with sample data...")
    
    # Initialize components
    data_manager = DataManager()
    
    # Generate sample data
    print("📊 Generating sample training data...")
    df = generate_sample_data(200)
    
    # Save to CSV (this will append to existing data)
    print("💾 Saving sample data to CSV...")
    df.to_csv('patient_data.csv', mode='a', header=False, index=False)
    
    # Now train the model
    print("\n🤖 Training the model...")
    predictor = PatientPredictor()
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
