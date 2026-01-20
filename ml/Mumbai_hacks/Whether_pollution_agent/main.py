from Whether_pollution_agent.workflow import run_prediction
import json

if __name__ == "__main__":
    # Example: Run prediction for different cities
    print("=" * 60)
    print("Healthcare Risk & Resource Prediction Agent")
    print("=" * 60)
    
    # Test with Mumbai
    print("\n1. Testing with Mumbai:")
    result_mumbai = run_prediction(city="Mumbai")
    print(json.dumps(result_mumbai, indent=2))
    
    # Test with Delhi
    print("\n2. Testing with Delhi:")
    result_delhi = run_prediction(city="Delhi")
    print(json.dumps(result_delhi, indent=2))
    
    # Test with hospital inputs
    print("\n3. Testing with hospital inputs (Bengaluru):")
    result_bangalore = run_prediction(
        city="Bengaluru",
        bed_usage=75.5,
        last_7day_patients=420
    )
    print(json.dumps(result_bangalore, indent=2))
    
    print("\n" + "=" * 60)
    print("All predictions completed!")
    print("=" * 60)
