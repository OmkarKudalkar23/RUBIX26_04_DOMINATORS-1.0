/**
 * Seed script to populate MongoDB with sample hospital dashboard data
 * 
 * Usage: node scripts/seedHospitalDashboard.js
 * 
 * This script creates:
 * - 1 hospital user (email: hospital@test.com, password: Password@123)
 * - 1 Hospital profile linked to that user
 * - Sample beds, doctor slots, staff, surge alerts, environment data, and appointments
 * 
 * IMPORTANT: This will DELETE existing data for the test hospital before inserting new data.
 * Run this in development only!
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const HospitalBed = require('../models/HospitalBed');
const HospitalDoctorSlot = require('../models/HospitalDoctorSlot');
const HospitalStaff = require('../models/HospitalStaff');
const HospitalSurgeAlert = require('../models/HospitalSurgeAlert');
const HospitalEnvironment = require('../models/HospitalEnvironment');
const HospitalAppointment = require('../models/HospitalAppointment');
const Doctor = require('../models/Doctor');
const HospitalInventoryItem = require('../models/HospitalInventoryItem');
const HospitalOpdCheckIn = require('../models/HospitalOpdCheckIn');
const HospitalAdmission = require('../models/HospitalAdmission');
const HospitalInventoryTxn = require('../models/HospitalInventoryTxn');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

const HOSPITAL_EMAIL = 'hospital@test.com';
const HOSPITAL_PASSWORD = 'Password@123';

async function seedHospitalDashboard() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clean up existing test hospital data
    console.log('🧹 Cleaning up existing test hospital data...');
    const existingUser = await User.findOne({ email: HOSPITAL_EMAIL });
    if (existingUser) {
      const existingHospital = await Hospital.findOne({ userId: existingUser._id });
      if (existingHospital) {
        // Delete all related data
        await HospitalBed.deleteMany({ hospitalId: existingHospital._id });
        await HospitalDoctorSlot.deleteMany({ hospitalId: existingHospital._id });
        await HospitalStaff.deleteMany({ hospitalId: existingHospital._id });
        await HospitalSurgeAlert.deleteMany({ hospitalId: existingHospital._id });
        await HospitalEnvironment.deleteMany({ hospitalId: existingHospital._id });
        await HospitalAppointment.deleteMany({ hospitalId: existingHospital._id });
        await Hospital.deleteOne({ _id: existingHospital._id });
      }
      await User.deleteOne({ _id: existingUser._id });
    }
    console.log('✅ Cleanup complete');

    // 1. Create Hospital User
    console.log('👤 Creating hospital user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(HOSPITAL_PASSWORD, salt);
    
    const hospitalUser = new User({
      name: "City General Hospital",
      email: HOSPITAL_EMAIL,
      passwordHash: passwordHash,
      role: "hospital"
    });
    await hospitalUser.save();
    console.log(`✅ Created hospital user: ${hospitalUser.email} (ID: ${hospitalUser._id})`);

    // 2. Create Hospital Profile
    console.log('🏥 Creating hospital profile...');
    const hospital = new Hospital({
      userId: hospitalUser._id,
      name: "City General Hospital",
      phone: "+1 (555) 987-6543",
      address: "123 Healthcare Blvd, Medical District"
    });
    await hospital.save();
    console.log(`✅ Created hospital profile: ${hospital.name} (ID: ${hospital._id})`);

    // 2.5 Create Doctor Users + Doctor Profiles (so doctors exist in Doctor Dashboard too)
    console.log('👨‍⚕️ Creating doctor users + profiles...');
    const DOCTOR_PASSWORD = 'Doctor@123';
    const doctorDefs = [
      { name: "Dr. Sarah Mitchell", specialization: "Pulmonology", department: "Respiratory" },
      { name: "Dr. James Wilson", specialization: "Cardiology", department: "Cardiac" },
      { name: "Dr. Emily Chen", specialization: "General Medicine", department: "General" }
    ];

    const doctorCreds = [];

    for (const d of doctorDefs) {
      // Create stable email like dr.sarah.mitchell@cityhospital.com
      const base = d.name
        .toLowerCase()
        .replace(/^dr\.\s*/i, 'dr.')
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/\.+/g, '.')
        .replace(/\.$/, '');
      const email = `${base}@cityhospital.com`;

      // Remove any existing user with same email to keep seeding idempotent
      const existing = await User.findOne({ email });
      if (existing) {
        // delete linked doctor profile if exists
        if (existing.doctorId) {
          await Doctor.deleteOne({ _id: existing.doctorId });
        }
        await User.deleteOne({ _id: existing._id });
      }

      const doctorPasswordHash = await bcrypt.hash(DOCTOR_PASSWORD, salt);
      const doctorUser = await User.create({
        name: d.name,
        email,
        passwordHash: doctorPasswordHash,
        role: 'doctor',
        hospitalId: hospital._id
      });

      const doctorProfile = await Doctor.create({
        userId: doctorUser._id,
        name: d.name,
        specialization: d.specialization,
        hospitalId: hospital._id
      });

      doctorUser.doctorId = doctorProfile._id;
      await doctorUser.save();

      doctorCreds.push({ name: d.name, email, password: DOCTOR_PASSWORD });
      console.log(`  ✅ Doctor created: ${d.name} (${email})`);
    }

    // 3. Create Beds
    console.log('🛏️  Creating beds...');
    const beds = [
      { type: "ICU", total: 50, occupied: 38, available: 12 },
      { type: "General", total: 200, occupied: 145, available: 55 },
      { type: "Private", total: 80, occupied: 62, available: 18 },
      { type: "Emergency", total: 30, occupied: 22, available: 8 }
    ];

    for (const bedData of beds) {
      const bed = new HospitalBed({
        hospitalId: hospital._id,
        ...bedData
      });
      await bed.save();
      console.log(`  ✅ Created ${bedData.type} bed: ${bedData.total} total, ${bedData.occupied} occupied`);
    }

    // 4. Create Doctor Slots
    console.log('👨‍⚕️ Creating doctor slots...');
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    const doctorSlots = [
      {
        doctorName: "Dr. Sarah Mitchell",
        specialization: "Pulmonology",
        department: "Respiratory",
        date: today,
        slots: [
          { time: "09:00 AM", status: "booked", patientName: "John Doe" },
          { time: "09:30 AM", status: "available" },
          { time: "10:00 AM", status: "available" },
          { time: "10:30 AM", status: "booked", patientName: "Jane Smith" },
          { time: "11:00 AM", status: "available" },
          { time: "11:30 AM", status: "blocked" }
        ]
      },
      {
        doctorName: "Dr. James Wilson",
        specialization: "Cardiology",
        department: "Cardiac",
        date: today,
        slots: [
          { time: "02:00 PM", status: "available" },
          { time: "02:30 PM", status: "available" },
          { time: "03:00 PM", status: "booked", patientName: "Robert Brown" },
          { time: "03:30 PM", status: "available" },
          { time: "04:00 PM", status: "available" }
        ]
      },
      {
        doctorName: "Dr. Emily Chen",
        specialization: "General Medicine",
        department: "General",
        date: today,
        slots: [
          { time: "09:00 AM", status: "booked", patientName: "Alice Johnson" },
          { time: "09:20 AM", status: "booked", patientName: "Michael Lee" },
          { time: "09:40 AM", status: "available" },
          { time: "10:00 AM", status: "available" },
          { time: "10:20 AM", status: "available" },
          { time: "10:40 AM", status: "booked", patientName: "Sarah Davis" }
        ]
      }
    ];

    for (const slotData of doctorSlots) {
      const slot = new HospitalDoctorSlot({
        hospitalId: hospital._id,
        ...slotData
      });
      await slot.save();
      console.log(`  ✅ Created slots for ${slotData.doctorName}`);
    }

    // 5. Create Staff
    console.log('👥 Creating staff...');
    const staffMembers = [
      { name: "Alice Johnson", role: "Nurse", department: "ICU", shift: "Morning", status: "active" },
      { name: "Bob Smith", role: "Technician", department: "Radiology", shift: "Evening", status: "active" },
      { name: "Carol White", role: "Nurse", department: "Emergency", shift: "Night", status: "active" },
      { name: "David Brown", role: "Support", department: "General", shift: "Morning", status: "on-leave" },
      { name: "Emma Davis", role: "Admin", department: "Administration", shift: "Morning", status: "active" },
      { name: "Frank Miller", role: "Nurse", department: "Cardiac", shift: "Evening", status: "active" },
      { name: "Grace Wilson", role: "Technician", department: "Laboratory", shift: "Night", status: "off-duty" },
      { name: "Henry Taylor", role: "Support", department: "Maintenance", shift: "Morning", status: "active" }
    ];

    for (const staffData of staffMembers) {
      const staff = new HospitalStaff({
        hospitalId: hospital._id,
        ...staffData
      });
      await staff.save();
      console.log(`  ✅ Created staff: ${staffData.name} (${staffData.role})`);
    }

    // 6. Create Surge Alerts
    console.log('⚠️  Creating surge alerts...');
    const alerts = [
      {
        type: "pollution",
        severity: "high",
        title: "High Air Pollution Alert",
        message: "AQI levels reaching 320 - Expect surge in respiratory patients",
        prediction: "+40% increase in respiratory cases expected",
        date: today,
        department: "Respiratory",
        expectedIncrease: 40,
        recommendations: [
          "Prepare 10 additional beds in respiratory ward",
          "Stock nebulizers and inhalers",
          "Add 2 pulmonologists on standby",
          "Increase oxygen supply reserves",
          "Alert ICU for potential severe cases"
        ]
      },
      {
        type: "seasonal",
        severity: "medium",
        title: "Dengue Season Alert",
        message: "Monsoon season - Dengue cases rising",
        prediction: "+25% increase in dengue-related admissions",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        department: "General",
        expectedIncrease: 25,
        recommendations: [
          "Stock platelets and IV fluids",
          "Prepare 5 extra isolation beds",
          "Brief staff on dengue protocols",
          "Set up rapid testing facility"
        ]
      },
      {
        type: "weather",
        severity: "low",
        title: "Heat Wave Expected",
        message: "Temperature forecasted to reach 42°C",
        prediction: "+15% increase in heat-related cases",
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
        department: "Emergency",
        expectedIncrease: 15,
        recommendations: [
          "Stock ORS and electrolyte solutions",
          "Prepare cooling facilities",
          "Alert emergency team"
        ]
      },
      {
        type: "epidemic",
        severity: "high",
        title: "Flu Season Peak",
        message: "Seasonal flu reaching peak levels",
        prediction: "+35% increase in flu cases",
        date: today,
        department: "General",
        expectedIncrease: 35,
        recommendations: [
          "Stock antivirals and flu medications",
          "Prepare 8 additional general beds",
          "Increase nursing staff in general ward",
          "Set up flu vaccination booth"
        ]
      }
    ];

    for (const alertData of alerts) {
      const alert = new HospitalSurgeAlert({
        hospitalId: hospital._id,
        ...alertData
      });
      await alert.save();
      console.log(`  ✅ Created alert: ${alertData.title}`);
    }

    // 7. Create Environment Data
    console.log('🌍 Creating environment data...');
    const environment = new HospitalEnvironment({
      hospitalId: hospital._id,
      aqi: 320,
      temperature: 38,
      humidity: 65,
      pollutionLevel: "Very Poor",
      festivalFlag: false
    });
    await environment.save();
    console.log(`  ✅ Created environment data`);

    // 8. Create Appointments (with more OPD appointments)
    console.log('📅 Creating appointments...');
    const appointments = [
      // OPD Appointments - Morning
      { patientName: "John Doe", doctorName: "Dr. Sarah Mitchell", department: "Respiratory", date: today, time: "08:00 AM", status: "completed", type: "OPD" },
      { patientName: "Alice Johnson", doctorName: "Dr. Emily Chen", department: "General", date: today, time: "08:30 AM", status: "completed", type: "OPD" },
      { patientName: "Michael Lee", doctorName: "Dr. Emily Chen", department: "General", date: today, time: "09:00 AM", status: "completed", type: "OPD" },
      { patientName: "Sarah Davis", doctorName: "Dr. Sarah Mitchell", department: "Respiratory", date: today, time: "09:30 AM", status: "scheduled", type: "OPD" },
      { patientName: "David Wilson", doctorName: "Dr. Emily Chen", department: "General", date: today, time: "10:00 AM", status: "scheduled", type: "OPD" },
      { patientName: "Emma Brown", doctorName: "Dr. Sarah Mitchell", department: "Respiratory", date: today, time: "10:30 AM", status: "scheduled", type: "OPD" },
      { patientName: "James Taylor", doctorName: "Dr. Emily Chen", department: "General", date: today, time: "11:00 AM", status: "scheduled", type: "OPD" },
      { patientName: "Olivia Martinez", doctorName: "Dr. Sarah Mitchell", department: "Respiratory", date: today, time: "11:30 AM", status: "scheduled", type: "OPD" },
      // OPD Appointments - Afternoon
      { patientName: "Robert Brown", doctorName: "Dr. James Wilson", department: "Cardiac", date: today, time: "02:00 PM", status: "scheduled", type: "OPD" },
      { patientName: "Sophia Anderson", doctorName: "Dr. James Wilson", department: "Cardiac", date: today, time: "02:30 PM", status: "scheduled", type: "OPD" },
      { patientName: "William Thomas", doctorName: "Dr. Emily Chen", department: "General", date: today, time: "03:00 PM", status: "scheduled", type: "OPD" },
      { patientName: "Isabella Jackson", doctorName: "Dr. Sarah Mitchell", department: "Respiratory", date: today, time: "03:30 PM", status: "scheduled", type: "OPD" },
      { patientName: "Ethan White", doctorName: "Dr. James Wilson", department: "Cardiac", date: today, time: "04:00 PM", status: "scheduled", type: "OPD" },
      { patientName: "Mia Harris", doctorName: "Dr. Emily Chen", department: "General", date: today, time: "04:30 PM", status: "scheduled", type: "OPD" },
      { patientName: "Alexander Martin", doctorName: "Dr. Sarah Mitchell", department: "Respiratory", date: today, time: "05:00 PM", status: "scheduled", type: "OPD" },
      // Follow-up appointments
      { patientName: "Jane Smith", doctorName: "Dr. Sarah Mitchell", department: "Respiratory", date: today, time: "10:00 AM", status: "scheduled", type: "Follow-up" },
      { patientName: "Noah Garcia", doctorName: "Dr. James Wilson", department: "Cardiac", date: today, time: "01:30 PM", status: "scheduled", type: "Follow-up" }
    ];

    for (const aptData of appointments) {
      const appointment = new HospitalAppointment({
        hospitalId: hospital._id,
        ...aptData
      });
      await appointment.save();
      console.log(`  ✅ Created appointment: ${aptData.patientName} with ${aptData.doctorName}`);
    }

    // 9. Create Inventory Items (basic stock + reorder thresholds)
    console.log('📦 Creating inventory items...');
    const inventoryItems = [
      { name: 'Oxygen Cylinders', category: 'Oxygen', unit: 'cylinders', currentStock: 120, minStock: 60, reorderQty: 80 },
      { name: 'Medical Masks', category: 'PPE', unit: 'boxes', currentStock: 45, minStock: 40, reorderQty: 60 },
      { name: 'Nebulizer Kits', category: 'Consumables', unit: 'kits', currentStock: 30, minStock: 20, reorderQty: 40 },
      { name: 'Paracetamol', category: 'Medicine', unit: 'strips', currentStock: 70, minStock: 50, reorderQty: 80 },
      { name: 'IV Fluids', category: 'Consumables', unit: 'bags', currentStock: 55, minStock: 40, reorderQty: 60 }
    ];

    for (const itemData of inventoryItems) {
      await HospitalInventoryItem.create({
        hospitalId: hospital._id,
        ...itemData
      });
      console.log(`  ✅ Created inventory item: ${itemData.name} (${itemData.currentStock} ${itemData.unit})`);
    }

    // 10. Create OPD Check-ins for today's OPD appointments (queue simulation)
    console.log('🧾 Creating OPD check-ins...');
    const todaysOpd = appointments.filter((a) => a.type === 'OPD').slice(0, 12);
    let qn = 1;
    for (const a of todaysOpd) {
      await HospitalOpdCheckIn.create({
        hospitalId: hospital._id,
        patientName: a.patientName,
        department: a.department,
        doctorName: a.doctorName,
        visitType: 'OPD',
        status: a.status === 'completed' ? 'completed' : 'checked-in',
        priority: qn % 7 === 0 ? 'high' : 'normal',
        queueNumber: qn++,
        checkInTime: new Date()
      });
    }
    console.log(`  ✅ Created ${todaysOpd.length} OPD check-ins`);

    // 11. Create Admissions (rule-based workflow demo) + link inventory consumption txns
    console.log('🏥 Creating admissions...');
    const admissions = [
      { patientName: 'Rahul Kumar', age: 55, department: 'Cardiac', bedType: 'ICU', severity: 'high', oxygenRequired: true, isolationRequired: false },
      { patientName: 'Neha Sharma', age: 34, department: 'General', bedType: 'General', severity: 'medium', oxygenRequired: false, isolationRequired: false },
      { patientName: 'Amit Singh', age: 68, department: 'Respiratory', bedType: 'Emergency', severity: 'critical', oxygenRequired: true, isolationRequired: true },
      { patientName: 'Priya Patel', age: 29, department: 'General', bedType: 'Private', severity: 'low', oxygenRequired: false, isolationRequired: true },
      { patientName: 'Suresh Nair', age: 47, department: 'Respiratory', bedType: 'General', severity: 'high', oxygenRequired: true, isolationRequired: false }
    ];

    // Allocate to available beds if possible; mark some admitted to create bed occupancy + inventory usage
    const bedDocs = await HospitalBed.find({ hospitalId: hospital._id });
    const invItems = await HospitalInventoryItem.find({ hospitalId: hospital._id });
    const findInv = (name) => invItems.find((i) => i.name.toLowerCase() === name.toLowerCase());

    for (let i = 0; i < admissions.length; i++) {
      const a = admissions[i];
      const admission = await HospitalAdmission.create({
        hospitalId: hospital._id,
        ...a,
        status: i < 3 ? 'admitted' : 'allocated',
        admittedAt: i < 3 ? new Date() : undefined
      });

      // pick matching bed doc by type
      const bed = bedDocs.find((b) => b.type === a.bedType) || bedDocs.find((b) => b.available > 0);
      if (bed) {
        admission.allocatedBedTypeId = bed._id;
        admission.allocationNote = `Seed allocation: ${bed.type}`;
        await admission.save();

        if (i < 3) {
          bed.occupied += 1;
          await bed.save();

          // inventory consumption txns to create trends
          const masks = findInv('Medical Masks');
          if (masks) {
            masks.currentStock = Math.max(0, masks.currentStock - 1);
            await masks.save();
            await HospitalInventoryTxn.create({ hospitalId: hospital._id, itemId: masks._id, type: 'consume', qty: 1, reason: 'seed-admission-ppe', linkedAdmissionId: admission._id });
          }
          if (a.oxygenRequired) {
            const oxy = findInv('Oxygen Cylinders');
            if (oxy) {
              oxy.currentStock = Math.max(0, oxy.currentStock - 1);
              await oxy.save();
              await HospitalInventoryTxn.create({ hospitalId: hospital._id, itemId: oxy._id, type: 'consume', qty: 1, reason: 'seed-admission-oxygen', linkedAdmissionId: admission._id });
            }
          }
        }
      }
    }
    console.log(`  ✅ Created ${admissions.length} admissions`);

    console.log(`\n✅ Successfully seeded hospital dashboard data!`);
    console.log(`\n📋 Summary:`);
    console.log(`   Hospital: ${hospital.name} (${HOSPITAL_EMAIL})`);
    console.log(`   Beds: ${beds.length} types`);
    console.log(`   Doctor Slots: ${doctorSlots.length} doctors`);
    console.log(`   Staff: ${staffMembers.length} members`);
    console.log(`   Surge Alerts: ${alerts.length} alerts`);
    console.log(`   Appointments: ${appointments.length} appointments`);
    console.log(`   Inventory: ${inventoryItems.length} items`);
    console.log(`   Admissions: ${admissions.length} records`);
    console.log(`\n🔑 Login Credentials:`);
    console.log(`   Hospital Email: ${HOSPITAL_EMAIL}`);
    console.log(`   Hospital Password: ${HOSPITAL_PASSWORD}`);
    console.log(`\n👨‍⚕️ Doctor Credentials (for Doctor Dashboard):`);
    console.log(`   Password for all seeded doctors: Doctor@123`);
    console.log(`   - dr.sarah.mitchell@cityhospital.com`);
    console.log(`   - dr.james.wilson@cityhospital.com`);
    console.log(`   - dr.emily.chen@cityhospital.com`);

  } catch (error) {
    console.error('❌ Error seeding hospital dashboard:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the seed function
seedHospitalDashboard()
  .then(() => {
    console.log('\n🎉 Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });

