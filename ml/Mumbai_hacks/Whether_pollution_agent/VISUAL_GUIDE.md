# Visual Guide - WeatherAgent Frontend

## 🎯 Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Visits Website                       │
│                  http://localhost:3000                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │      Landing Page (/)              │
        │  ┌──────────────────────────────┐  │
        │  │  Healthcare Risk & Resource  │  │
        │  │      Prediction System       │  │
        │  └──────────────────────────────┘  │
        │                                    │
        │  ┌─────────────┐ ┌──────────────┐ │
        │  │  Patient    │ │   Doctor     │ │
        │  │ Dashboard   │ │  Dashboard   │ │
        │  └─────────────┘ └──────────────┘ │
        │                                    │
        │  ┌──────────────────────────────┐  │
        │  │  Hospital Dashboard          │  │
        │  └──────────────────────────────┘  │
        └────────────────────────────────────┘
                    │    │    │
        ┌───────────┘    │    └───────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌──────────┐
    │Patient │      │Doctor  │      │Hospital  │
    │        │      │        │      │          │
    │Dashboard│      │Dashboard│      │Dashboard │
    └────────┘      └────────┘      └──────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    Request Location
                    (GPS Permission)
                         │
                         ▼
                    Estimate City
                    (Distance Calc)
                         │
                         ▼
                    API Call
                    /predict/{city}
                         │
                         ▼
                    Backend Processing
                         │
                         ▼
                    Return JSON Data
                         │
                         ▼
                    Render Dashboard
                    with Data
```

---

## 📱 Dashboard Layouts

### Patient Dashboard

```
┌─────────────────────────────────────────────────┐
│  ← Back                          🔄 Refresh      │
├─────────────────────────────────────────────────┤
│  ❤️  Patient Health Dashboard                   │
│  Your personalized air quality and health...    │
├─────────────────────────────────────────────────┤
│                                                 │
│  📍 Your Location                               │
│  ┌─────────────────────────────────────────┐   │
│  │ City: Mumbai          State: Maharashtra│   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  🌍 Air Quality Index                           │
│  ┌─────────────────────────────────────────┐   │
│  │ AQI: 147  [Color-coded gradient]        │   │
│  │ Status: Unhealthy for Sensitive Groups  │   │
│  │ PM2.5: 54.34 µg/m³                     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ⚠️  Your Health Recommendations                │
│  ┌─────────────────────────────────────────┐   │
│  │ "Air quality is unhealthy for sensitive │   │
│  │  groups in Mumbai (AQI 147). Wear a     │   │
│  │  mask if outdoors, especially if you    │   │
│  │  have respiratory conditions."          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ✓ Wear a mask when outdoors                   │
│  📊 Unhealthy for Sensitive Groups              │
│                                                 │
│  💡 Health Tips                                 │
│  🏥 Consult doctor if respiratory conditions   │
│  😷 Use N95 or KN95 masks                      │
│  💧 Stay hydrated                              │
│  🏃 Limit outdoor activities                   │
│                                                 │
│  Last updated: 2025-11-18 13:07:23             │
└─────────────────────────────────────────────────┘
```

### Doctor Dashboard

```
┌─────────────────────────────────────────────────┐
│  ← Back                          🔄 Refresh      │
├─────────────────────────────────────────────────┤
│  🩺 Doctor Clinical Dashboard                   │
│  Clinical alerts and patient surge predictions  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │ City: Mumbai │ │Risk: Moderate│ │Patients:│ │
│  │              │ │AQI: 147      │ │   71    │ │
│  └──────────────┘ └──────────────┘ └─────────┘ │
│                                                 │
│  ⚠️  Clinical Alert                             │
│  ┌─────────────────────────────────────────┐   │
│  │ "Expect 20-30% rise in asthma/COPD     │   │
│  │  cases. Prepare for 71 respiratory      │   │
│  │  patients in next 24 hours."            │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  📊 Patient Metrics          💡 Recommendations│
│  ┌─────────────────────┐     ┌──────────────┐ │
│  │Expected: 71         │     │✓ Keep inhalers│ │
│  │Surge: 0%            │     │📋 Review cases│ │
│  │PM2.5: 54.3 µg/m³    │     │⚠️ Monitor     │ │
│  └─────────────────────┘     │  closely      │ │
│                              └──────────────┘ │
│                                                 │
│  Last updated: 2025-11-18 13:07:23             │
└─────────────────────────────────────────────────┘
```

### Hospital Dashboard

```
┌─────────────────────────────────────────────────┐
│  ← Back                          🔄 Refresh      │
├─────────────────────────────────────────────────┤
│  🏥 Hospital Operations Dashboard               │
│  Resource management and capacity planning      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌─────┐ │
│  │City:     │ │AQI:    │ │Expected: │ │Risk:│ │
│  │Mumbai    │ │147     │ │71        │ │0%   │ │
│  └──────────┘ └────────┘ └──────────┘ └─────┘ │
│                                                 │
│  ⚠️  Operational Alert                          │
│  ┌─────────────────────────────────────────┐   │
│  │ "Stock inhalers and nebulizers. Prepare │   │
│  │  for mild OPD increase. Expected 71     │   │
│  │  patients. Open 2-3 additional beds."   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ⚡ Recommended Actions    📋 Alert Status      │
│  ┌──────────────────────┐  ┌──────────────────┐│
│  │Oxygen Increase: 10%  │  │Staff Alert: NO   ││
│  │Emergency Beds: 10    │  │Mask Advisory: YES││
│  └──────────────────────┘  └──────────────────┘│
│                                                 │
│  📊 Environmental Data                          │
│  PM2.5: 54.34 µg/m³  │  AQI: 147  │  State: MH│
│                                                 │
│  Last updated: 2025-11-18 13:07:23             │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### AQI Levels

```
AQI ≤ 50      → 🟢 GREEN       (Good)
AQI 51-100    → 🟡 YELLOW      (Moderate)
AQI 101-150   → 🟠 ORANGE      (Unhealthy for Sensitive Groups)
AQI 151-200   → 🔴 RED         (Unhealthy)
AQI 201-300   → 🟣 PURPLE      (Very Unhealthy)
AQI > 300     → 🔴 DARK RED    (Hazardous)
```

### Dashboard Themes

```
Patient Dashboard   → 🔵 Blue Gradient
Doctor Dashboard    → 🟢 Green Gradient
Hospital Dashboard  → 🟠 Orange Gradient
Landing Page        → 🟣 Purple Gradient
```

---

## 🔄 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                   User's Browser                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Geolocation API                                   │  │
│  │  Gets: latitude, longitude                         │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Location Utils (locationUtils.js)                │  │
│  │  Calculates distance to all cities                │  │
│  │  Returns: Nearest city name                       │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Axios HTTP Request                               │  │
│  │  GET /predict/{city}                              │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                         │
                         │ (Network)
                         │
┌──────────────────────────────────────────────────────────┐
│                   Backend Server                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  FastAPI (api.py)                                 │  │
│  │  Route: /predict/{city}                           │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Tools (tools.py)                                 │  │
│  │  • fetch_weather_api()                            │  │
│  │  • fetch_pollution_data()                         │  │
│  │  • predict_patient_count_and_surge()              │  │
│  │  • generate_dashboard_alerts()                    │  │
│  │  • generate_recommended_actions()                 │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Return JSON Response                             │  │
│  │  {                                                │  │
│  │    "status": "success",                           │  │
│  │    "city": "Mumbai",                              │  │
│  │    "aqi": 147.0,                                  │  │
│  │    "patient_dashboard": "...",                    │  │
│  │    "doctor_dashboard": "...",                     │  │
│  │    "hospital_dashboard": "...",                   │  │
│  │    ...                                            │  │
│  │  }                                                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                         │
                         │ (Network)
                         │
┌──────────────────────────────────────────────────────────┐
│                   User's Browser                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  React Component                                  │  │
│  │  Updates state with response data                 │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Render Dashboard                                 │  │
│  │  Display data with styling                        │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Interactive UI                                   │  │
│  │  User sees formatted dashboard                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 File Organization

```
frontend/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.js                 # Root layout
│   │   ├── page.js                   # Landing page
│   │   ├── patient/
│   │   │   └── page.js               # Patient route
│   │   ├── doctor/
│   │   │   └── page.js               # Doctor route
│   │   └── hospital/
│   │       └── page.js               # Hospital route
│   │
│   ├── components/                   # React Components
│   │   ├── PatientDashboard.js       # Patient logic
│   │   ├── DoctorDashboard.js        # Doctor logic
│   │   └── HospitalDashboard.js      # Hospital logic
│   │
│   ├── utils/                        # Utilities
│   │   └── locationUtils.js          # Location estimation
│   │
│   └── globals.css                   # Global styles
│
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── package.json                      # Dependencies
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind config
├── postcss.config.js                 # PostCSS config
├── jsconfig.json                     # JS config
├── .env.local                        # Environment vars
├── .gitignore                        # Git ignore
├── netlify.toml                      # Netlify config
└── README.md                         # Documentation
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Users                                │
│                  (Browsers)                             │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    ┌─────────┐              ┌──────────┐
    │ Netlify │              │  Vercel  │
    │ (CDN)   │              │  (CDN)   │
    └────┬────┘              └────┬─────┘
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Frontend (Next.js)   │
         │  • Patient Dashboard   │
         │  • Doctor Dashboard    │
         │  • Hospital Dashboard  │
         └────────────┬───────────┘
                      │
                      │ API Calls
                      │
                      ▼
         ┌────────────────────────┐
         │   Backend (FastAPI)    │
         │  • /predict/{city}     │
         │  • /cities             │
         │  • /docs               │
         └────────────┬───────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
    ┌─────────┐              ┌──────────┐
    │ Weather │              │Pollution │
    │  APIs   │              │  APIs    │
    └─────────┘              └──────────┘
```

---

## 📊 Component Hierarchy

```
App (Next.js)
│
├── layout.js
│   └── Metadata, Global Styles
│
├── page.js (Landing)
│   ├── Header
│   ├── Dashboard Cards (3)
│   ├── Features Section
│   └── Footer
│
├── patient/page.js
│   └── PatientDashboard
│       ├── Header (Back, Refresh)
│       ├── Location Card
│       ├── AQI Card
│       ├── Recommendations Card
│       ├── Health Tips
│       └── Footer
│
├── doctor/page.js
│   └── DoctorDashboard
│       ├── Header (Back, Refresh)
│       ├── Metrics Cards (3)
│       ├── Clinical Alert
│       ├── Patient Metrics
│       ├── Recommendations
│       └── Footer
│
└── hospital/page.js
    └── HospitalDashboard
        ├── Header (Back, Refresh)
        ├── Metrics Cards (4)
        ├── Operational Alert
        ├── Recommended Actions
        ├── Alert Status
        ├── Environmental Data
        └── Footer
```

---

## 🎯 Key Interactions

### User Clicks "Patient Dashboard"
```
1. Navigate to /patient
2. Component mounts
3. useEffect triggers
4. Request location permission
5. Get GPS coordinates
6. Estimate city
7. Call API
8. Display data
```

### User Clicks "Refresh"
```
1. Click refresh button
2. setLoading(true)
3. Fetch location again
4. Call API again
5. Update state
6. Re-render dashboard
```

### User Clicks "Back"
```
1. Click back button
2. Navigate to /
3. Landing page displays
```

---

**Last Updated**: November 18, 2025
**Version**: 1.0.0
