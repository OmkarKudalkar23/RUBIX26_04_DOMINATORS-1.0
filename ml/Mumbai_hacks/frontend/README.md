# Healthcare Risk & Resource Prediction - Frontend

A modern Next.js application with three interactive dashboards for patients, doctors, and hospital administrators to monitor air quality and healthcare resource predictions.

## Features

- **Patient Dashboard**: Personal air quality alerts and health recommendations
- **Doctor Dashboard**: Clinical alerts and patient surge predictions
- **Hospital Dashboard**: Resource management and operational planning
- **Real-time Location Detection**: Automatic city detection from user coordinates
- **Interactive UI**: Beautiful, responsive design with Tailwind CSS
- **Live Data**: Fetches real-time predictions from the backend API

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Language**: JavaScript (ES6+)

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local file with:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.js          # Root layout
│   │   ├── page.js            # Landing page
│   │   ├── patient/page.js    # Patient dashboard page
│   │   ├── doctor/page.js     # Doctor dashboard page
│   │   └── hospital/page.js   # Hospital dashboard page
│   ├── components/
│   │   ├── PatientDashboard.js
│   │   ├── DoctorDashboard.js
│   │   └── HospitalDashboard.js
│   ├── utils/
│   │   └── locationUtils.js   # Location estimation logic
│   └── globals.css            # Global styles
├── public/
│   └── index.html
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000`)

## Features in Detail

### Patient Dashboard
- Displays city and state
- Shows current AQI and PM2.5 levels
- Provides personalized health recommendations
- Mask advisory based on air quality
- Health tips and guidelines

### Doctor Dashboard
- Clinical alerts based on air quality
- Expected patient count for next 24 hours
- Surge probability percentage
- Risk level assessment
- Clinical recommendations
- Patient metrics overview

### Hospital Dashboard
- Operational alerts
- Resource recommendations (oxygen cylinders, emergency beds)
- Staff alert status
- Mask advisory status
- Environmental data summary
- Surge probability tracking

## API Integration

The frontend communicates with the backend API at `/predict/{city}` endpoint:

```javascript
GET /predict/{city}
```

Returns:
```json
{
  "status": "success",
  "city": "Mumbai",
  "state": "Maharashtra",
  "aqi": 147.0,
  "pm25": 54.34,
  "expected_patients_next_24h": 71,
  "surge_probability": 0.0,
  "timestamp": "2025-11-18T13:07:23.123320Z",
  "patient_dashboard": "...",
  "doctor_dashboard": "...",
  "hospital_dashboard": "...",
  "recommended_actions": {...}
}
```

## Deployment

### Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variable: `NEXT_PUBLIC_API_URL`

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Requires Geolocation API support

## License

MIT
