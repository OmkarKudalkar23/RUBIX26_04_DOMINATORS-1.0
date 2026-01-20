# Healthcare Risk & Resource Prediction System

A complete full-stack application combining a Python FastAPI backend with a Next.js frontend to provide real-time air quality monitoring and healthcare resource predictions.

## 🎯 Project Overview

This system helps healthcare providers and patients make informed decisions based on real-time air quality data. It provides three role-specific dashboards:

- **Patient Dashboard**: Personal health recommendations
- **Doctor Dashboard**: Clinical alerts and patient surge predictions
- **Hospital Dashboard**: Resource management and operational planning

## 📁 Project Structure

```
WeatherAgent/
├── api.py                          # FastAPI backend (main)
├── server.py                       # Alternative server
├── main.py                         # Entry point
├── requirements.txt                # Python dependencies
├── environment_log.csv             # Data logging
├── Whether_pollution_agent/        # Backend logic
│   ├── __init__.py
│   ├── agent.py                   # Agent implementation
│   ├── tools.py                   # Prediction tools
│   ├── workflow.py                # Workflow logic
│   └── city_data.py               # City data and utilities
├── frontend/                       # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js          # Root layout
│   │   │   ├── page.js            # Landing page
│   │   │   ├── patient/page.js    # Patient dashboard
│   │   │   ├── doctor/page.js     # Doctor dashboard
│   │   │   └── hospital/page.js   # Hospital dashboard
│   │   ├── components/
│   │   │   ├── PatientDashboard.js
│   │   │   ├── DoctorDashboard.js
│   │   │   └── HospitalDashboard.js
│   │   ├── utils/
│   │   │   └── locationUtils.js
│   │   └── globals.css
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.local
│   └── README.md
├── QUICK_START.md                 # Quick start guide
├── FRONTEND_SETUP.md              # Frontend setup guide
├── IMPLEMENTATION_SUMMARY.md      # Implementation details
└── README_COMPLETE.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+ and npm 7+
- Modern web browser with Geolocation API support

### Quick Setup (5 minutes)

#### 1. Start Backend API

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the API
python api.py
```

API will be available at `http://localhost:8000`

#### 2. Start Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

#### 3. Access the Application

Visit `http://localhost:3000` in your browser and select a dashboard!

## 📊 Backend (Python FastAPI)

### API Endpoints

#### Root Endpoint
```
GET /
```
Returns API information and available endpoints.

#### Prediction Endpoint (GET)
```
GET /predict/{city}
```

Query parameters (optional):
- `aqi`: Air Quality Index
- `pm25`: PM2.5 value
- `temperature`: Temperature in Celsius
- `humidity`: Humidity percentage
- `rainfall`: Rainfall in mm
- `bed_usage`: Hospital bed usage percentage
- `last_7day_patients`: Total patients in last 7 days

#### Prediction Endpoint (POST)
```
POST /predict
```

Request body:
```json
{
  "city": "Mumbai",
  "aqi": 147.0,
  "pm25": 54.34,
  "temperature": 28.5,
  "humidity": 65,
  "rainfall": 0,
  "hospital_inputs": {
    "bed_usage": 80.5,
    "last_7day_patients": 560
  }
}
```

#### Cities Endpoint
```
GET /cities
```
Returns list of supported cities.

### Response Format

All prediction endpoints return:

```json
{
  "status": "success",
  "city": "Mumbai",
  "state": "Maharashtra",
  "aqi": 147.0,
  "pm25": 54.34661015945235,
  "expected_patients_next_24h": 71,
  "surge_probability": 0.0,
  "timestamp": "2025-11-18T13:07:23.123320Z",
  "patient_dashboard": "Air quality is unhealthy for sensitive groups in Mumbai (AQI 147). Wear a mask if outdoors, especially if you have respiratory conditions.",
  "doctor_dashboard": "Expect 20-30% rise in asthma/COPD cases. Prepare for 71 respiratory patients in next 24 hours.",
  "hospital_dashboard": "Stock inhalers and nebulizers. Prepare for mild OPD increase. Expected 71 patients. Open 2-3 additional beds.",
  "recommended_actions": {
    "oxygen_cylinder_increase_percent": 10,
    "emergency_beds_to_open": 10,
    "staff_alert_required": false,
    "mask_advisory": true
  }
}
```

### Supported Cities

- Delhi
- Mumbai
- Pune
- Jaipur
- Bengaluru
- Chennai
- Hyderabad
- Kolkata
- Ahmedabad
- Lucknow

### Backend Features

✅ Real-time pollution data fetching
✅ Weather API integration
✅ Patient surge prediction
✅ Hospital resource recommendations
✅ City-specific characteristics
✅ Festival and seasonal adjustments
✅ CORS enabled for frontend access

## 🎨 Frontend (Next.js)

### Pages

#### Landing Page (`/`)
- Hero section with project description
- Three dashboard cards
- Feature highlights
- Call-to-action buttons

#### Patient Dashboard (`/patient`)
- Location display (city, state)
- AQI and PM2.5 levels with color coding
- Personalized health recommendations
- Mask advisory
- Health tips and guidelines
- Refresh button for manual updates

#### Doctor Dashboard (`/doctor`)
- Risk level assessment
- Expected patient count
- Surge probability
- Clinical alerts
- Patient metrics
- Clinical recommendations

#### Hospital Dashboard (`/hospital`)
- Operational alerts
- Resource recommendations
- Staff alert status
- Mask advisory
- Environmental data
- Surge probability tracking

### Features

✅ Real-time location detection
✅ Automatic city estimation
✅ Beautiful responsive UI
✅ Dark theme with gradients
✅ Interactive components
✅ Error handling
✅ Loading states
✅ Data refresh capability

### Technology Stack

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: Next.js App Router

## 🔄 How It Works

### User Journey

1. **User visits dashboard** → Requests location permission
2. **Browser detects GPS** → Gets coordinates
3. **Frontend estimates city** → Uses distance calculation
4. **API is called** → `/predict/{city}`
5. **Backend processes** → Fetches data and predicts
6. **Response returned** → JSON with all predictions
7. **Dashboard renders** → Role-specific UI displayed

### Location Estimation

The frontend uses the Haversine formula to calculate the distance between the user's GPS coordinates and predefined city coordinates. The nearest city is selected for prediction.

### Data Flow

```
Browser Geolocation API
        ↓
Location Utils (Distance Calculation)
        ↓
Axios HTTP Request
        ↓
FastAPI Backend (/predict/{city})
        ↓
Backend Tools (Fetch Weather, Pollution, Predict)
        ↓
JSON Response
        ↓
React Component Rendering
        ↓
Interactive Dashboard Display
```

## 🔧 Configuration

### Backend Configuration

Edit `api.py` to modify:
- API host and port
- CORS settings
- API documentation

### Frontend Configuration

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production:
```
NEXT_PUBLIC_API_URL=https://your-api-url.com
```

## 📦 Dependencies

### Backend (Python)

```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.0.0
requests>=2.31.0
pandas>=2.0.0
langgraph>=0.0.20
openaq>=1.0.0
joblib>=1.3.0
```

### Frontend (Node.js)

```
react@18.2.0
react-dom@18.2.0
next@14.0.0
axios@1.6.0
lucide-react@0.294.0
tailwindcss@3.3.0
postcss@8.4.32
autoprefixer@10.4.16
```

## 🚢 Deployment

### Deploy Backend

#### Option 1: Heroku
```bash
heroku create your-app-name
git push heroku main
```

#### Option 2: AWS/Google Cloud
- Create VM instance
- Install Python and dependencies
- Run `python api.py`
- Configure domain and SSL

#### Option 3: Docker
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "api.py"]
```

### Deploy Frontend

#### Option 1: Netlify
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

#### Option 2: Vercel
```bash
npm install -g vercel
cd frontend
vercel
```

#### Option 3: Any Node.js Host
```bash
npm run build
npm start
```

## 🧪 Testing

### Test Backend

```bash
# Test with curl
curl http://localhost:8000/predict/Mumbai

# Visit Swagger UI
http://localhost:8000/docs
```

### Test Frontend

1. Visit `http://localhost:3000`
2. Grant location permission
3. Verify data loads
4. Test all three dashboards
5. Test refresh functionality

## 🐛 Troubleshooting

### Backend Issues

**Port already in use**
```bash
lsof -i :8000
kill -9 <PID>
```

**Module not found**
```bash
pip install -r requirements.txt
```

**API not responding**
- Check if backend is running
- Verify port 8000 is accessible
- Check firewall settings

### Frontend Issues

**Dependencies not installing**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port 3000 already in use**
```bash
npm run dev -- -p 3001
```

**Geolocation not working**
- Use HTTPS (required in production)
- Grant location permission
- Use modern browser

**API connection failed**
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend

## 📚 Documentation

- **QUICK_START.md** - Get started in 5 minutes
- **FRONTEND_SETUP.md** - Detailed frontend guide
- **IMPLEMENTATION_SUMMARY.md** - Implementation details
- **frontend/README.md** - Frontend documentation
- **Backend API Docs** - `http://localhost:8000/docs`

## 🔐 Security

### Best Practices Implemented

✅ Environment variables for sensitive data
✅ CORS enabled for frontend access
✅ Input validation with Pydantic
✅ Error handling and logging
✅ No hardcoded secrets
✅ HTTPS recommended for production

### Recommendations

- Use HTTPS in production
- Implement rate limiting
- Add authentication if needed
- Use environment variables for all secrets
- Regular security updates

## 📊 Performance

### Optimizations

- **Frontend**: Code splitting, lazy loading, CSS optimization
- **Backend**: Efficient data fetching, caching, async operations
- **Database**: Indexed queries, connection pooling
- **Network**: Gzip compression, CDN for static assets

## 🤝 Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - Feel free to use this project for any purpose.

## 📞 Support

For issues or questions:

1. Check the troubleshooting section
2. Review documentation files
3. Check browser console for errors
4. Verify backend is running
5. Check environment configuration

## 🎉 Summary

You now have a complete full-stack healthcare prediction system with:

✅ Python FastAPI backend with real-time predictions
✅ Next.js frontend with three interactive dashboards
✅ Real-time location detection and city estimation
✅ Beautiful responsive UI with Tailwind CSS
✅ Complete API integration
✅ Production-ready code
✅ Comprehensive documentation

**Ready to deploy!** 🚀

---

**Last Updated**: November 18, 2025
**Version**: 1.0.0
