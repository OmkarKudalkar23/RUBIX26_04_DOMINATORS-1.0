"""
Test script for Early Warning System
Demonstrates the complete early warning workflow
"""
from datetime import datetime, timedelta
from Whether_pollution_agent.early_warning_workflow import EarlyWarningWorkflow
import json

def test_early_warning_system():
    """Test the complete early warning system"""
    
    print("=" * 80)
    print("EARLY WARNING SYSTEM TEST")
    print("=" * 80)
    print()
    
    # Initialize workflow
    workflow = EarlyWarningWorkflow()
    
    # Test cities
    cities = ["Mumbai", "Delhi", "Bengaluru"]
    
    for city in cities:
        print(f"\n{'='*80}")
        print(f"Testing Early Warning System for: {city.upper()}")
        print(f"{'='*80}\n")
        
        # Run early warning
        result = workflow.run_daily_check(city)
        
        # Display alert
        alert = result.get("alert", {})
        alert_level = alert.get("alert_level", "NORMAL")
        message = alert.get("message", "")
        
        print(f"🚨 ALERT LEVEL: {alert_level}")
        print(f"📋 Message: {message}")
        print()
        
        # Display metrics
        metrics = alert.get("metrics", {})
        print("📊 Metrics:")
        print(f"   - Total Anomalies: {metrics.get('total_anomalies', 0)}")
        print(f"   - Max Spike: {metrics.get('max_spike_percentage', 0):.1f}%")
        print(f"   - Forecast Increase: {metrics.get('forecast_increase_percentage', 0):.1f}%")
        print(f"   - Consecutive Anomaly Days: {metrics.get('consecutive_anomaly_days', 0)}")
        print()
        
        # Display recommendations
        recommendations = alert.get("recommendations", [])
        if recommendations:
            print("💡 Recommendations:")
            for i, rec in enumerate(recommendations, 1):
                print(f"   {i}. {rec}")
            print()
        
        # Display hospital load if available
        hospital_load = result.get("hospital_load")
        if hospital_load and hospital_load.get("load_available"):
            print("🏥 Hospital Load Forecast:")
            print(f"   - Peak Beds Needed: {hospital_load.get('peak_beds_needed', 0):.0f}")
            print(f"   - Peak ICU Beds Needed: {hospital_load.get('peak_icu_beds_needed', 0):.0f}")
            print(f"   - Daily Hospitalizations: {hospital_load.get('daily_hospitalizations', 0):.1f}")
            print()
        
        # Display current signals summary
        current_signals = result.get("current_signals", {})
        if current_signals:
            print("📡 Current Signals (Sample):")
            er_visits = current_signals.get("er_visits", {})
            if er_visits:
                print(f"   - ER Visits (Total): {er_visits.get('total', 0):.1f}")
            
            lab_pos = current_signals.get("lab_positivity", {})
            if lab_pos:
                print(f"   - Lab Positivity (Viral): {lab_pos.get('viral_tests', 0):.1f}%")
            
            ambulance = current_signals.get("ambulance_calls", {})
            if ambulance:
                print(f"   - Ambulance Calls (Total): {ambulance.get('total', 0)}")
            print()
        
        print("-" * 80)
        print()

def test_anomaly_simulation():
    """Simulate an anomaly scenario"""
    print("\n" + "=" * 80)
    print("ANOMALY SIMULATION TEST")
    print("=" * 80)
    print()
    print("Simulating a scenario with elevated signals...")
    print()
    
    workflow = EarlyWarningWorkflow()
    
    # Manually inject some high values to simulate anomaly
    # (In production, this would come from real data sources)
    city = "Mumbai"
    
    # Collect signals multiple days to build history
    print(f"Building signal history for {city}...")
    for days_ago in range(7, 0, -1):
        date = datetime.now() - timedelta(days=days_ago)
        workflow.signal_collector.collect_all_signals(city, date)
    
    # Run early warning
    result = workflow.run_daily_check(city)
    
    alert = result.get("alert", {})
    print(f"Alert Level: {alert.get('alert_level', 'NORMAL')}")
    print(f"Message: {alert.get('message', '')}")
    print()

if __name__ == "__main__":
    # Run basic test
    test_early_warning_system()
    
    # Run anomaly simulation
    # test_anomaly_simulation()
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)

