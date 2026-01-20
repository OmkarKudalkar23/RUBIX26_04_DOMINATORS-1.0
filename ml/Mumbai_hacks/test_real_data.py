# Real Data Integration Test Script
# Tests the system with actual APIs - no mock data

import os
import sys
import requests
from datetime import datetime
import logging

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ep'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_mongodb_connection():
    """Test MongoDB connection"""
    try:
        from ep.hospital_database import HospitalDatabase
        db = HospitalDatabase()
        
        # Test connection
        stats = db.get_system_stats()
        logger.info(f"✅ MongoDB connected: {stats}")
        return True
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        return False

def test_real_weather_data():
    """Test real weather API data"""
    try:
        from Whether_pollution_agent.tools import fetch_weather_api
        
        weather = fetch_weather_api("Mumbai")
        logger.info(f"✅ Real weather data: {weather}")
        
        # Check if it's real data (not mock)
        if weather.get("temperature", 0) > 0 and weather.get("humidity", 0) > 0:
            return True
        else:
            logger.warning("Weather data appears to be default values")
            return False
    except Exception as e:
        logger.error(f"❌ Weather API failed: {e}")
        return False

def test_real_pollution_data():
    """Test real pollution API data"""
    try:
        from Whether_pollution_agent.tools import fetch_pollution_data
        
        pollution = fetch_pollution_data("Mumbai")
        logger.info(f"✅ Real pollution data: {pollution}")
        
        # Check if it's real data
        if pollution.get("aqi", 0) > 0:
            return True
        else:
            logger.warning("Pollution data appears to be default values")
            return False
    except Exception as e:
        logger.error(f"❌ Pollution API failed: {e}")
        return False

def test_real_google_trends():
    """Test real Google Trends data"""
    try:
        from ep.early_signals import EarlySignalCollector
        
        collector = EarlySignalCollector()
        trends = collector._fetch_google_trends("Mumbai", ["fever", "cough"])
        logger.info(f"✅ Real Google Trends: {trends}")
        
        # Check if we got real data
        if any(v > 0 for v in trends.values()):
            return True
        else:
            logger.warning("Google Trends returned zero values")
            return False
    except Exception as e:
        logger.error(f"❌ Google Trends failed: {e}")
        return False

def test_real_hospital_api():
    """Test real hospital API endpoints"""
    try:
        # Test if hospital API is running
        response = requests.get("http://localhost:8002/system/test-connection", timeout=5)
        
        if response.status_code == 200:
            logger.info("✅ Hospital API is running")
            return True
        else:
            logger.warning(f"Hospital API returned status {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Hospital API not accessible: {e}")
        return False

def test_early_warning_with_real_data():
    """Test early warning system with real data"""
    try:
        from ep.early_warning_workflow import EarlyWarningWorkflow
        
        workflow = EarlyWarningWorkflow()
        result = workflow.run_daily_check("Mumbai")
        
        logger.info(f"✅ Early warning result: {result.get('alert', {}).get('alert_level', 'Unknown')}")
        
        # Check if we got meaningful results
        if result.get("alert", {}).get("alert_level") in ["INFO", "WATCH", "WARNING", "CRITICAL"]:
            return True
        else:
            logger.warning("Early warning returned unexpected results")
            return False
    except Exception as e:
        logger.error(f"❌ Early warning failed: {e}")
        return False

def main():
    """Run all real data tests"""
    print("🔍 Testing Real Data Integration (No Mock Data)")
    print("=" * 60)
    
    tests = [
        ("MongoDB Connection", test_mongodb_connection),
        ("Real Weather Data", test_real_weather_data),
        ("Real Pollution Data", test_real_pollution_data),
        ("Real Google Trends", test_real_google_trends),
        ("Hospital API", test_real_hospital_api),
        ("Early Warning System", test_early_warning_with_real_data)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n🧪 Testing {test_name}...")
        try:
            results[test_name] = test_func()
        except Exception as e:
            logger.error(f"Test {test_name} crashed: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All real data systems working!")
    else:
        print("⚠️  Some systems need configuration")
        print("\n📋 Setup Required:")
        
        if not results.get("MongoDB Connection"):
            print("   • Install MongoDB (see MONGODB_WINDOWS_SETUP.md)")
        
        if not results.get("Real Weather Data"):
            print("   • Check OpenWeatherMap API key")
        
        if not results.get("Real Pollution Data"):
            print("   • Check OpenAQ API key")
        
        if not results.get("Hospital API"):
            print("   • Start hospital API: python ep/real_time_hospital_api.py")
        
        if not results.get("Real Google Trends"):
            print("   • Google Trends may have rate limits")
    
    print("\n🔗 Next Steps:")
    print("1. Configure API keys in .env file")
    print("2. Set up MongoDB database")
    print("3. Start the real-time APIs")
    print("4. Connect real hospital systems")

if __name__ == "__main__":
    main()
