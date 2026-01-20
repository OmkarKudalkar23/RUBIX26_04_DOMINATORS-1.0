# Hospital Dashboard Backend Integration - Complete Documentation

## Overview
The Hospital Dashboard has been fully integrated with the backend, removing all hardcoded frontend data and connecting it to MongoDB via RESTful APIs. All hospital operations (beds, doctor slots, staff, surge alerts, environment data, appointments) are now persisted in the database.

## What Was Implemented

### 1. Backend Models

Created 6 new Mongoose models in `backend/models/`:

#### `HospitalBed.js`
- **Purpose**: Track bed availability by type
- **Fields**:
  - `hospitalId` (ObjectId, ref: Hospital) - Required
  - `type` (enum: "ICU" | "General" | "Private" | "Emergency") - Required
  - `total` (Number) - Total beds of this type
  - `occupied` (Number) - Currently occupied beds
  - `available` (Number) - Calculated as total - occupied
- **Features**: Pre-save hook ensures `available` is always in sync

#### `HospitalDoctorSlot.js`
- **Purpose**: Manage doctor appointment slots
- **Fields**:
  - `hospitalId` (ObjectId, ref: Hospital) - Required
  - `doctorName` (String) - Required
  - `specialization` (String) - Required
  - `department` (String) - Required
  - `date` (String, format: "YYYY-MM-DD") - Required
  - `slots` (Array of subdocuments):
    - `time` (String, e.g., "09:00 AM")
    - `status` (enum: "available" | "booked" | "blocked")
    - `patientName` (String, optional)

#### `HospitalStaff.js`
- **Purpose**: Track hospital staff members
- **Fields**:
  - `hospitalId` (ObjectId, ref: Hospital) - Required
  - `name` (String) - Required
  - `role` (enum: "Nurse" | "Technician" | "Support" | "Admin") - Required
  - `department` (String) - Required
  - `shift` (enum: "Morning" | "Evening" | "Night") - Required
  - `status` (enum: "active" | "on-leave" | "off-duty") - Default: "active"

#### `HospitalSurgeAlert.js`
- **Purpose**: Store surge prediction alerts
- **Fields**:
  - `hospitalId` (ObjectId, ref: Hospital) - Required
  - `type` (enum: "pollution" | "seasonal" | "epidemic" | "weather") - Required
  - `severity` (enum: "low" | "medium" | "high") - Required
  - `title` (String) - Required
  - `message` (String) - Required
  - `prediction` (String) - Required
  - `date` (String, format: "YYYY-MM-DD") - Required
  - `department` (String) - Required
  - `expectedIncrease` (Number) - Percentage increase expected
  - `recommendations` (Array of Strings) - Action items

#### `HospitalEnvironment.js`
- **Purpose**: Store environmental data (one document per hospital)
- **Fields**:
  - `hospitalId` (ObjectId, ref: Hospital) - Required, Unique
  - `aqi` (Number) - Air Quality Index
  - `temperature` (Number) - Temperature in Celsius
  - `humidity` (Number) - Humidity percentage
  - `pollutionLevel` (enum: "Good" | "Moderate" | "Poor" | "Very Poor" | "Severe") - Required
  - `festivalFlag` (Boolean) - Whether festival season is active

#### `HospitalAppointment.js`
- **Purpose**: Track hospital appointments
- **Fields**:
  - `hospitalId` (ObjectId, ref: Hospital) - Required
  - `patientName` (String) - Required
  - `doctorName` (String) - Required
  - `department` (String) - Required
  - `date` (String, format: "YYYY-MM-DD") - Required
  - `time` (String) - Required
  - `status` (enum: "scheduled" | "completed" | "cancelled") - Default: "scheduled"
  - `type` (enum: "OPD" | "Emergency" | "Follow-up") - Required

### 2. Backend Routes

Created `backend/routes/hospital.js` with the following endpoints (all require JWT authentication and "hospital" role):

#### Beds Management
- **GET `/api/hospital/beds`**
  - Returns all beds for the logged-in hospital
  - Response: Array of bed objects with `id`, `type`, `total`, `occupied`, `available`

- **PATCH `/api/hospital/beds/:id`**
  - Updates bed counts
  - Body options:
    - `{ total: number }` - Update total beds
    - `{ occupied: number }` - Update occupied count
    - `{ action: "occupy" }` - Increment occupied by 1
    - `{ action: "release" }` - Decrement occupied by 1
  - Automatically recalculates `available = total - occupied`
  - Response: Updated bed object

#### Doctor Slots Management
- **GET `/api/hospital/doctor-slots`**
  - Returns all doctor slots for the hospital
  - Response: Array of doctor slot objects with slots array

- **PATCH `/api/hospital/doctor-slots/:doctorSlotId/slots/:slotIndex`**
  - Toggles slot status between "available" and "blocked"
  - Cannot modify "booked" slots (returns 400 error)
  - Response: Updated doctor slot object

#### Staff Management
- **GET `/api/hospital/staff`**
  - Returns all staff members for the hospital
  - Response: Array of staff objects

- **PATCH `/api/hospital/staff/:id/status`**
  - Updates staff status
  - Body: `{ status: "active" | "on-leave" | "off-duty" }`
  - Response: Updated staff object

- **DELETE `/api/hospital/staff/:id`**
  - Deletes a staff member
  - Response: `{ success: true, message: "..." }`

- **POST `/api/hospital/staff`**
  - Creates a new staff member
  - Body: `{ name, role, department, shift, status? }`
  - Response: Created staff object

#### Surge Alerts
- **GET `/api/hospital/surge-alerts`**
  - Returns all surge alerts for the hospital
  - Sorted by date (newest first) and severity
  - Response: Array of alert objects

#### Environment Data
- **GET `/api/hospital/environment`**
  - Returns environment data for the hospital
  - Creates default data if none exists
  - Response: Environment object

#### Appointments
- **GET `/api/hospital/appointments`**
  - Returns all appointments for the hospital
  - Optional query: `?date=YYYY-MM-DD` to filter by date
  - Response: Array of appointment objects

#### Profile & Settings
- **PATCH `/api/hospital/profile`**
  - Updates hospital profile
  - Body: `{ hospitalName?, email?, phone?, address? }`
  - Also updates user email if provided
  - Response: Updated profile object

- **POST `/api/hospital/change-password`**
  - Changes hospital user password
  - Body: `{ currentPassword, newPassword }`
  - Verifies current password before updating
  - Response: `{ success: true, message: "..." }`

### 3. Authentication & Authorization

All routes use:
- `authenticate` middleware - Verifies JWT token from `Authorization: Bearer <token>` header
- `requireRole('hospital')` middleware - Ensures user has "hospital" role
- `req.user.id` - Contains the logged-in user's ID
- Hospital lookup via `Hospital.findOne({ userId: req.user.id })`

### 4. Frontend Integration

#### API Functions (`src/services/api.ts`)
Added typed functions matching backend endpoints:
- `getHospitalBeds()` → `BedData[]`
- `updateHospitalBed(id, payload)` → `BedData`
- `getHospitalDoctorSlots()` → `DoctorSlot[]`
- `toggleHospitalDoctorSlot(doctorSlotId, slotIndex)` → `DoctorSlot`
- `getHospitalStaff()` → `StaffMember[]`
- `updateHospitalStaffStatus(id, status)` → `StaffMember`
- `deleteHospitalStaff(id)` → `void`
- `createHospitalStaff(staff)` → `StaffMember`
- `getHospitalSurgeAlerts()` → `SurgeAlert[]`
- `getHospitalEnvironment()` → `EnvironmentalData`
- `getHospitalAppointments(date?)` → `HospitalAppointment[]`
- `updateHospitalProfile(profile)` → `any`
- `changeHospitalPassword(payload)` → `any`

All functions:
- Include JWT token from `localStorage.getItem('token')`
- Handle errors with try/catch
- Use proper TypeScript interfaces

#### HospitalDashboard.tsx Refactoring
**Removed:**
- All hardcoded mock data arrays (beds, doctorSlots, staff, surgeAlerts, appointments)
- Hardcoded `environmentalData` object
- Local state manipulation in handlers
- Hardcoded date "2025-11-26" for today's appointments

**Added:**
- `useEffect` hook to fetch all data on component mount using `Promise.all()`
- Loading state (`isLoading`) and error state (`error`)
- Loading spinner and error message display
- API calls in all handlers:
  - `handleUpdateBedCount` → calls `updateHospitalBed`
  - `handleOccupyBed` → calls `updateHospitalBed` with `action: "occupy"`
  - `handleReleaseBed` → calls `updateHospitalBed` with `action: "release"`
  - `handleToggleSlot` → calls `toggleHospitalDoctorSlot`
  - `handleUpdateStaffStatus` → calls `updateHospitalStaffStatus`
  - `handleDeleteStaff` → calls `deleteHospitalStaff`
  - `handleChangePassword` → calls `changeHospitalPassword`
  - `handleUpdateProfile` → calls `updateHospitalProfile`
- Null checks for `environmentalData` (can be null until loaded)
- Dynamic date calculation for `todayAppointments` using `new Date().toISOString().split('T')[0]`
- Guard against division by zero in statistics calculations

### 5. Seed Script

Created `backend/scripts/seedHospitalDashboard.js` that:

1. **Creates Hospital User:**
   - Email: `hospital@test.com`
   - Password: `Password@123`
   - Role: `hospital`
   - Name: "City General Hospital"

2. **Creates Hospital Profile:**
   - Name: "City General Hospital"
   - Phone: "+1 (555) 987-6543"
   - Address: "123 Healthcare Blvd, Medical District"

3. **Creates Sample Data:**
   - **4 Bed Types:**
     - ICU: 50 total, 38 occupied, 12 available
     - General: 200 total, 145 occupied, 55 available
     - Private: 80 total, 62 occupied, 18 available
     - Emergency: 30 total, 22 occupied, 8 available

   - **3 Doctor Slots** (for today's date):
     - Dr. Sarah Mitchell (Pulmonology, Respiratory) - 6 slots
     - Dr. James Wilson (Cardiology, Cardiac) - 5 slots
     - Dr. Emily Chen (General Medicine, General) - 6 slots

   - **8 Staff Members:**
     - Alice Johnson (Nurse, ICU, Morning, active)
     - Bob Smith (Technician, Radiology, Evening, active)
     - Carol White (Nurse, Emergency, Night, active)
     - David Brown (Support, General, Morning, on-leave)
     - Emma Davis (Admin, Administration, Morning, active)
     - Frank Miller (Nurse, Cardiac, Evening, active)
     - Grace Wilson (Technician, Laboratory, Night, off-duty)
     - Henry Taylor (Support, Maintenance, Morning, active)

   - **4 Surge Alerts:**
     - High Air Pollution Alert (pollution, high, Respiratory, +40%)
     - Dengue Season Alert (seasonal, medium, General, +25%)
     - Heat Wave Expected (weather, low, Emergency, +15%)
     - Flu Season Peak (epidemic, high, General, +35%)

   - **Environment Data:**
     - AQI: 320
     - Temperature: 38°C
     - Humidity: 65%
     - Pollution Level: "Very Poor"
     - Festival Flag: false

   - **4 Appointments** (for today's date):
     - John Doe with Dr. Sarah Mitchell (09:00 AM, scheduled, OPD)
     - Jane Smith with Dr. Sarah Mitchell (10:30 AM, scheduled, Follow-up)
     - Robert Brown with Dr. James Wilson (03:00 PM, scheduled, OPD)
     - Alice Johnson with Dr. Emily Chen (09:00 AM, completed, OPD)

## Login Credentials

### Test Hospital Account
- **Email:** `hospital@test.com`
- **Password:** `Password@123`
- **Role:** `hospital`

## How to Use

### 1. Seed the Database
```bash
cd Mumbai_hacks/backend
node scripts/seedHospitalDashboard.js
```

This will:
- Create the hospital user account
- Create the hospital profile
- Populate all sample data (beds, slots, staff, alerts, environment, appointments)

### 2. Start Backend Server
```bash
cd Mumbai_hacks/backend
npm start
```

You should see:
```
✅ MongoDB connected
✅ Hospital routes registered
🚀 Server running on port 5000
```

### 3. Start Frontend
```bash
cd Mumbai_hacks/Mumbai_hacks
npm run dev
```

### 4. Login
1. Navigate to the login page
2. Enter:
   - Email: `hospital@test.com`
   - Password: `Password@123`
3. You'll be redirected to the Hospital Dashboard

### 5. Test Features

#### Bed Management
- View all bed types and availability
- Click on a bed card to see details
- Use +/- buttons to update total bed count
- Click "Occupy Bed" to mark a bed as occupied
- Click "Release Bed" to free up a bed
- Changes persist after page refresh

#### Doctor Slots
- View all doctor schedules
- Click on available/blocked slots to toggle status
- Booked slots cannot be modified (shows error toast)
- Changes persist after page refresh

#### Staff Management
- View all staff members
- Click on a staff member to see details
- Change status: Active ↔ On Leave ↔ Off Duty
- Delete staff members
- Changes persist after page refresh

#### Surge Alerts
- View all active surge alerts
- See severity levels (high/medium/low)
- View recommendations for each alert
- Alerts are sorted by date and severity

#### Environment Data
- View current AQI, temperature, humidity
- See pollution level status
- Check festival flag status

#### Appointments
- View all appointments
- Filter by date (today's appointments shown by default)
- See appointment status (scheduled/completed/cancelled)

#### Settings
- Change password (requires current password)
- Update hospital profile (name, email, phone, address)
- Toggle dark mode
- Change language

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hospital/beds` | Get all beds |
| PATCH | `/api/hospital/beds/:id` | Update bed counts |
| GET | `/api/hospital/doctor-slots` | Get all doctor slots |
| PATCH | `/api/hospital/doctor-slots/:id/slots/:index` | Toggle slot status |
| GET | `/api/hospital/staff` | Get all staff |
| PATCH | `/api/hospital/staff/:id/status` | Update staff status |
| DELETE | `/api/hospital/staff/:id` | Delete staff member |
| POST | `/api/hospital/staff` | Create staff member |
| GET | `/api/hospital/surge-alerts` | Get surge alerts |
| GET | `/api/hospital/environment` | Get environment data |
| GET | `/api/hospital/appointments` | Get appointments |
| PATCH | `/api/hospital/profile` | Update profile |
| POST | `/api/hospital/change-password` | Change password |

## Data Flow

1. **User logs in** → JWT token stored in `localStorage`
2. **Dashboard loads** → `useEffect` fetches all data in parallel
3. **User interacts** → Handler calls API → Updates local state → Shows toast
4. **Page refresh** → Data re-fetched from backend (no localStorage dependency)

## Error Handling

- All API calls wrapped in try/catch
- Errors logged to console
- User-friendly error toasts displayed
- Loading states prevent duplicate requests
- Network errors handled gracefully

## Statistics Calculation

All statistics are calculated from real data:
- `totalBeds` = sum of all bed totals
- `totalOccupied` = sum of all occupied beds
- `occupancyRate` = (totalOccupied / totalBeds) * 100 (with division by zero guard)
- `activeStaff` = count of staff with status "active"
- `todayAppointments` = appointments filtered by today's date (dynamic)
- `bookedSlots` = count of slots with status "booked"

## Files Modified/Created

### Backend
- `models/HospitalBed.js` (NEW)
- `models/HospitalDoctorSlot.js` (NEW)
- `models/HospitalStaff.js` (NEW)
- `models/HospitalSurgeAlert.js` (NEW)
- `models/HospitalEnvironment.js` (NEW)
- `models/HospitalAppointment.js` (NEW)
- `routes/hospital.js` (NEW)
- `server.js` (MODIFIED - added hospital routes and model imports)
- `scripts/seedHospitalDashboard.js` (NEW)

### Frontend
- `src/services/api.ts` (MODIFIED - added hospital API functions)
- `src/components/HospitalDashboard.tsx` (MODIFIED - removed hardcoded data, added API integration)

## Testing Checklist

- [x] Login with hospital credentials
- [x] Dashboard loads all data from backend
- [x] Bed management (update count, occupy, release)
- [x] Doctor slots (toggle available/blocked)
- [x] Staff management (update status, delete)
- [x] Surge alerts display correctly
- [x] Environment data displays correctly
- [x] Appointments display correctly
- [x] Settings (change password, update profile)
- [x] All changes persist after page refresh
- [x] Loading states work correctly
- [x] Error handling works correctly

## Notes

- All dates use "YYYY-MM-DD" format for consistency
- Bed `available` is automatically calculated (total - occupied)
- Booked slots cannot be modified (enforced on backend)
- Environment data is unique per hospital (one document)
- All routes require JWT authentication
- All routes verify hospital ownership before operations

## Future Enhancements

- Add pagination for large datasets
- Add filtering and search functionality
- Add bulk operations (e.g., bulk bed updates)
- Add audit logging for changes
- Add real-time updates via WebSockets
- Add export functionality (CSV, PDF reports)

