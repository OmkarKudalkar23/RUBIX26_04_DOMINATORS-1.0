# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Backend API

```bash
# From the WeatherAgent root directory
python api.py
```

The API will run on `http://localhost:8000`

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Start the Frontend

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### Step 4: Open in Browser

Visit `http://localhost:3000` and select a dashboard!

---

## 📊 Dashboard Overview

### Patient Dashboard (`/patient`)
- **What**: Personal health recommendations based on air quality
- **Who**: Patients and general public
- **Shows**: AQI, PM2.5, health tips, mask advisory
- **URL**: `http://localhost:3000/patient`

### Doctor Dashboard (`/doctor`)
- **What**: Clinical alerts and patient surge predictions
- **Who**: Healthcare professionals
- **Shows**: Expected patients, surge probability, clinical alerts
- **URL**: `http://localhost:3000/doctor`

### Hospital Dashboard (`/hospital`)
- **What**: Resource management and operational planning
- **Who**: Hospital administrators
- **Shows**: Resource recommendations, staff alerts, bed requirements
- **URL**: `http://localhost:3000/hospital`

---

## 🔧 Configuration

### Environment Variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, change to your deployed API URL.

---

## 📁 Project Structure

```
WeatherAgent/
├── api.py                    # Backend API (FastAPI)
├── server.py                 # Alternative server
├── requirements.txt          # Python dependencies
├── Whether_pollution_agent/  # Backend logic
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js      # Landing page
│   │   │   ├── patient/
│   │   │   ├── doctor/
│   │   │   └── hospital/
│   │   ├── components/
│   │   └── utils/
│   ├── package.json
│   └── next.config.js
├── FRONTEND_SETUP.md         # Detailed frontend guide
└── QUICK_START.md            # This file
```

---

## 🌍 How It Works

1. **User visits dashboard** → Requests location permission
2. **Browser detects location** → Gets GPS coordinates
3. **Frontend estimates city** → Uses distance calculation
4. **API is called** → `/predict/{city}`
5. **Data is displayed** → Role-specific dashboard shown

---

## 🎨 Features

✅ **Real-time Location Detection** - Automatic GPS-based city detection
✅ **Three Role-Specific Dashboards** - Patient, Doctor, Hospital
✅ **Beautiful UI** - Modern design with Tailwind CSS
✅ **Interactive Charts** - Color-coded AQI levels
✅ **Responsive Design** - Works on mobile, tablet, desktop
✅ **Real-time Data** - Live predictions from backend

---

## 🐛 Troubleshooting

### "Cannot find module 'next'"
```bash
cd frontend
npm install
```

### "Failed to fetch prediction data"
- Verify backend is running: `http://localhost:8000`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

### "Geolocation not supported"
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Grant location permission when prompted

### "Port 3000 already in use"
```bash
npm run dev -- -p 3001
```

---

## 📚 Documentation

- **Backend**: See `api.py` and `Whether_pollution_agent/`
- **Frontend**: See `frontend/README.md` and `FRONTEND_SETUP.md`
- **API Docs**: Visit `http://localhost:8000/docs` (Swagger UI)

---

## 🚢 Deployment

### Deploy Frontend to Netlify

1. Push code to GitHub
2. Connect repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add env var: `NEXT_PUBLIC_API_URL=<your-api-url>`

### Deploy Backend

See backend documentation for deployment options.

---

## 💡 Tips

- **Enable Location**: Browser will ask for permission - allow it!
- **Use HTTPS**: Required for Geolocation in production
- **Check Console**: Browser console shows helpful debug info
- **API Docs**: Visit `http://localhost:8000/docs` for API details

---

## 📞 Support

For issues:
1. Check browser console (F12)
2. Verify backend is running
3. Check environment variables
4. Review detailed guides in `FRONTEND_SETUP.md`

---

## 🎯 Next Steps

1. ✅ Start backend: `python api.py`
2. ✅ Start frontend: `npm run dev`
3. ✅ Visit `http://localhost:3000`
4. ✅ Grant location permission
5. ✅ Explore dashboards!

Happy coding! 🎉
