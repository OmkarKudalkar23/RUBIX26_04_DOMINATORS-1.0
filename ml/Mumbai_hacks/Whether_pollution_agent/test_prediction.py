"""
Test script for Healthcare Risk & Resource Prediction Agent
Tests the exact JSON structure output
"""
import json
from Whether_pollution_agent.workflow import run_prediction

def test_city_prediction(city_name: str):
    """Test prediction for a specific city"""
    print(f"\n{'='*60}")
    print(f"Testing: {city_name}")
    print(f"{'='*60}")
    
    result = run_prediction(city=city_name)
    
    # Validate structure
    required_fields = [
        "status", "city", "state", "aqi", "pm25",
        "expected_patients_next_24h", "surge_probability", "timestamp",
        "patient_dashboard", "doctor_dashboard", "hospital_dashboard",
        "recommended_actions"
    ]
    
    missing_fields = [field for field in required_fields if field not in result]
    if missing_fields:
        print(f"❌ Missing fields: {missing_fields}")
    else:
        print("✅ All required fields present")
    
    # Validate recommended_actions structure
    if "recommended_actions" in result:
        required_actions = [
            "oxygen_cylinder_increase_percent",
            "emergency_beds_to_open",
            "staff_alert_required",
            "mask_advisory"
        ]
        missing_actions = [a for a in required_actions if a not in result["recommended_actions"]]
        if missing_actions:
            print(f"❌ Missing recommended_actions fields: {missing_actions}")
        else:
            print("✅ All recommended_actions fields present")
    
    print("\nResult:")
    print(json.dumps(result, indent=2))
    return result

if __name__ == "__main__":
    # Test multiple cities
    cities = ["Delhi", "Mumbai", "Pune", "Jaipur", "Bengaluru", "Chennai", "Hyderabad", "Kolkata","Ahmedabad","Lucknow"]
    
    print("Healthcare Risk & Resource Prediction Agent - Test Suite")
    print("="*60)
    
    for city in cities:
        test_city_prediction(city)
    
    # Test with hospital inputs
    print(f"\n{'='*60}")
    print("Testing with Hospital Inputs (Delhi)")
    print(f"{'='*60}")
    result = run_prediction(
        city="Delhi",
        bed_usage=80.5,
        last_7day_patients=560
    )
    print(json.dumps(result, indent=2))
    
    print("\n" + "="*60)
    print("All tests completed!")
    print("="*60)

