# Centralized Hospital Dashboard

## Overview
A centralized dashboard for city health officials to monitor real-time hospital capacity across all hospitals in the system.

## Features
- **Real-time Data**: Fetches anonymized bed availability and patient load data from all hospitals
- **City-wide Statistics**: Aggregated metrics including total beds, OPD load, and admissions
- **Hospital Details**: Individual hospital breakdowns with bed types, occupancy rates, and patient statistics
- **Visual Analytics**: Interactive charts showing occupancy rates and OPD load trends
- **Search & Filter**: Find hospitals by name/address and filter by occupancy status (high/medium/low)
- **Auto-refresh**: Data automatically refreshes every 5 minutes

## How to Access

### Option 1: Direct URL Access
1. Navigate to your application URL
2. Add `?admin=true` to the URL (e.g., `http://localhost:5173/?admin=true`)
3. The centralized dashboard will load automatically

### Option 2: Manual Login (Temporary)
Since the login UI doesn't have an admin option yet, you can manually trigger the admin dashboard:

1. Open browser console (F12)
2. Run the following code:
```javascript
localStorage.setItem('user', JSON.stringify({ role: 'admin', name: 'City Health Admin' }));
window.location.reload();
```

### Option 3: Backend API Direct Access
You can also access the API directly:
```
GET http://localhost:5000/api/hospitals/capacity
```

## API Endpoint

### GET /api/hospitals/capacity

Returns anonymized capacity and load information for all hospitals.

**Response Format:**
```json
{
  "updatedAt": "2026-01-21T00:00:00.000Z",
  "citySummary": {
    "totalBeds": 500,
    "occupiedBeds": 350,
    "availableBeds": 150,
    "todayAppointments": 120,
    "last7DaysAppointments": 840,
    "todayAdmissions": 45,
    "pendingAdmissions": 12,
    "admittedAdmissions": 33,
    "last7DaysAdmissions": 315
  },
  "hospitals": [
    {
      "id": "hospital_id",
      "name": "City General Hospital",
      "address": "123 Main St",
      "bedSummary": {
        "totalBeds": 100,
        "occupiedBeds": 70,
        "availableBeds": 30,
        "byType": [
          {
            "type": "ICU",
            "total": 20,
            "occupied": 15,
            "available": 5
          },
          {
            "type": "General",
            "total": 50,
            "occupied": 35,
            "available": 15
          },
          {
            "type": "Private",
            "total": 20,
            "occupied": 15,
            "available": 5
          },
          {
            "type": "Emergency",
            "total": 10,
            "occupied": 5,
            "available": 5
          }
        ]
      },
      "opdLoad": {
        "today": {
          "total": 25,
          "scheduled": 10,
          "completed": 12,
          "cancelled": 3
        },
        "last7Days": {
          "total": 175
        }
      },
      "admissionsLoad": {
        "today": 8,
        "pending": 2,
        "admitted": 6,
        "last7Days": 56
      }
    }
  ]
}
```

## Dashboard Features

### Summary Cards
- **Total Beds**: City-wide bed capacity with availability
- **OPD Today**: Today's OPD appointments across all hospitals
- **Admissions Today**: Today's hospital admissions
- **Active Hospitals**: Number of hospitals in the system with overall occupancy rate

### Charts
1. **Hospital Occupancy Rates**: Bar chart showing occupancy percentage for each hospital
2. **OPD Patient Load**: Line chart comparing today's OPD load vs last 7 days

### Hospital List
- Detailed cards for each hospital showing:
  - Bed summary (total, occupied, available)
  - Bed breakdown by type (ICU, General, Private, Emergency)
  - OPD statistics (scheduled, completed, cancelled)
  - Admission statistics (today, pending, admitted)
  - Occupancy status indicator (high ≥80%, medium ≥50%, low <50%)

### Search & Filter
- Search hospitals by name or address
- Filter by occupancy status:
  - **All**: Show all hospitals
  - **High Load**: Hospitals with ≥80% occupancy
  - **Medium**: Hospitals with 50-79% occupancy
  - **Low Load**: Hospitals with <50% occupancy

### Hospital Detail Modal
Click on any hospital card to view detailed information:
- Bed type breakdown with progress bars
- Complete OPD statistics
- Complete admission statistics

## Technical Details

### Frontend Component
- **Location**: `frontend/src/components/CentralizedDashboard.tsx`
- **API Service**: `frontend/src/services/centralizedApi.ts`
- **Dependencies**: React, Motion (Framer Motion), Recharts, Lucide React

### Backend Endpoint
- **Location**: `backend/routes/hospitals.js`
- **Route**: `GET /api/hospitals/capacity`
- **Authentication**: None required (public endpoint for city health dashboard)

### Data Privacy
All data is anonymized:
- No patient names or personal information
- Only aggregate counts and statistics
- Bed availability numbers only
- No sensitive medical information

## Future Enhancements
1. Add admin user authentication
2. Historical trend analysis
3. Predictive capacity alerts
4. Export data to CSV/PDF
5. Real-time notifications for critical capacity levels
6. Integration with emergency services
7. Bed transfer coordination between hospitals
