# MongoDB Hospital Load System - Setup Guide

## 🚀 Quick Setup

### 1. Install MongoDB
```bash
# Windows - Download and install from https://www.mongodb.com/try/download/community
# Or use Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Install Python Dependencies
```bash
cd c:\Mumbai_hacks
pip install -r Whether_pollution_agent/requirements.txt
```

### 3. Set Up Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URL=mongodb://localhost:27017/
```

### 4. Start Real-time Hospital API
```bash
cd ep
python real_time_hospital_api.py
```
✅ API runs on `http://localhost:8002`

### 5. Test the System
```bash
# Test database connection
curl http://localhost:8002/system/test-connection

# Start real-time data collection
curl -X POST http://localhost:8002/system/start-collection

# Get hospital status
curl http://localhost:8002/hospital/status/Mumbai
```

## 📊 Real-time Features

### **Live Hospital Capacity Tracking**
- Real-time bed availability
- ICU capacity monitoring  
- Ventilator availability
- Staff utilization tracking

### **Dynamic Load Calculation**
- Forecast-based resource needs
- Capacity shortage alerts
- Automatic resource recommendations
- Multi-disease modeling

### **Real-time Data Collection**
- Background data ingestion
- Hospital system integration
- Automatic alert generation
- Historical data storage

## 🔗 API Endpoints

### **Hospital Capacity**
```bash
POST /hospital/capacity/{city}     # Update capacity
GET  /hospital/capacity/{city}     # Get current capacity
```

### **Hospital Load**
```bash
POST /hospital/load/{city}         # Update current load
GET  /hospital/load/{city}         # Get recent load data
```

### **Real-time Forecast**
```bash
POST /hospital/forecast/{city}     # Calculate with live data
GET  /hospital/forecast/{city}     # Get latest forecast
```

### **System Management**
```bash
GET  /hospital/status/{city}       # Complete city status
GET  /hospital/alerts/{city}       # Active resource alerts
GET  /system/stats                 # System statistics
POST /system/test-connection       # Test database
POST /system/start-collection      # Start real-time collection
```

## 📈 Database Schema

### **Collections Created**
1. **hospital_capacity** - Current hospital resources
2. **real_time_load** - Live patient load data  
3. **forecasts** - Disease predictions
4. **resource_alerts** - Capacity shortage alerts

### **Indexes for Performance**
- City + timestamp queries
- Alert level filtering
- Forecast date indexing

## 🔄 Real-time Data Flow

```
Hospital Systems → API Endpoints → MongoDB Storage → Real-time Calculations → Alert Generation
```

### **Data Collection Pipeline**
1. Hospital systems send capacity/load data via API
2. MongoDB stores with timestamps
3. Calculator processes forecasts with live capacity
4. Alerts generated for resource shortages
5. Dashboard displays real-time status

## 🚨 Alert System

### **Alert Levels**
- **INFO**: Capacity utilization > 70%
- **WARNING**: Capacity utilization > 80%  
- **CRITICAL**: Capacity utilization > 90%

### **Automatic Actions**
- Resource shortage calculations
- Recommended actions generation
- Alert persistence in database
- Historical alert tracking

## 📱 Integration Examples

### **Update Hospital Capacity**
```bash
curl -X POST http://localhost:8002/hospital/capacity/Mumbai \
  -H "Content-Type: application/json" \
  -d '{
    "total_beds": 1000,
    "available_beds": 250,
    "icu_beds": 80,
    "available_icu": 15,
    "ventilators": 40,
    "available_ventilators": 8,
    "staff_on_duty": 300,
    "ambulance_available": 10,
    "emergency_capacity": 150
  }'
```

### **Calculate Real-time Forecast**
```bash
curl -X POST http://localhost:8002/hospital/forecast/Mumbai \
  -H "Content-Type: application/json" \
  -d '{
    "forecasted_cases": {
      "day_1": 120,
      "day_2": 135,
      "day_3": 150,
      "day_4": 145,
      "day_5": 140,
      "day_6": 130,
      "day_7": 125,
      "total_7day": 945
    },
    "disease_type": "viral_fever"
  }'
```

## 🛠️ Production Setup

### **MongoDB Configuration**
```javascript
// MongoDB configuration for production
db.adminCommand({
  setParameter: 1,
  wiredTigerConcurrentReadTransactions: 128,
  wiredTigerConcurrentWriteTransactions: 128
})
```

### **Environment Variables**
```bash
# Production environment
MONGODB_URL=mongodb://username:password@prod-mongo-cluster:27017/
REDIS_URL=redis://prod-redis-cluster:6379/0
LOG_LEVEL=WARNING
DATA_COLLECTION_INTERVAL_MINUTES=1
```

### **Docker Deployment**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "ep/real_time_hospital_api.py"]
```

## 📊 Monitoring & Analytics

### **System Metrics**
- Database connection health
- API response times
- Data collection frequency
- Alert generation rates

### **Health Checks**
```bash
# Database connectivity
curl http://localhost:8002/system/test-connection

# System statistics  
curl http://localhost:8002/system/stats
```

## 🔧 Troubleshooting

### **MongoDB Connection Issues**
```bash
# Check MongoDB status
docker ps | grep mongo

# Test connection manually
python -c "from pymongo import MongoClient; print(MongoClient('mongodb://localhost:27017/').admin.command('ping'))"
```

### **API Not Responding**
```bash
# Check if port is in use
netstat -an | grep 8002

# Restart with different port
uvicorn real_time_hospital_api:app --port 8003
```

### **Data Not Updating**
```bash
# Check background task status
curl http://localhost:8002/system/stats

# Manually trigger data collection
curl -X POST http://localhost:8002/system/start-collection
```

## 🚀 Next Steps

1. **Connect Real Hospital Systems** - Replace simulated data with actual hospital EMR/HIS integrations
2. **Set Up Production MongoDB** - Configure replica sets and backups
3. **Add Authentication** - Implement API key authentication
4. **Scale with Redis** - Add Redis for caching and task queue
5. **Monitor with Dashboard** - Create real-time monitoring dashboard

## ✅ Status

| Component | Status |
|-----------|--------|
| MongoDB Database | ✅ Ready |
| Real-time API | ✅ Ready |
| Hospital Load Calculator | ✅ Enhanced |
| Alert System | ✅ Active |
| Background Collection | ✅ Running |

**Overall Status**: 🟢 **REAL-TIME SYSTEM READY**
