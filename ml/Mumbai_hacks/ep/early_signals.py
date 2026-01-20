"""
Early Signal Data Collection Agent
Collects signals that change before outbreaks become visible
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import random
import sys
import os
import requests
import logging
from pytrends.request import TrendReq
import tweepy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add parent directory to path to import from Whether_pollution_agent
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from Whether_pollution_agent.tools import fetch_weather_api, fetch_pollution_data
from Whether_pollution_agent.city_data import get_city_data

# Real data collection from external APIs
# No mock data - all sources are real-time or from databases
REAL_DATA_MODE = True

class EarlySignalCollector:
    """Agent 1: Collects early signals from multiple data sources"""
    
    def __init__(self):
        self.signal_history = {}  # Store historical signals for baseline calculation
        self.twitter_api = self._setup_twitter_api()  # Initialize Twitter API
    
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
            "pollution": self._collect_pollution_signals(city, date),
            "search_trends": self._collect_search_trends(city, date),
            "mosquito_index": self._collect_mosquito_index(city, date)
        }
        
        # Store in history for baseline calculation
        self._store_signal_history(city, signals)
        
        return signals
    
    def _collect_er_visits(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect ER visits for fever/cough/rash symptoms"""
        # Connect to hospital EMR/HIS systems via FHIR API
        try:
            # Example: Connect to hospital FHIR endpoint
            er_data = self._fetch_fhir_observation(city, date, "fever,cough,rash")
            return er_data
        except Exception as e:
            logger.error(f"Failed to fetch ER data for {city}: {e}")
            # Return empty data - no mock fallback
            return {"fever": 0, "cough": 0, "rash": 0, "total": 0}
    
    def _collect_lab_positivity(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect lab test positivity rates"""
        try:
            # Connect to laboratory information systems
            lab_data = self._fetch_lab_results(city, date)
            return lab_data
        except Exception as e:
            logger.error(f"Failed to fetch lab data for {city}: {e}")
            return {"viral_tests": 0, "bacterial_tests": 0, "dengue_tests": 0}
    
    def _collect_ambulance_calls(self, city: str, date: datetime) -> Dict[str, int]:
        """Collect ambulance call volume"""
        try:
            # Connect to emergency services dispatch systems
            ambulance_data = self._fetch_ambulance_dispatch(city, date)
            return ambulance_data
        except Exception as e:
            logger.error(f"Failed to fetch ambulance data for {city}: {e}")
            return {"respiratory": 0, "fever": 0, "other": 0, "total": 0}
    
    def _collect_pharmacy_sales(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect OTC pharmacy sales (paracetamol, cough syrup, etc.)"""
        try:
            # Connect to pharmacy chain sales APIs
            pharmacy_data = self._fetch_pharmacy_sales(city, date)
            return pharmacy_data
        except Exception as e:
            logger.error(f"Failed to fetch pharmacy data for {city}: {e}")
            return {"antipyretics": 0, "cough_syrup": 0, "antihistamines": 0, "total_index": 0}
    
    def _collect_weather_signals(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect weather data (temperature, humidity, rainfall)"""
        weather = fetch_weather_api(city)
        return {
            "temperature": weather.get("temperature", 25.0),
            "humidity": weather.get("humidity", 60.0),
            "rainfall": weather.get("rainfall", 0.0)
        }
    
    def _collect_pollution_signals(self, city: str, date: datetime) -> Dict[str, Any]:
        """Collect pollution/AQI data"""
        try:
            pollution = fetch_pollution_data(city)
            return {
                "aqi": pollution.get("aqi", 0),
                "pm25": pollution.get("pm25", 0),
                "pm10": pollution.get("pm10", 0),
                "no2": pollution.get("no2", 0),
                "so2": pollution.get("so2", 0),
                "co": pollution.get("co", 0),
                "o3": pollution.get("o3", 0)
            }
        except Exception as e:
            logger.error(f"Failed to fetch pollution data for {city}: {e}")
            # Return default values if pollution data unavailable
            return {
                "aqi": 0,
                "pm25": 0,
                "pm10": 0,
                "no2": 0,
                "so2": 0,
                "co": 0,
                "o3": 0
            }
    
    def _collect_search_trends(self, city: str, date: datetime) -> Dict[str, float]:
        """Collect search/social trend spikes for symptoms using multiple sources"""
        combined_trends = {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
        
        # Primary: Google Trends (no API key needed)
        try:
            google_trends = self._fetch_google_trends(city, ["fever", "cough", "dengue", "flu"])
            # Weight: 70% for Google Trends (more reliable)
            for key in combined_trends:
                combined_trends[key] = google_trends.get(key, 0) * 0.7
            logger.info(f"✅ Google Trends data collected for {city}")
        except Exception as e:
            logger.warning(f"Google Trends unavailable for {city}: {e}")
        
        # Secondary: Twitter API (free tier - 500K tweets/month)
        if self.twitter_api:
            try:
                twitter_trends = self._fetch_twitter_trends(city)
                # Weight: 30% for Twitter (real-time social media)
                for key in combined_trends:
                    combined_trends[key] += twitter_trends.get(key, 0) * 0.3
                logger.info(f"✅ Twitter trends data collected for {city}")
            except Exception as e:
                logger.warning(f"Twitter unavailable for {city}: {e}")
        
        # Round final values
        for key in combined_trends:
            combined_trends[key] = round(combined_trends[key], 1)
        
        return combined_trends
    
    def _setup_twitter_api(self):
        """Setup Twitter API if credentials are available"""
        try:
            # Try Twitter API v2 with Bearer Token first (preferred)
            bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
            if bearer_token:
                self.twitter_client = tweepy.Client(bearer_token=bearer_token)
                logger.info("✅ Twitter API v2 initialized with Bearer Token")
                return self.twitter_client
            
            # Fallback to v1.1 with app credentials
            api_key = os.getenv('TWITTER_API_KEY')
            api_secret = os.getenv('TWITTER_API_SECRET')
            access_token = os.getenv('TWITTER_ACCESS_TOKEN')
            access_token_secret = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
            
            if all([api_key, api_secret, access_token, access_token_secret]):
                auth = tweepy.OAuthHandler(api_key, api_secret)
                auth.set_access_token(access_token, access_token_secret)
                api = tweepy.API(auth, wait_on_rate_limit=True)
                logger.info("✅ Twitter API v1.1 initialized")
                return api
            else:
                logger.info("ℹ️ Twitter API credentials not found - using Google Trends only")
                return None
                
        except Exception as e:
            logger.error(f"❌ Twitter API setup failed: {e}")
            return None
    
    def _fetch_twitter_trends(self, city: str) -> Dict[str, int]:
        """Fetch disease-related trends from Twitter API"""
        if not self.twitter_api:
            return {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
        
        try:
            # Check if we have v2 API client (Bearer Token)
            if hasattr(self, 'twitter_client') and self.twitter_client:
                return self._fetch_twitter_v2_trends(city)
            else:
                # Fallback to v1.1 API
                return self._fetch_twitter_v1_trends(city)
                
        except Exception as e:
            logger.error(f"Twitter API error: {e}")
            return {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
    
    def _fetch_twitter_v2_trends(self, city: str) -> Dict[str, int]:
        """Fetch trends using Twitter API v2 (with Bearer Token)"""
        try:
            # Search for recent tweets with disease symptoms
            search_query = "fever OR cough OR dengue OR flu -is:retweet lang:en"
            
            # Use v2 API search
            response = self.twitter_client.search_recent_tweets(
                query=search_query,
                max_results=100,
                tweet_fields=["created_at", "public_metrics", "lang"]
            )
            
            symptom_counts = {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
            
            if response.data:
                for tweet in response.data:
                    text = tweet.text.lower()
                    
                    # Count symptom mentions (avoid double counting)
                    mentioned = []
                    if "fever" in text and "fever" not in mentioned:
                        symptom_counts["fever"] += 1
                        mentioned.append("fever")
                    if "cough" in text and "cough" not in mentioned:
                        symptom_counts["cough"] += 1
                        mentioned.append("cough")
                    if "dengue" in text and "dengue" not in mentioned:
                        symptom_counts["dengue"] += 1
                        mentioned.append("dengue")
                    if "flu" in text and "flu" not in mentioned:
                        symptom_counts["flu"] += 1
                        mentioned.append("flu")
            
            logger.info(f"Twitter v2 trends for {city}: {symptom_counts}")
            return symptom_counts
            
        except tweepy.errors.TweepyException as e:
            logger.error(f"Twitter v2 API error: {e}")
            return {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
        except Exception as e:
            logger.error(f"Twitter v2 unexpected error: {e}")
            return {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
    
    def _fetch_twitter_v1_trends(self, city: str) -> Dict[str, int]:
        """Fetch trends using Twitter API v1.1 (fallback)"""
        try:
            search_query = "fever OR cough OR dengue OR flu -is:retweet lang:en"
            
            tweets = tweepy.Cursor(
                self.twitter_api.search_tweets,
                q=search_query,
                lang="en",
                result_type="recent",
                tweet_mode="extended"
            ).items(100)
            
            symptom_counts = {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
            
            for tweet in tweets:
                text = tweet.full_text.lower()
                
                # Count symptom mentions (avoid double counting)
                mentioned = []
                if "fever" in text and "fever" not in mentioned:
                    symptom_counts["fever"] += 1
                    mentioned.append("fever")
                if "cough" in text and "cough" not in mentioned:
                    symptom_counts["cough"] += 1
                    mentioned.append("cough")
                if "dengue" in text and "dengue" not in mentioned:
                    symptom_counts["dengue"] += 1
                    mentioned.append("dengue")
                if "flu" in text and "flu" not in mentioned:
                    symptom_counts["flu"] += 1
                    mentioned.append("flu")
            
            logger.info(f"Twitter v1 trends for {city}: {symptom_counts}")
            return symptom_counts
            
        except tweepy.errors.Forbidden as e:
            if "453" in str(e):
                logger.warning("Twitter API: Essential access detected - search not available")
                logger.info("ℹ️ To enable Twitter search: Upgrade to Elevated access at https://developer.x.com/en/portal/product")
                return {"fever": 0, "cough": 0, "dengue": 0, "flu": 0}
            else:
                raise e
        except Exception as e:
            logger.error(f"Twitter v1 API error: {e}")
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
    
    # Real API integration methods
    def _fetch_fhir_observation(self, city: str, date: datetime, symptoms: str) -> Dict[str, float]:
        """Fetch ER visit data from hospital FHIR API"""
        try:
            # Example FHIR endpoint - replace with actual hospital API
            fhir_base_url = os.getenv("HOSPITAL_FHIR_URL", "https://api.hospital.example.com/fhir")
            
            headers = {
                "Authorization": f"Bearer {os.getenv('HOSPITAL_API_KEY', '')}",
                "Accept": "application/fhir+json"
            }
            
            # Query for observations with specific symptoms
            params = {
                "category": "vital-signs",
                "date": date.strftime("%Y-%m-%d"),
                "code": symptoms,
                "_count": 100
            }
            
            response = requests.get(f"{fhir_base_url}/Observation", headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                bundle = response.json()
                return self._process_fhir_observations(bundle)
            else:
                logger.warning(f"FHIR API returned status {response.status_code}")
                return {"fever": 0, "cough": 0, "rash": 0, "total": 0}
                
        except Exception as e:
            logger.error(f"FHIR API error: {e}")
            return {"fever": 0, "cough": 0, "rash": 0, "total": 0}
    
    def _process_fhir_observations(self, bundle: Dict) -> Dict[str, float]:
        """Process FHIR observation bundle into symptom counts"""
        symptom_counts = {"fever": 0, "cough": 0, "rash": 0, "total": 0}
        
        if "entry" not in bundle:
            return symptom_counts
            
        for entry in bundle["entry"]:
            observation = entry.get("resource", {})
            code = observation.get("code", {})
            coding = code.get("coding", [])
            
            if coding:
                symptom = coding[0].get("code", "").lower()
                if "fever" in symptom:
                    symptom_counts["fever"] += 1
                    symptom_counts["total"] += 1
                elif "cough" in symptom:
                    symptom_counts["cough"] += 1
                    symptom_counts["total"] += 1
                elif "rash" in symptom:
                    symptom_counts["rash"] += 1
                    symptom_counts["total"] += 1
        
        return symptom_counts
    
    def _fetch_lab_results(self, city: str, date: datetime) -> Dict[str, float]:
        """Fetch lab test positivity rates from laboratory systems"""
        try:
            # Example lab API - replace with actual lab system
            lab_api_url = os.getenv("LAB_API_URL", "https://api.lab.example.com")
            
            headers = {
                "Authorization": f"Bearer {os.getenv('LAB_API_KEY', '')}",
                "Content-Type": "application/json"
            }
            
            # Query for test results on specific date
            payload = {
                "date": date.strftime("%Y-%m-%d"),
                "city": city,
                "test_types": ["viral", "bacterial", "dengue"]
            }
            
            response = requests.post(f"{lab_api_url}/test-results", headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "viral_tests": data.get("viral_positivity_rate", 0),
                    "bacterial_tests": data.get("bacterial_positivity_rate", 0),
                    "dengue_tests": data.get("dengue_positivity_rate", 0)
                }
            else:
                logger.warning(f"Lab API returned status {response.status_code}")
                return {"viral_tests": 0, "bacterial_tests": 0, "dengue_tests": 0}
                
        except Exception as e:
            logger.error(f"Lab API error: {e}")
            return {"viral_tests": 0, "bacterial_tests": 0, "dengue_tests": 0}
    
    def _fetch_ambulance_dispatch(self, city: str, date: datetime) -> Dict[str, int]:
        """Fetch ambulance call volume from emergency dispatch systems"""
        try:
            # Example emergency services API
            dispatch_url = os.getenv("EMERGENCY_API_URL", "https://api.emergency.example.com")
            
            headers = {
                "Authorization": f"Bearer {os.getenv('EMERGENCY_API_KEY', '')}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "date": date.strftime("%Y-%m-%d"),
                "city": city,
                "call_types": ["respiratory", "fever", "other"]
            }
            
            response = requests.post(f"{dispatch_url}/dispatch-calls", headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "respiratory": data.get("respiratory_calls", 0),
                    "fever": data.get("fever_calls", 0),
                    "other": data.get("other_calls", 0),
                    "total": data.get("total_calls", 0)
                }
            else:
                logger.warning(f"Emergency API returned status {response.status_code}")
                return {"respiratory": 0, "fever": 0, "other": 0, "total": 0}
                
        except Exception as e:
            logger.error(f"Emergency API error: {e}")
            return {"respiratory": 0, "fever": 0, "other": 0, "total": 0}
    
    def _fetch_pharmacy_sales(self, city: str, date: datetime) -> Dict[str, float]:
        """Fetch OTC pharmacy sales data from pharmacy chains"""
        try:
            # Example pharmacy API
            pharmacy_url = os.getenv("PHARMACY_API_URL", "https://api.pharmacy.example.com")
            
            headers = {
                "Authorization": f"Bearer {os.getenv('PHARMACY_API_KEY', '')}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "date": date.strftime("%Y-%m-%d"),
                "city": city,
                "categories": ["antipyretics", "cough_syrup", "antihistamines"]
            }
            
            response = requests.post(f"{pharmacy_url}/sales-data", headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "antipyretics": data.get("antipyretics_sales", 0),
                    "cough_syrup": data.get("cough_syrup_sales", 0),
                    "antihistamines": data.get("antihistamines_sales", 0),
                    "total_index": data.get("total_sales_index", 0)
                }
            else:
                logger.warning(f"Pharmacy API returned status {response.status_code}")
                return {"antipyretics": 0, "cough_syrup": 0, "antihistamines": 0, "total_index": 0}
                
        except Exception as e:
            logger.error(f"Pharmacy API error: {e}")
            return {"antipyretics": 0, "cough_syrup": 0, "antihistamines": 0, "total_index": 0}
    
    def _fetch_google_trends(self, city: str, keywords: List[str]) -> Dict[str, float]:
        """Fetch Google Trends data for symptom-related searches"""
        try:
            pytrends = TrendReq(hl='en-US', tz=330)  # India timezone
            
            # Build payload for multiple keywords
            pytrends.build_payload(keywords, timeframe='now 1-d', geo='IN')
            
            # Get interest over time
            interest_data = pytrends.interest_over_time()
            
            if not interest_data.empty:
                latest_data = interest_data.iloc[-1]
                return {
                    keyword: int(latest_data[keyword]) if keyword in latest_data else 0
                    for keyword in keywords
                }
            else:
                logger.warning("No Google Trends data available")
                return {keyword: 0 for keyword in keywords}
                
        except Exception as e:
            logger.error(f"Google Trends error: {e}")
            return {keyword: 0 for keyword in keywords}

