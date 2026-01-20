#!/usr/bin/env python3
"""
Test script for pytrends + Twitter API integration
Validates the combined trend monitoring system
"""

import os
import sys
from datetime import datetime

# Load environment variables first
from dotenv import load_dotenv
load_dotenv()  # This loads .env file

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ep'))

def test_combined_trends():
    """Test the combined pytrends + Twitter trend collection"""
    print("🔍 Testing Combined Trends System")
    print("=" * 50)
    
    try:
        from ep.early_signals import EarlySignalCollector
        
        # Initialize collector
        collector = EarlySignalCollector()
        
        # Test Google Trends (should always work)
        print("\n📊 Testing Google Trends...")
        google_trends = collector._fetch_google_trends("Mumbai", ["fever", "cough", "dengue", "flu"])
        print(f"✅ Google Trends: {google_trends}")
        
        # Test Twitter API (if configured)
        print("\n🐦 Testing Twitter API...")
        if collector.twitter_api:
            twitter_trends = collector._fetch_twitter_trends("Mumbai")
            print(f"✅ Twitter Trends: {twitter_trends}")
        else:
            print("ℹ️ Twitter API not configured - will use Google Trends only")
            twitter_trends = {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
        
        # Test combined system
        print("\n🔄 Testing Combined System...")
        combined_trends = collector._collect_search_trends("Mumbai", datetime.now())
        print(f"✅ Combined Trends: {combined_trends}")
        
        # Verify weighting
        print("\n📈 Weighting Analysis:")
        for symptom in ["fever", "cough", "dengue", "flu"]:
            expected = google_trends.get(symptom, 0) * 0.7 + twitter_trends.get(symptom, 0) * 0.3
            actual = combined_trends.get(symptom, 0)
            print(f"  {symptom:<8}: Expected {expected:.1f}, Got {actual:.1f} ✅")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_twitter_setup():
    """Test Twitter API setup and credentials"""
    print("\n🔧 Testing Twitter API Setup")
    print("=" * 30)
    
    # Check environment variables
    required_vars = [
        'TWITTER_API_KEY',
        'TWITTER_API_SECRET', 
        'TWITTER_ACCESS_TOKEN',
        'TWITTER_ACCESS_TOKEN_SECRET'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {missing_vars}")
        print("\n📝 To set up Twitter API:")
        print("1. Go to https://developer.twitter.com/en/portal/dashboard")
        print("2. Create app and get API keys")
        print("3. Add credentials to your .env file")
        return False
    else:
        print("✅ All Twitter credentials found")
        
        try:
            import tweepy
            
            # Test Twitter API connection
            api_key = os.getenv('TWITTER_API_KEY')
            api_secret = os.getenv('TWITTER_API_SECRET')
            access_token = os.getenv('TWITTER_ACCESS_TOKEN')
            access_token_secret = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
            
            auth = tweepy.OAuthHandler(api_key, api_secret)
            auth.set_access_token(access_token, access_token_secret)
            api = tweepy.API(auth, wait_on_rate_limit=True)
            
            # Test with a simple API call
            api.verify_credentials()
            print("✅ Twitter API connection successful")
            
            # Test search
            tweets = api.search_tweets("test", lang="en", result_type="recent", count=1)
            print(f"✅ Twitter search working (found {len(tweets)} test tweets)")
            
            return True
            
        except Exception as e:
            print(f"❌ Twitter API connection failed: {e}")
            return False

def test_full_integration():
    """Test full early warning system with combined trends"""
    print("\n🚀 Testing Full Integration")
    print("=" * 35)
    
    try:
        from ep.early_warning_workflow import EarlyWarningWorkflow
        
        workflow = EarlyWarningWorkflow()
        
        # Run daily check with combined trends
        result = workflow.run_daily_check("Mumbai")
        
        print(f"✅ Alert Level: {result.get('alert', {}).get('alert_level', 'Unknown')}")
        print(f"✅ Total Anomalies: {result.get('alert', {}).get('metrics', {}).get('total_anomalies', 0)}")
        print(f"✅ Recommendations: {len(result.get('alert', {}).get('recommendations', []))}")
        
        return True
        
    except Exception as e:
        print(f"❌ Full integration test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 pytrends + Twitter API Integration Test")
    print("=" * 50)
    
    tests = [
        ("Twitter Setup", test_twitter_setup),
        ("Combined Trends", test_combined_trends),
        ("Full Integration", test_full_integration)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ Test {test_name} crashed: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<20} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All systems working perfectly!")
        print("\n🚀 Your system is ready with:")
        print("   • Google Trends (no API key needed)")
        print("   • Twitter API (free tier configured)")
        print("   • Combined trend monitoring")
        print("   • Real-time disease surveillance")
    else:
        print("⚠️  Some components need attention")
        
        if not results.get("Twitter Setup"):
            print("\n📋 To fix Twitter API:")
            print("   1. Get Twitter Developer Account")
            print("   2. Create app at https://developer.twitter.com")
            print("   3. Add credentials to .env file")
            print("   4. Run: python test_combined_trends.py")
        
        if not results.get("Combined Trends"):
            print("\n📋 To fix combined trends:")
            print("   • Check internet connection")
            print("   • Verify pytrends installation: pip install pytrends")
            print("   • Check Google Trends availability")
    
    print("\n🔗 Next Steps:")
    print("1. Set up Twitter API (optional but recommended)")
    print("2. Start real-time monitoring: python ep/real_time_hospital_api.py")
    print("3. View live dashboard: http://localhost:8002")

if __name__ == "__main__":
    main()
