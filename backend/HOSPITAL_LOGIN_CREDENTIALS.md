# Hospital Dashboard - Login Credentials & Quick Start

## 🔑 Login Credentials

### Test Hospital Account
- **Email:** `hospital@test.com`
- **Password:** `Password@123`
- **Role:** `hospital`
- **Hospital Name:** City General Hospital

## 📊 Sample Data Included

After running the seed script, the following data is available:

### Beds (4 types)
- **ICU:** 50 total, 38 occupied, 12 available
- **General:** 200 total, 145 occupied, 55 available
- **Private:** 80 total, 62 occupied, 18 available
- **Emergency:** 30 total, 22 occupied, 8 available

### Doctor Slots (3 doctors)
- **Dr. Sarah Mitchell** (Pulmonology, Respiratory) - 6 slots
- **Dr. James Wilson** (Cardiology, Cardiac) - 5 slots
- **Dr. Emily Chen** (General Medicine, General) - 6 slots

### Staff (8 members)
- Alice Johnson (Nurse, ICU, Morning, active)
- Bob Smith (Technician, Radiology, Evening, active)
- Carol White (Nurse, Emergency, Night, active)
- David Brown (Support, General, Morning, on-leave)
- Emma Davis (Admin, Administration, Morning, active)
- Frank Miller (Nurse, Cardiac, Evening, active)
- Grace Wilson (Technician, Laboratory, Night, off-duty)
- Henry Taylor (Support, Maintenance, Morning, active)

### Surge Alerts (4 alerts)
1. **High Air Pollution Alert** (pollution, high severity, Respiratory, +40% expected)
2. **Dengue Season Alert** (seasonal, medium severity, General, +25% expected)
3. **Heat Wave Expected** (weather, low severity, Emergency, +15% expected)
4. **Flu Season Peak** (epidemic, high severity, General, +35% expected)

### Environment Data
- **AQI:** 320
- **Temperature:** 38°C
- **Humidity:** 65%
- **Pollution Level:** Very Poor
- **Festival Flag:** false

### Appointments (4 appointments for today)
1. John Doe with Dr. Sarah Mitchell (09:00 AM, scheduled, OPD)
2. Jane Smith with Dr. Sarah Mitchell (10:30 AM, scheduled, Follow-up)
3. Robert Brown with Dr. James Wilson (03:00 PM, scheduled, OPD)
4. Alice Johnson with Dr. Emily Chen (09:00 AM, completed, OPD)

## 🚀 Quick Start

### Step 1: Seed the Database
```bash
cd Mumbai_hacks/backend
node scripts/seedHospitalDashboard.js
```

### Step 2: Start Backend Server
```bash
cd Mumbai_hacks/backend
npm start
```

Look for:
```
✅ MongoDB connected
✅ Hospital routes registered
🚀 Server running on port 5000
```

### Step 3: Start Frontend
```bash
cd Mumbai_hacks/Mumbai_hacks
npm run dev
```

### Step 4: Login
1. Go to login page
2. Enter:
   - Email: `hospital@test.com`
   - Password: `Password@123`
3. You'll see the Hospital Dashboard with all sample data loaded!

## ✅ What Works

- ✅ All data loads from MongoDB (no hardcoded data)
- ✅ Bed management (update counts, occupy/release)
- ✅ Doctor slot management (toggle available/blocked)
- ✅ Staff management (update status, delete)
- ✅ Surge alerts display
- ✅ Environment data display
- ✅ Appointments display
- ✅ Settings (change password, update profile)
- ✅ All changes persist after refresh

## 📝 Notes

- All dates use today's date dynamically
- Changes are saved to MongoDB immediately
- No localStorage dependency - everything comes from backend
- JWT authentication required for all operations

