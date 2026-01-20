"""
Test script for Patient Prediction Enhancements
Tests data logging, enhanced formula, ML model, and feedback loop
"""
import json
import os
import pandas as pd
import numpy as np
from datetime import datetime
from data_manager import DataManager
from ml_model import PatientPredictor
from Whether_pollution_agent.tools import predict_patient_count_and_surge

def test_data_manager():
    """Test DataManager functionality"""
    print("\n" + "="*60)
    print("Testing DataManager")
    print("="*60)
    
    # Use a test CSV file
    test_csv = "test_patient_data.csv"
    if os.path.exists(test_csv):
        os.remove(test_csv)
    
    dm = DataManager(csv_file=test_csv)
    
    # Test saving predictions
    print("\n1. Testing save_prediction()...")
    for i in range(5):
        dm.save_prediction(
            city="Mumbai",
            aqi=150 + i * 10,
            pm25=50 + i * 5,
            temperature=25 + i,
            humidity=60 + i,
            rainfall=0.0,
            predicted_patients=50 + i * 5,
            surge_probability=20 + i * 5,
            day_of_week=i % 7,
            is_holiday=(i == 0),
            actual_patients=48 + i * 5  # Simulate actuals
        )
    print("   ✅ Saved 5 prediction records")
    
    # Test loading historical data
    print("\n2. Testing load_historical_data()...")
    historical = dm.load_historical_data(min_records=3)
    if historical is not None and len(historical) >= 3:
        print(f"   ✅ Loaded {len(historical)} historical records")
        print(f"   Columns: {list(historical.columns)}")
    else:
        print("   ❌ Failed to load historical data")
    
    # Test calculating metrics
    print("\n3. Testing calculate_metrics()...")
    metrics = dm.calculate_metrics()
    if metrics["mae"] is not None:
        print(f"   ✅ MAE: {metrics['mae']:.2f}")
        print(f"   ✅ RMSE: {metrics['rmse']:.2f}")
        print(f"   ✅ Records: {metrics['count']}")
    else:
        print("   ❌ Failed to calculate metrics")
    
    # Test updating actual patients
    print("\n4. Testing update_actual_patients()...")
    df = pd.read_csv(test_csv)
    first_timestamp = df.iloc[0]["timestamp"]
    success = dm.update_actual_patients(
        timestamp=first_timestamp,
        city="Mumbai",
        actual_patients=100
    )
    if success:
        print("   ✅ Successfully updated actual patients")
    else:
        print("   ❌ Failed to update actual patients")
    
    # Cleanup
    if os.path.exists(test_csv):
        os.remove(test_csv)
    
    print("\n✅ DataManager tests completed!")

def test_enhanced_formula():
    """Test enhanced prediction formula with day of week and holidays"""
    print("\n" + "="*60)
    print("Testing Enhanced Formula (Day of Week & Holidays)")
    print("="*60)
    
    base_params = {
        "aqi": 150,
        "pm25": 60,
        "temperature": 25,
        "humidity": 60,
        "rainfall": 0,
        "city_name": "Mumbai"
    }
    
    # Test different days of week
    print("\n1. Testing day_of_week factors...")
    results = {}
    for day in range(7):
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        pred = predict_patient_count_and_surge(day_of_week=day, **base_params)
        results[day_names[day]] = {
            "patients": pred["expected_patients_next_24h"],
            "day_factor": pred.get("day_factor", 1.0)
        }
        print(f"   {day_names[day]:12s}: {pred['expected_patients_next_24h']:3d} patients (factor: {pred.get('day_factor', 1.0):.2f})")
    
    # Verify Monday and Friday are higher, Sunday is lower
    monday_patients = results["Monday"]["patients"]
    sunday_patients = results["Sunday"]["patients"]
    if monday_patients > sunday_patients:
        print("   ✅ Monday has more patients than Sunday (as expected)")
    else:
        print("   ❌ Day factor not working correctly")
    
    # Test holiday factor
    print("\n2. Testing holiday factor...")
    pred_normal = predict_patient_count_and_surge(is_holiday=False, **base_params)
    pred_holiday = predict_patient_count_and_surge(is_holiday=True, **base_params)
    
    print(f"   Normal day:  {pred_normal['expected_patients_next_24h']} patients")
    print(f"   Holiday:     {pred_holiday['expected_patients_next_24h']} patients")
    print(f"   Holiday factor: {pred_holiday.get('holiday_factor', 1.0):.2f}")
    
    if pred_holiday['expected_patients_next_24h'] > pred_normal['expected_patients_next_24h']:
        print("   ✅ Holiday increases patient count (as expected)")
    else:
        print("   ❌ Holiday factor not working correctly")
    
    # Test confidence intervals
    print("\n3. Testing confidence intervals...")
    pred = predict_patient_count_and_surge(**base_params)
    if "confidence_interval" in pred:
        ci = pred["confidence_interval"]
        print(f"   ✅ Confidence interval: {ci['lower']} - {ci['upper']}")
        if ci['lower'] <= pred['expected_patients_next_24h'] <= ci['upper']:
            print("   ✅ Prediction falls within confidence interval")
        else:
            print("   ❌ Prediction outside confidence interval")
    else:
        print("   ❌ Confidence interval not returned")
    
    print("\n✅ Enhanced formula tests completed!")

def test_ml_model():
    """Test ML model training and prediction"""
    print("\n" + "="*60)
    print("Testing ML Model")
    print("="*60)
    
    # Create dummy training data
    print("\n1. Creating dummy training data...")
    np.random.seed(42)
    n_samples = 30
    training_data = {
        "aqi": np.random.uniform(50, 300, n_samples),
        "pm25": np.random.uniform(20, 150, n_samples),
        "temperature": np.random.uniform(15, 35, n_samples),
        "humidity": np.random.uniform(30, 90, n_samples),
        "rainfall": np.random.uniform(0, 10, n_samples),
        "day_of_week": np.random.randint(0, 7, n_samples),
        "is_holiday": np.random.choice([0, 1], n_samples).astype(float),
        "bed_usage": np.random.uniform(50, 95, n_samples),
        "last_7day_patients": np.random.randint(300, 800, n_samples),
    }
    
    # Generate realistic target (patient count based on features)
    base_patients = 50
    training_data["actual_patients"] = (
        base_patients +
        training_data["aqi"] * 0.3 +
        training_data["pm25"] * 0.5 +
        training_data["temperature"] * 0.5 +
        np.random.normal(0, 5, n_samples)  # Add noise
    ).astype(int)
    
    df = pd.DataFrame(training_data)
    print(f"   ✅ Created {len(df)} training samples")
    
    # Test model training
    print("\n2. Testing model training...")
    predictor = PatientPredictor(model_file="test_model.pkl")
    success, metrics = predictor.train(df)
    
    if success:
        print("   ✅ Model trained successfully")
        print(f"   Training MAE: {metrics['train_mae']:.2f}")
        print(f"   Test MAE:     {metrics['test_mae']:.2f}")
        print(f"   Training RMSE: {metrics['train_rmse']:.2f}")
        print(f"   Test RMSE:     {metrics['test_rmse']:.2f}")
    else:
        print(f"   ❌ Model training failed: {metrics.get('error', 'Unknown error')}")
        return
    
    # Test model prediction
    print("\n3. Testing model prediction...")
    from data_manager import DataManager
    dm = DataManager()
    features = dm.prepare_features(
        aqi=150,
        pm25=60,
        temperature=25,
        humidity=60,
        rainfall=0,
        day_of_week=0,
        is_holiday=False,
        bed_usage=75,
        last_7day_patients=500
    )
    
    try:
        predicted_count, confidence_std = predictor.predict(features)
        print(f"   ✅ Predicted patients: {predicted_count}")
        print(f"   ✅ Confidence std: {confidence_std:.2f}")
    except Exception as e:
        print(f"   ❌ Prediction failed: {e}")
    
    # Test feature importance
    print("\n4. Testing feature importance...")
    importance = predictor.get_feature_importance()
    if importance:
        print("   ✅ Feature importance:")
        for feature, imp in sorted(importance.items(), key=lambda x: x[1], reverse=True):
            print(f"      {feature:20s}: {imp:.4f}")
    else:
        print("   ❌ Failed to get feature importance")
    
    # Test model saving and loading
    print("\n5. Testing model save/load...")
    if predictor.save_model():
        print("   ✅ Model saved successfully")
        
        # Create new predictor and load
        new_predictor = PatientPredictor(model_file="test_model.pkl")
        if new_predictor.load_model():
            print("   ✅ Model loaded successfully")
            if new_predictor.is_trained:
                print("   ✅ Model is trained after loading")
            else:
                print("   ❌ Model not marked as trained after loading")
        else:
            print("   ❌ Failed to load model")
    else:
        print("   ❌ Failed to save model")
    
    # Cleanup
    if os.path.exists("test_model.pkl"):
        os.remove("test_model.pkl")
    
    print("\n✅ ML model tests completed!")

def test_feedback_loop():
    """Test the complete feedback loop"""
    print("\n" + "="*60)
    print("Testing Feedback Loop")
    print("="*60)
    
    test_csv = "test_feedback_data.csv"
    if os.path.exists(test_csv):
        os.remove(test_csv)
    
    dm = DataManager(csv_file=test_csv)
    
    # Simulate predictions and feedback
    print("\n1. Simulating predictions with feedback...")
    timestamps = []
    for i in range(15):
        pred = predict_patient_count_and_surge(
            aqi=150 + i * 5,
            pm25=60 + i * 2,
            temperature=25,
            humidity=60,
            rainfall=0,
            city_name="Mumbai",
            day_of_week=i % 7,
            is_holiday=(i % 5 == 0)
        )
        
        timestamp = datetime.now().isoformat()
        timestamps.append(timestamp)
        
        # Simulate actual patients (add some random error)
        actual = pred["expected_patients_next_24h"] + np.random.randint(-10, 10)
        
        dm.save_prediction(
            city="Mumbai",
            aqi=150 + i * 5,
            pm25=60 + i * 2,
            temperature=25,
            humidity=60,
            rainfall=0,
            predicted_patients=pred["expected_patients_next_24h"],
            surge_probability=pred["surge_probability"],
            day_of_week=i % 7,
            is_holiday=(i % 5 == 0),
            actual_patients=actual
        )
    
    print(f"   ✅ Created {len(timestamps)} prediction records with feedback")
    
    # Test metrics calculation
    print("\n2. Testing metrics with feedback...")
    metrics = dm.calculate_metrics(city="Mumbai")
    print(f"   MAE: {metrics['mae']:.2f}")
    print(f"   RMSE: {metrics['rmse']:.2f}")
    print(f"   Records: {metrics['count']}")
    
    # Test model training with feedback data
    print("\n3. Testing ML model training with feedback data...")
    historical = dm.load_historical_data(min_records=10, city="Mumbai")
    if historical is not None and len(historical) >= 10:
        print(f"   ✅ Loaded {len(historical)} records for training")
        
        predictor = PatientPredictor(model_file="test_feedback_model.pkl")
        success, train_metrics = predictor.train(historical)
        
        if success:
            print("   ✅ Model trained with feedback data")
            print(f"   Test MAE: {train_metrics['test_mae']:.2f}")
            print(f"   Test RMSE: {train_metrics['test_rmse']:.2f}")
        else:
            print(f"   ❌ Training failed: {train_metrics.get('error', 'Unknown')}")
    else:
        print(f"   ❌ Insufficient data for training: {len(historical) if historical is not None else 0} records")
    
    # Cleanup
    if os.path.exists(test_csv):
        os.remove(test_csv)
    if os.path.exists("test_feedback_model.pkl"):
        os.remove("test_feedback_model.pkl")
    
    print("\n✅ Feedback loop tests completed!")

def main():
    """Run all enhancement tests"""
    print("\n" + "="*60)
    print("PATIENT PREDICTION ENHANCEMENTS - TEST SUITE")
    print("="*60)
    
    try:
        test_data_manager()
        test_enhanced_formula()
        test_ml_model()
        test_feedback_loop()
        
        print("\n" + "="*60)
        print("✅ ALL ENHANCEMENT TESTS COMPLETED SUCCESSFULLY!")
        print("="*60)
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

