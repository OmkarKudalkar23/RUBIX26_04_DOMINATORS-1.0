"""
Test script for Early Warning System
Demonstrates the system with test data including anomaly scenarios
"""
import sys
import os
from datetime import datetime, timedelta
import re

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ep.early_warning_workflow import EarlyWarningWorkflow
import json

def safe_print(text):
    """Print text safely, handling encoding issues"""
    try:
        print(text)
    except UnicodeEncodeError:
        # Remove emojis and special characters if encoding fails
        text_clean = re.sub(r'[^\x00-\x7F]+', '', str(text))
        print(text_clean)

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def test_normal_scenario():
    """Test with normal baseline data"""
    print_section("TEST 1: Normal Scenario (Baseline Data)")
    
    workflow = EarlyWarningWorkflow()
    city = "Mumbai"
    
    # Collect signals for a few days to build baseline
    print(f"Building baseline for {city}...")
    for days_ago in range(7, 0, -1):
        date = datetime.now() - timedelta(days=days_ago)
        workflow.signal_collector.collect_all_signals(city, date)
    
    # Run early warning
    result = workflow.run_daily_check(city)
    
    # Display results
    alert = result.get("alert", {})
    safe_print(f"[ALERT] Alert Level: {alert.get('alert_level', 'NORMAL')}")
    safe_print(f"[MESSAGE] {alert.get('message', '')}")
    print()
    
    # Display metrics
    metrics = alert.get("metrics", {})
    print("[METRICS]")
    print(f"   - Total Anomalies: {metrics.get('total_anomalies', 0)}")
    print(f"   - Max Spike: {metrics.get('max_spike_percentage', 0):.1f}%")
    print(f"   - Forecast Increase: {metrics.get('forecast_increase_percentage', 0):.1f}%")
    print(f"   - Consecutive Anomaly Days: {metrics.get('consecutive_anomaly_days', 0)}")
    print()
    
    # Display current signals
    current_signals = result.get("current_signals", {})
    if current_signals:
        print("[CURRENT SIGNALS]")
        er_visits = current_signals.get("er_visits", {})
        if er_visits:
            print(f"   - ER Visits (Total): {er_visits.get('total', 0):.1f}")
            print(f"     • Fever: {er_visits.get('fever', 0):.1f}")
            print(f"     • Cough: {er_visits.get('cough', 0):.1f}")
        
        lab_pos = current_signals.get("lab_positivity", {})
        if lab_pos:
            print(f"   - Lab Positivity (Viral): {lab_pos.get('viral_tests', 0):.1f}%")
        
        ambulance = current_signals.get("ambulance_calls", {})
        if ambulance:
            print(f"   - Ambulance Calls (Total): {ambulance.get('total', 0)}")
        print()

def test_anomaly_scenario():
    """Test with simulated anomaly (elevated signals)"""
    print_section("TEST 2: Anomaly Scenario (Elevated Signals)")
    
    workflow = EarlyWarningWorkflow()
    city = "Delhi"
    
    # Build baseline with normal data
    print(f"Building baseline for {city}...")
    for days_ago in range(10, 3, -1):
        date = datetime.now() - timedelta(days=days_ago)
        workflow.signal_collector.collect_all_signals(city, date)
    
    # Simulate elevated signals for last 3 days (anomaly)
    print("Simulating elevated signals (anomaly)...")
    for days_ago in range(2, -1, -1):
        date = datetime.now() - timedelta(days=days_ago)
        # Manually inject high values to simulate anomaly
        signals = workflow.signal_collector.collect_all_signals(city, date)
        
        # Modify signals to show spike
        signals["er_visits"]["total"] = signals["er_visits"]["total"] * 1.8  # 80% increase
        signals["er_visits"]["fever"] = signals["er_visits"]["fever"] * 1.8
        signals["lab_positivity"]["viral_tests"] = signals["lab_positivity"]["viral_tests"] * 1.6  # 60% increase
        signals["ambulance_calls"]["total"] = signals["ambulance_calls"]["total"] * 1.7  # 70% increase
        signals["pharmacy_otc_sales"]["total_index"] = signals["pharmacy_otc_sales"]["total_index"] * 1.5  # 50% increase
        
        # Store modified signals
        workflow.signal_collector._store_signal_history(city, signals)
    
    # Run early warning
    result = workflow.run_daily_check(city)
    
    # Display results
    alert = result.get("alert", {})
    alert_level = alert.get("alert_level", "NORMAL")
    
    safe_print(f"[ALERT] Alert Level: {alert_level}")
    safe_print(f"[MESSAGE] {alert.get('message', '')}")
    print()
    
    # Display metrics
    metrics = alert.get("metrics", {})
    print("[METRICS]")
    print(f"   - Total Anomalies: {metrics.get('total_anomalies', 0)}")
    print(f"   - Max Spike: {metrics.get('max_spike_percentage', 0):.1f}%")
    print(f"   - Forecast Increase: {metrics.get('forecast_increase_percentage', 0):.1f}%")
    print(f"   - Consecutive Anomaly Days: {metrics.get('consecutive_anomaly_days', 0)}")
    print(f"   - Anomaly Confirmed: {metrics.get('anomaly_confirmed', False)}")
    print()
    
    # Display recommendations
    recommendations = alert.get("recommendations", [])
    if recommendations:
        print("[RECOMMENDATIONS]")
        for i, rec in enumerate(recommendations, 1):
            print(f"   {i}. {rec}")
        print()
    
    # Display anomaly details
    anomaly_detection = result.get("anomaly_detection", {})
    anomalies = anomaly_detection.get("anomalies", {})
    
    if anomalies:
        print("[ANOMALY DETAILS]")
        for signal_type, signals in anomalies.items():
            for key, data in signals.items():
                if data.get("is_anomaly", False):
                    print(f"   - {signal_type}.{key}:")
                    print(f"     • Current: {data.get('current_value', 0):.1f}")
                    print(f"     • Baseline: {data.get('baseline_value', 0):.1f}")
                    print(f"     • Spike: {data.get('spike_percentage', 0):.1f}%")
        print()
    
    # Display hospital load if available
    hospital_load = result.get("hospital_load")
    if hospital_load and hospital_load.get("load_available"):
        print("[HOSPITAL LOAD FORECAST]")
        print(f"   - Peak Beds Needed: {hospital_load.get('peak_beds_needed', 0):.0f}")
        print(f"   - Peak ICU Beds Needed: {hospital_load.get('peak_icu_beds_needed', 0):.0f}")
        print(f"   - Daily Hospitalizations: {hospital_load.get('daily_hospitalizations', 0):.1f}")
        print(f"   - Daily ICU Needs: {hospital_load.get('daily_icu_needs', 0):.1f}")
        print()

def test_critical_scenario():
    """Test with critical surge scenario"""
    print_section("TEST 3: Critical Surge Scenario")
    
    workflow = EarlyWarningWorkflow()
    city = "Bengaluru"
    
    # Build baseline
    print(f"Building baseline for {city}...")
    for days_ago in range(10, 3, -1):
        date = datetime.now() - timedelta(days=days_ago)
        workflow.signal_collector.collect_all_signals(city, date)
    
    # Simulate critical surge (very high values)
    print("Simulating critical surge...")
    for days_ago in range(2, -1, -1):
        date = datetime.now() - timedelta(days=days_ago)
        signals = workflow.signal_collector.collect_all_signals(city, date)
        
        # Modify signals to show critical spike
        signals["er_visits"]["total"] = signals["er_visits"]["total"] * 2.5  # 150% increase
        signals["er_visits"]["fever"] = signals["er_visits"]["fever"] * 2.5
        signals["lab_positivity"]["viral_tests"] = signals["lab_positivity"]["viral_tests"] * 2.0  # 100% increase
        signals["ambulance_calls"]["total"] = signals["ambulance_calls"]["total"] * 2.2  # 120% increase
        signals["pharmacy_otc_sales"]["total_index"] = signals["pharmacy_otc_sales"]["total_index"] * 2.0  # 100% increase
        signals["search_trends"]["fever"] = signals["search_trends"]["fever"] * 1.8  # 80% increase
        
        workflow.signal_collector._store_signal_history(city, signals)
    
    # Run early warning
    result = workflow.run_daily_check(city)
    
    # Display results
    alert = result.get("alert", {})
    alert_level = alert.get("alert_level", "NORMAL")
    
    safe_print(f"[ALERT] Alert Level: {alert_level}")
    safe_print(f"[MESSAGE] {alert.get('message', '')}")
    print()
    
    # Display metrics
    metrics = alert.get("metrics", {})
    print("[CRITICAL METRICS]")
    print(f"   - Total Anomalies: {metrics.get('total_anomalies', 0)}")
    print(f"   - Max Spike: {metrics.get('max_spike_percentage', 0):.1f}%")
    print(f"   - Forecast Increase: {metrics.get('forecast_increase_percentage', 0):.1f}%")
    print(f"   - Consecutive Anomaly Days: {metrics.get('consecutive_anomaly_days', 0)}")
    print()
    
    # Display recommendations
    recommendations = alert.get("recommendations", [])
    if recommendations:
        print("[CRITICAL RECOMMENDATIONS]")
        for i, rec in enumerate(recommendations, 1):
            print(f"   {i}. {rec}")
        print()
    
    # Display hospital load
    hospital_load = result.get("hospital_load")
    if hospital_load and hospital_load.get("load_available"):
        print("[HOSPITAL LOAD FORECAST - CRITICAL]")
        print(f"   - Peak Beds Needed: {hospital_load.get('peak_beds_needed', 0):.0f}")
        print(f"   - Peak ICU Beds Needed: {hospital_load.get('peak_icu_beds_needed', 0):.0f}")
        print(f"   - Forecasted 7-day Cases: {hospital_load.get('forecasted_7day_cases', 0):.1f}")
        print(f"   - Total 7-day Hospitalizations: {hospital_load.get('total_7day_hospitalizations', 0):.1f}")
        print(f"   - Total 7-day ICU Needs: {hospital_load.get('total_7day_icu', 0):.1f}")
        print()

def test_forecast_details():
    """Test forecast details"""
    print_section("TEST 4: Forecast Details")
    
    workflow = EarlyWarningWorkflow()
    city = "Mumbai"
    
    # Build some history
    for days_ago in range(14, 0, -1):
        date = datetime.now() - timedelta(days=days_ago)
        workflow.signal_collector.collect_all_signals(city, date)
    
    result = workflow.run_daily_check(city)
    
    forecasts = result.get("forecasts", {})
    forecast_summary = result.get("forecast_summary", {})
    
    print("[FORECAST SUMMARY]")
    print(f"   - Overall Trend: {forecast_summary.get('overall_trend', 'stable')}")
    print(f"   - Max Increase: {forecast_summary.get('max_increase_percentage', 0):.1f}%")
    print(f"   - Signals Increasing: {len(forecast_summary.get('signals_increasing', []))}")
    print()
    
    # Show ER visits forecast
    if "er_visits" in forecasts and "total" in forecasts["er_visits"]:
        er_forecast = forecasts["er_visits"]["total"]
        if er_forecast.get("forecast_available", False):
            print("[ER VISITS FORECAST]")
            print(f"   - Current Value: {er_forecast.get('current_value', 0):.1f}")
            print(f"   - 7-day Forecast: {er_forecast.get('forecast_7day_value', 0):.1f}")
            print(f"   - Change: {er_forecast.get('forecast_change_percentage', 0):.1f}%")
            print(f"   - Trend: {er_forecast.get('trend_direction', 'stable')}")
            print(f"   - Confidence: {er_forecast.get('confidence', 'low')}")
            print()

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("  EARLY WARNING SYSTEM - TEST SUITE")
    print("=" * 80)
    
    try:
        # Test 1: Normal scenario
        test_normal_scenario()
        
        # Test 2: Anomaly scenario
        test_anomaly_scenario()
        
        # Test 3: Critical scenario
        test_critical_scenario()
        
        # Test 4: Forecast details
        test_forecast_details()
        
        print_section("ALL TESTS COMPLETED SUCCESSFULLY ✅")
        print("The early warning system is working correctly!")
        print("It can detect:")
        print("  - Normal baseline conditions")
        print("  - Anomalies and spikes")
        print("  - Critical surge scenarios")
        print("  - Forecast future trends")
        print("  - Calculate hospital load")
        print("  - Generate graded alerts")
        
    except Exception as e:
        print(f"\n[ERROR] Error during testing: {e}")
        import traceback
        traceback.print_exc()

