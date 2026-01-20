# 🏥 Centralized Hospital Dashboard - Quick Start Guide

## What is This?

A **real-time city-wide hospital capacity monitoring dashboard** that displays:
- 📊 Bed availability across all hospitals
- 🏥 OPD (Outpatient Department) patient load
- 🚑 Hospital admission statistics
- 📈 Interactive charts and analytics
- 🔍 Search and filter capabilities

## 🎯 Quick Access (3 Easy Steps)

### Step 1: Make Sure Servers are Running

**Backend** (Terminal 1):
```bash
cd backend
npm start
```
✅ Should see: "Server running on port 5000"

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```
✅ Should see: "Local: http://localhost:5173"

### Step 2: Access the Dashboard

**Option A - Use the HTML Page (Easiest)**:
1. Open `access-dashboard.html` in your browser
2. Click "Access Dashboard" button
3. Done! 🎉

**Option B - Browser Console**:
1. Open http://localhost:5173
2. Press F12 to open console
3. Paste this code:
```javascript
localStorage.setItem('user', JSON.stringify({ role: 'admin', name: 'City Health Admin' }));
window.location.reload();
```
4. Press Enter

### Step 3: Explore the Dashboard

You'll see:
- ✨ **Summary Cards**: Total beds, OPD load, admissions, active hospitals
- 📊 **Charts**: Occupancy rates and patient load trends
- 🔍 **Search Bar**: Find hospitals by name or address
- 🏥 **Hospital Cards**: Detailed information for each hospital
- 🎯 **Filters**: View hospitals by occupancy level (High/Medium/Low)

## 🎨 Dashboard Preview

![Dashboard Preview](C:/Users/Omkar Kudalkar/.gemini/antigravity/brain/cf2bda47-4b89-4662-bdb5-fa0cd6d7d62b/centralized_dashboard_preview_1768938204932.png)

## 📁 What Was Created

### New Files:
1. `frontend/src/components/CentralizedDashboard.tsx` - Main dashboard component
2. `frontend/src/services/centralizedApi.ts` - API service
3. `access-dashboard.html` - Quick access page
4. `CENTRALIZED_DASHBOARD_GUIDE.md` - Detailed documentation
5. `CENTRALIZED_DASHBOARD_IMPLEMENTATION.md` - Technical details

### Modified Files:
1. `frontend/src/App.tsx` - Added admin routing

### Existing Backend:
- `backend/routes/hospitals.js` - Already has the `/api/hospitals/capacity` endpoint

## 🔧 API Endpoint

The dashboard fetches data from:
```
GET http://localhost:5000/api/hospitals/capacity
```

Test it directly:
```bash
curl http://localhost:5000/api/hospitals/capacity
```

## ✨ Features

### Summary Cards (Top Row)
- **Total Beds**: City-wide bed capacity with availability count
- **OPD Today**: Today's outpatient appointments across all hospitals
- **Admissions Today**: New hospital admissions today
- **Active Hospitals**: Number of hospitals with overall occupancy rate

### Interactive Charts
- **Hospital Occupancy Rates**: Bar chart showing each hospital's occupancy percentage
- **OPD Patient Load**: Line chart comparing today vs last 7 days

### Hospital List
Each hospital card shows:
- Hospital name and address
- Bed summary (total, occupied, available)
- Bed types (ICU, General, Private, Emergency)
- OPD statistics (scheduled, completed, cancelled)
- Admission statistics (today, pending, admitted)
- Occupancy status indicator (color-coded)

### Search & Filter
- **Search**: Find hospitals by name or address
- **Filter by Occupancy**:
  - 🔴 High Load (≥80% occupancy)
  - 🟠 Medium (50-79% occupancy)
  - 🟢 Low Load (<50% occupancy)
  - ⚪ All hospitals

### Auto-Refresh
- Data automatically refreshes every 5 minutes
- Manual refresh button available in header

## 🎯 Use Cases

1. **Capacity Planning**: See which hospitals have available beds
2. **Emergency Coordination**: Quickly identify hospitals with capacity during emergencies
3. **Resource Allocation**: Monitor OPD load to allocate staff efficiently
4. **Trend Analysis**: Track occupancy patterns over time
5. **Inter-Hospital Coordination**: Facilitate patient transfers between hospitals

## 🔒 Data Privacy

All data is **anonymized**:
- ✅ No patient names or personal information
- ✅ Only aggregate statistics
- ✅ Hospital-level data only
- ✅ Compliant with healthcare privacy standards

## 🐛 Troubleshooting

### Dashboard Not Loading?
1. Check backend is running: `http://localhost:5000/api/hospitals/capacity`
2. Check frontend is running: `http://localhost:5173`
3. Clear browser cache and localStorage
4. Try the HTML access page again

### No Hospital Data?
1. Ensure hospitals exist in database
2. Check backend console for errors
3. Verify database connection
4. Check if hospitals have bed data

### Charts Not Showing?
1. Ensure there's data from multiple hospitals
2. Check browser console for errors
3. Try refreshing the page

## 📚 Documentation

For more details, see:
- `CENTRALIZED_DASHBOARD_GUIDE.md` - Complete feature documentation
- `CENTRALIZED_DASHBOARD_IMPLEMENTATION.md` - Technical implementation details

## 🎨 Design

The dashboard features:
- **Modern UI**: Glass-morphism with gradient backgrounds
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: Clear typography and color contrast
- **Animated**: Smooth transitions and hover effects
- **Professional**: Medical dashboard aesthetic

## 🚀 Next Steps

Want to enhance the dashboard? Consider adding:
1. Admin authentication system
2. Historical trend analysis
3. Predictive capacity alerts
4. Export to CSV/PDF
5. Real-time WebSocket updates
6. Bed transfer coordination
7. Emergency alert system

## 💡 Tips

- **Bookmark** the `access-dashboard.html` page for quick access
- **Refresh** data manually using the refresh button in the header
- **Click** on any hospital card to see detailed information
- **Use filters** to quickly find hospitals with specific occupancy levels
- **Search** by hospital name or address for quick lookup

## ✅ Success Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Opened `access-dashboard.html` in browser
- [ ] Clicked "Access Dashboard" button
- [ ] Dashboard loaded with hospital data
- [ ] Can see summary cards with statistics
- [ ] Charts are displaying correctly
- [ ] Can search and filter hospitals
- [ ] Can click hospitals to view details

---

**Need Help?** Check the detailed documentation in `CENTRALIZED_DASHBOARD_GUIDE.md`

**Built with** ❤️ for city health officials to monitor hospital capacity in real-time!
