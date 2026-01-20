# Frontend Setup Guide

## Overview

The Next.js frontend provides three interactive dashboards:
1. **Patient Dashboard** - Health recommendations and air quality alerts
2. **Doctor Dashboard** - Clinical alerts and patient surge predictions
3. **Hospital Dashboard** - Resource management and operational planning

## Prerequisites

- Node.js 16+ and npm 7+
- Backend API running on `http://localhost:8000`
- Modern web browser with Geolocation API support

## Installation Steps

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- Tailwind CSS
- Lucide React (icons)
- Axios (HTTP client)

### 3. Configure Environment

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production deployment, update this to your deployed API URL.

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### Landing Page
- Visit `http://localhost:3000`
- Choose one of three dashboards
- Each dashboard will request location permission

### Patient Dashboard (`/patient`)
- Displays your location (city, state)
- Shows current AQI and PM2.5 levels
- Provides personalized health recommendations
- Suggests mask usage based on air quality
- Includes health tips

### Doctor Dashboard (`/doctor`)
- Shows clinical alerts
- Displays expected patient count for next 24 hours
- Shows surge probability
- Provides clinical recommendations
- Displays patient metrics

### Hospital Dashboard (`/hospital`)
- Shows operational alerts
- Displays resource recommendations:
  - Oxygen cylinder increase percentage
  - Emergency beds to open
- Shows staff alert status
- Displays mask advisory status
- Environmental data summary

## Building for Production

### Build the Application

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Start Production Server

```bash
npm start
```

## Deployment Options

### Option 1: Deploy to Netlify

1. **Connect Repository**
   - Push code to GitHub
   - Connect repository to Netlify

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Set Environment Variables**
   - Add `NEXT_PUBLIC_API_URL` in Netlify dashboard
   - Set to your deployed API URL

4. **Deploy**
   - Netlify will automatically deploy on push

### Option 2: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Configure Environment**
   - Set `NEXT_PUBLIC_API_URL` in Vercel dashboard

### Option 3: Deploy to Any Node.js Host

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Upload to server**
   - Upload `.next`, `public`, `package.json`, `package-lock.json`

3. **Install and run**
   ```bash
   npm install --production
   npm start
   ```

## Troubleshooting

### Issue: "Geolocation not supported"
- **Solution**: Use a modern browser (Chrome, Firefox, Safari, Edge)
- Ensure HTTPS is used (required for Geolocation API)

### Issue: "Failed to fetch prediction data"
- **Solution**: 
  - Verify backend API is running on `http://localhost:8000`
  - Check `NEXT_PUBLIC_API_URL` in `.env.local`
  - Verify CORS is enabled in backend

### Issue: "Unable to access location"
- **Solution**:
  - Grant location permission when prompted
  - Check browser location settings
  - Ensure HTTPS is used in production

### Issue: Tailwind styles not loading
- **Solution**:
  - Run `npm install` to ensure all dependencies are installed
  - Restart dev server: `npm run dev`
  - Clear `.next` folder: `rm -rf .next`

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.js              # Root layout with metadata
│   │   ├── page.js                # Landing page
│   │   ├── patient/page.js        # Patient dashboard route
│   │   ├── doctor/page.js         # Doctor dashboard route
│   │   └── hospital/page.js       # Hospital dashboard route
│   ├── components/
│   │   ├── PatientDashboard.js    # Patient dashboard component
│   │   ├── DoctorDashboard.js     # Doctor dashboard component
│   │   └── HospitalDashboard.js   # Hospital dashboard component
│   ├── utils/
│   │   └── locationUtils.js       # Location estimation utilities
│   └── globals.css                # Global Tailwind styles
├── public/
│   ├── index.html
│   └── favicon.ico
├── package.json                   # Dependencies
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── jsconfig.json                  # JavaScript configuration
├── .env.local                     # Environment variables (local)
├── .gitignore                     # Git ignore rules
├── netlify.toml                   # Netlify deployment config
└── README.md                      # Documentation
```

## Key Features

### Real-time Location Detection
- Automatically detects user's GPS coordinates
- Estimates nearest city using distance calculation
- Fetches city-specific predictions

### Interactive UI
- Beautiful gradient backgrounds
- Smooth animations and transitions
- Responsive design (mobile, tablet, desktop)
- Dark theme with accent colors

### Data Visualization
- Color-coded AQI levels
- Progress indicators
- Status badges
- Metric cards

### Role-Specific Information
- **Patients**: Health recommendations and tips
- **Doctors**: Clinical alerts and patient metrics
- **Hospitals**: Resource recommendations and operational alerts

## API Integration

The frontend communicates with the backend `/predict/{city}` endpoint:

```javascript
GET /predict/{city}
```

**Response Format:**
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
  "patient_dashboard": "Air quality is unhealthy...",
  "doctor_dashboard": "Expect 20-30% rise...",
  "hospital_dashboard": "Stock inhalers and nebulizers...",
  "recommended_actions": {
    "oxygen_cylinder_increase_percent": 10,
    "emergency_beds_to_open": 10,
    "staff_alert_required": false,
    "mask_advisory": true
  }
}
```

## Performance Optimization

- **Code Splitting**: Next.js automatically splits code by route
- **Image Optimization**: Built-in image optimization
- **CSS Optimization**: Tailwind CSS purges unused styles
- **Lazy Loading**: Components load on demand

## Security

- **Environment Variables**: Sensitive data stored in `.env.local`
- **CORS**: Backend should have CORS enabled
- **HTTPS**: Required for Geolocation API in production
- **No Hardcoded Secrets**: API keys not exposed in frontend code

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend API logs
3. Check browser console for errors
4. Verify environment configuration

## License

MIT
