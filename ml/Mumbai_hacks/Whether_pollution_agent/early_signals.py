"""
Early Signal Data Collection Agent
Collects signals that change before outbreaks become visible
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import random
from .tools import fetch_weather_api, fetch_pollution_data
from .city_data import get_city_data

# Mock data generation for demonstration
# In production, these would connect to real data sources
MOCK_MODE = True

class EarlySignalCollector:
    """Agent 1: Collects early signals from multiple data sources"""
    
    def __init__(self):
        self.signal_history = {}  # Store historical signals for baseline calculation
    
    def collect_all_signals(self, city: str, date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Collect all early signals for a city
        
        Returns:
            Dictionary with all signal types and their values
        """
        if date is None:
            date = datetime.now()
        
        signals = {
            "timestamp": date.isoformat(),
            "city": city,
            "er_visits": self._collect_er_visits(city, date),
            "lab_positivity": self._collect_lab_positivity(city, date),
            "ambulance_calls": self._collect_ambulance_calls(city, date),
            "pharmacy_otc_sales": self._collect_pharmacy_sales(city, date),
            "weather": self._collect_weather_signals(city, date),
            "search_trends": self._collect_search_trends(city, date),
            "mosquito_index": self._collect_mosquito_index(city, date)
        }
        
        # Store in history for baseline calculation
        self._store_signal_history(city, signals)
        
        return signals
    
    def _collect_er_visits(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect ER visits for fever/cough/rash symptoms"""
        if MOCK_MODE:
            # Simulate ER visits (base + random variation)
            base_visits = 40 + random.uniform(-10, 10)
            return {
                "fever": round(base_visits * 0.4, 1),
                "cough": round(base_visits * 0.35, 1),
                "rash": round(base_visits * 0.25, 1),
                "total": round(base_visits, 1)
            }
        # In production: Connect to hospital ER systems
        return {"fever": 0, "cough": 0, "rash": 0, "total": 0}
    
    def _collect_lab_positivity(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect lab test positivity rates"""
        if MOCK_MODE:
            # Simulate lab positivity (percentage)
            return {
                "viral_tests": round(15 + random.uniform(-5, 5), 1),
                "bacterial_tests": round(8 + random.uniform(-3, 3), 1),
                "dengue_tests": round(5 + random.uniform(-2, 2), 1)
            }
        # In production: Connect to lab information systems
        return {"viral_tests": 0, "bacterial_tests": 0, "dengue_tests": 0}
    
    def _collect_ambulance_calls(self, city: str, date: datetime) -> Dict[str, int]:
        """Collect ambulance call volume"""
        if MOCK_MODE:
            base_calls = 25 + random.randint(-5, 5)
            return {
                "respiratory": base_calls // 2,
                "fever": base_calls // 3,
                "other": base_calls - (base_calls // 2 + base_calls // 3),
                "total": base_calls
            }
        # In production: Connect to ambulance dispatch systems
        return {"respiratory": 0, "fever": 0, "other": 0, "total": 0}
    
    def _collect_pharmacy_sales(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect OTC pharmacy sales (paracetamol, cough syrup, etc.)"""
        if MOCK_MODE:
            # Simulate sales volume (normalized index)
            return {
                "antipyretics": round(100 + random.uniform(-20, 20), 1),
                "cough_syrup": round(80 + random.uniform(-15, 15), 1),
                "antihistamines": round(60 + random.uniform(-10, 10), 1),
                "total_index": round(240 + random.uniform(-40, 40), 1)
            }
        # In production: Connect to pharmacy chains' data systems
        return {"antipyretics": 0, "cough_syrup": 0, "antihistamines": 0, "total_index": 0}
    
    def _collect_weather_signals(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect weather data (temperature, humidity, rainfall)"""
        weather = fetch_weather_api(city)
        return {
            "temperature": weather.get("temperature", 25.0),
            "humidity": weather.get("humidity", 60.0),
            "rainfall": weather.get("rainfall", 0.0)
        }
    
    def _collect_search_trends(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect search/social trend spikes for symptoms"""
        if MOCK_MODE:
            # Simulate search trend index
            return {
                "fever": round(50 + random.uniform(-10, 10), 1),
                "cough": round(45 + random.uniform(-8, 8), 1),
                "dengue": round(30 + random.uniform(-5, 5), 1),
                "flu": round(40 + random.uniform(-8, 8), 1)
            }
        # In production: Connect to Google Trends API, Twitter API, etc.
        return {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
    
    def _collect_mosquito_index(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect mosquito index (for dengue warning)"""
        weather = fetch_weather_api(city)
        rainfall = weather.get("rainfall", 0.0)
        humidity = weather.get("humidity", 60.0)
        
        # Calculate mosquito index based on weather
        # Higher with rainfall and humidity
        base_index = 30
        if rainfall > 10:
            base_index += 30
        elif rainfall > 5:
            base_index += 15
        
        if humidity > 70:
            base_index += 20
        elif humidity > 60:
            base_index += 10
        
        if MOCK_MODE:
            base_index += random.uniform(-5, 5)
        
        return {
            "index": round(max(0, min(100, base_index)), 1),
            "risk_level": "low" if base_index < 40 else "medium" if base_index < 70 else "high"
        }
    
    def _store_signal_history(self, city: str, signals: Dict[str, Any]):
        """Store signals in history for baseline calculation"""
        if city not in self.signal_history:
            self.signal_history[city] = []
        
        self.signal_history[city].append(signals)
        
        # Keep only last 365 days
        if len(self.signal_history[city]) > 365:
            self.signal_history[city] = self.signal_history[city][-365:]
    
    def get_recent_signals(self, city: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get recent signals for a city"""
        if city not in self.signal_history:
            return []
        
        cutoff_date = datetime.now() - timedelta(days=days)
        recent = [
            s for s in self.signal_history[city]
            if datetime.fromisoformat(s["timestamp"]) >= cutoff_date
        ]
        return recent

