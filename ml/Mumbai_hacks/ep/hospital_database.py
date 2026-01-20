"""
MongoDB Database Models for Hospital Load System
Real-time hospital resource tracking and management
"""
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HospitalDatabase:
    """MongoDB connection and models for hospital data"""
    
    def __init__(self, connection_string: str = None):
        self.connection_string = connection_string or os.getenv(
            "MONGODB_URL", 
            "mongodb://localhost:27017/"
        )
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Establish MongoDB connection"""
        try:
            self.client = MongoClient(self.connection_string)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client['hospital_load_system']
            logger.info("✅ Connected to MongoDB successfully")
            
            # Create indexes for performance
            self._create_indexes()
            
        except (ConnectionFailure, Exception) as e:
            logger.warning(f"⚠️ MongoDB connection failed (service will continue without DB): {e}")
            self.client = None
            self.db = None
            # Don't raise - allow service to continue without MongoDB
    
    def _create_indexes(self):
        """Create database indexes for optimal performance"""
        # Hospital capacity indexes
        self.db.hospital_capacity.create_index([
            ("city", 1),
            ("timestamp", -1)
        ])
        
        # Real-time load indexes
        self.db.real_time_load.create_index([
            ("city", 1),
            ("timestamp", -1)
        ])
        
        # Forecast indexes
        self.db.forecasts.create_index([
            ("city", 1),
            ("disease_type", 1),
            ("forecast_date", -1)
        ])
        
        # Resource alerts indexes
        self.db.resource_alerts.create_index([
            ("city", 1),
            ("alert_level", 1),
            ("timestamp", -1)
        ])
    
    # Hospital Capacity Collection
    def upsert_hospital_capacity(self, city: str, capacity_data: Dict[str, Any]):
        """Update or insert hospital capacity data"""
        collection = self.db.hospital_capacity
        
        document = {
            "city": city,
            "timestamp": datetime.utcnow(),
            "total_beds": capacity_data.get("total_beds", 0),
            "available_beds": capacity_data.get("available_beds", 0),
            "icu_beds": capacity_data.get("icu_beds", 0),
            "available_icu": capacity_data.get("available_icu", 0),
            "ventilators": capacity_data.get("ventilators", 0),
            "available_ventilators": capacity_data.get("available_ventilators", 0),
            "staff_on_duty": capacity_data.get("staff_on_duty", 0),
            "ambulance_available": capacity_data.get("ambulance_available", 0),
            "emergency_capacity": capacity_data.get("emergency_capacity", 0)
        }
        
        # Upsert based on city
        collection.update_one(
            {"city": city},
            {"$set": document},
            upsert=True
        )
        
        logger.info(f"✅ Updated hospital capacity for {city}")
    
    def get_hospital_capacity(self, city: str) -> Optional[Dict[str, Any]]:
        """Get current hospital capacity for a city"""
        collection = self.db.hospital_capacity
        
        capacity = collection.find_one({"city": city})
        if capacity:
            capacity.pop("_id", None)  # Remove MongoDB _id
            return capacity
        
        return None
    
    # Real-time Load Collection
    def store_real_time_load(self, city: str, load_data: Dict[str, Any]):
        """Store real-time hospital load data"""
        collection = self.db.real_time_load
        
        document = {
            "city": city,
            "timestamp": datetime.utcnow(),
            "current_patients": load_data.get("current_patients", 0),
            "icu_patients": load_data.get("icu_patients", 0),
            "ventilator_patients": load_data.get("ventilator_patients", 0),
            "emergency_wait_time": load_data.get("emergency_wait_time", 0),
            "bed_occupancy_rate": load_data.get("bed_occupancy_rate", 0),
            "icu_occupancy_rate": load_data.get("icu_occupancy_rate", 0),
            "staff_utilization": load_data.get("staff_utilization", 0),
            "ambulance_response_time": load_data.get("ambulance_response_time", 0)
        }
        
        collection.insert_one(document)
        
        # Keep only last 24 hours of real-time data
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        collection.delete_many({"timestamp": {"$lt": cutoff_time}})
    
    def get_real_time_load(self, city: str, hours: int = 1) -> List[Dict[str, Any]]:
        """Get recent real-time load data"""
        collection = self.db.real_time_load
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        cursor = collection.find({
            "city": city,
            "timestamp": {"$gte": cutoff_time}
        }).sort("timestamp", -1)
        
        results = []
        for doc in cursor:
            doc.pop("_id", None)
            results.append(doc)
        
        return results
    
    # Forecast Collection
    def store_forecast(self, city: str, disease_type: str, forecast_data: Dict[str, Any]):
        """Store disease forecast data"""
        collection = self.db.forecasts
        
        document = {
            "city": city,
            "disease_type": disease_type,
            "forecast_date": datetime.utcnow(),
            "forecast_period_days": forecast_data.get("forecast_period_days", 7),
            "predicted_cases": forecast_data.get("predicted_cases", 0),
            "predicted_hospitalizations": forecast_data.get("predicted_hospitalizations", 0),
            "predicted_icu_needs": forecast_data.get("predicted_icu_needs", 0),
            "peak_date": forecast_data.get("peak_date"),
            "confidence_level": forecast_data.get("confidence_level", "medium"),
            "daily_breakdown": forecast_data.get("daily_breakdown", [])
        }
        
        collection.insert_one(document)
        
        # Keep only last 30 days of forecasts
        cutoff_time = datetime.utcnow() - timedelta(days=30)
        collection.delete_many({"forecast_date": {"$lt": cutoff_time}})
    
    def get_latest_forecast(self, city: str, disease_type: str = None) -> Optional[Dict[str, Any]]:
        """Get latest forecast for a city"""
        collection = self.db.forecasts
        
        query = {"city": city}
        if disease_type:
            query["disease_type"] = disease_type
        
        forecast = collection.find_one(query, sort=[("forecast_date", -1)])
        if forecast:
            forecast.pop("_id", None)
            return forecast
        
        return None
    
    # Resource Alerts Collection
    def create_resource_alert(self, city: str, alert_data: Dict[str, Any]):
        """Create resource shortage alert"""
        collection = self.db.resource_alerts
        
        document = {
            "city": city,
            "timestamp": datetime.utcnow(),
            "alert_level": alert_data.get("alert_level", "INFO"),
            "resource_type": alert_data.get("resource_type", "beds"),
            "current_utilization": alert_data.get("current_utilization", 0),
            "predicted_shortage": alert_data.get("predicted_shortage", 0),
            "time_to_shortage": alert_data.get("time_to_shortage", 0),
            "recommended_action": alert_data.get("recommended_action", ""),
            "resolved": False
        }
        
        collection.insert_one(document)
        logger.warning(f"🚨 Resource alert created for {city}: {alert_data.get('alert_level')}")
    
    def get_active_alerts(self, city: str) -> List[Dict[str, Any]]:
        """Get active (unresolved) alerts for a city"""
        collection = self.db.resource_alerts
        
        cursor = collection.find({
            "city": city,
            "resolved": False
        }).sort("timestamp", -1)
        
        results = []
        for doc in cursor:
            doc.pop("_id", None)
            results.append(doc)
        
        return results
    
    def resolve_alert(self, city: str, alert_id: str):
        """Mark an alert as resolved"""
        collection = self.db.resource_alerts
        
        collection.update_one(
            {"city": city, "_id": alert_id},
            {"$set": {"resolved": True, "resolved_at": datetime.utcnow()}}
        )
    
    # Analytics and Reporting
    def get_city_summary(self, city: str) -> Dict[str, Any]:
        """Get comprehensive city summary"""
        capacity = self.get_hospital_capacity(city)
        current_load = self.get_real_time_load(city, hours=1)
        latest_forecast = self.get_latest_forecast(city)
        active_alerts = self.get_active_alerts(city)
        
        return {
            "city": city,
            "timestamp": datetime.utcnow().isoformat(),
            "capacity": capacity,
            "current_load": current_load[0] if current_load else None,
            "latest_forecast": latest_forecast,
            "active_alerts": active_alerts,
            "alert_count": len(active_alerts)
        }
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get system-wide statistics"""
        return {
            "total_cities": self.db.hospital_capacity.count_documents({}),
            "active_alerts": self.db.resource_alerts.count_documents({"resolved": False}),
            "latest_forecasts": self.db.forecasts.count_documents({
                "forecast_date": {"$gte": datetime.utcnow() - timedelta(days=1)}
            }),
            "database_size_mb": self.db.command("collstats", "real_time_load").get("size", 0) / (1024*1024)
        }
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("✅ MongoDB connection closed")

# Singleton instance for application use (lazy initialization)
hospital_db = None

def get_hospital_db():
    """Get or create hospital database instance"""
    global hospital_db
    if hospital_db is None:
        try:
            hospital_db = HospitalDatabase()
        except Exception as e:
            logger.warning(f"⚠️ Could not initialize hospital database: {e}")
            # Return a dummy object that won't crash
            class DummyDB:
                def __getattr__(self, name):
                    return lambda *args, **kwargs: None
            hospital_db = DummyDB()
    return hospital_db
