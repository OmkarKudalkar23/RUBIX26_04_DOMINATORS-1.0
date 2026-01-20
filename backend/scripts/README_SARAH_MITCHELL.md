# Dr. Sarah Mitchell Integration Guide

This guide explains how Dr. Sarah Mitchell is integrated into the system and how to set up her data.

## What Was Done

### 1. Script Created: `linkSarahMitchellWithPatients.js`
   - Finds or creates Dr. Sarah Mitchell in the database
   - Links her with existing patients (or creates sample patients if none exist)
   - Creates appointments for Dr. Sarah Mitchell with those patients
   - Ensures all data is properly linked

### 2. Frontend Updated: `PatientDashboard.tsx`
   - Modified `getAvailableDoctors()` to fetch real doctors from the API
   - Prioritizes Dr. Sarah Mitchell in the doctor dropdown
   - Falls back to random doctors if API fails, but always includes Dr. Sarah Mitchell if she exists

### 3. Backend Updated
   - **Appointment Model**: Added `doctorName` and `doctorSpecialty` fields as fallback
   - **Appointments Route**: Now stores doctor name and specialty even when doctorId is not available
   - This ensures appointments are properly linked to Dr. Sarah Mitchell

## How to Run

### Step 1: Run the Linking Script

```bash
cd omkar/Mumbai_hacks/backend
node scripts/linkSarahMitchellWithPatients.js
```

This will:
- Find or create Dr. Sarah Mitchell
- Link her with existing patients
- Create appointments for her

### Step 2: Verify the Integration

1. **Check Doctor Dashboard**:
   - Log in as Dr. Sarah Mitchell (email: `sarah.mitchell@doctor.com`, password: `Password@123`)
   - You should see appointments in the "Upcoming Appointments" section

2. **Check Patient Dashboard**:
   - Log in as any patient
   - Go to "Book Appointment"
   - Select a hospital
   - In the "Select Doctor" dropdown, you should see "Dr. Sarah Mitchell" as an option
   - Book an appointment with her
   - The appointment should appear in Dr. Sarah Mitchell's dashboard

## Doctor Details

- **Name**: Dr. Sarah Mitchell
- **Specialization**: Cardiologist
- **Email**: sarah.mitchell@doctor.com (if created by script)
- **Password**: Password@123 (if created by script)
- **Age**: 42
- **Gender**: Female

## Appointment Flow

1. **Patient books appointment**:
   - Patient selects hospital
   - Patient sees Dr. Sarah Mitchell in dropdown
   - Patient selects Dr. Sarah Mitchell
   - Patient books appointment

2. **Appointment appears in Dr. Sarah Mitchell's dashboard**:
   - Appointment is linked by `doctorId` (MongoDB ObjectId)
   - If `doctorId` is not available, it's linked by `doctorName`
   - Dr. Sarah Mitchell can see, accept, or reject the appointment

## Troubleshooting

### Dr. Sarah Mitchell not appearing in dropdown?
- Make sure the script has been run
- Check that doctors are being fetched from `/api/doctors`
- Verify Dr. Sarah Mitchell exists in the database

### Appointments not showing in Dr. Sarah Mitchell's dashboard?
- Check that appointments have `doctorId` matching Dr. Sarah Mitchell's `_id`
- Verify the doctor dashboard is querying appointments correctly
- Check server logs for any errors

### Script errors?
- Make sure MongoDB connection string is correct in `.env`
- Verify all models are properly imported
- Check that the database is accessible

## Database Structure

### Doctor Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: "Dr. Sarah Mitchell",
  specialization: "Cardiologist",
  // ... other fields
}
```

### Appointment Collection
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: Patient),
  doctorId: ObjectId (ref: Doctor), // Links to Dr. Sarah Mitchell
  doctorName: "Dr. Sarah Mitchell", // Fallback
  doctorSpecialty: "Cardiologist", // Fallback
  // ... other fields
}
```

## Notes

- The script is idempotent - you can run it multiple times safely
- It will not create duplicate appointments
- If Dr. Sarah Mitchell already exists, it will use the existing record
- The frontend prioritizes real doctors from the API over random generated doctors

