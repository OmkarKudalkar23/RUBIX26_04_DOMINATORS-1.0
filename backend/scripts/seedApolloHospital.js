/**
 * Seed script to populate MongoDB with sample data for the Apollo Mumbai hospital account.
 *
 * Usage: node scripts/seedApolloHospital.js
 *
 * This will:
 * - Create/replace the hospital user: admin@apollomumbai.com / apollo@2026 (role: hospital)
 * - Create a hospital profile for "Apollo Mumbai Hospital"
 * - Insert sample beds, doctor slots, staff, surge alerts, environment data, and today's appointments.
 *
 * WARNING: This script DELETES existing data for this hospital/email before inserting fresh data.
 * Run only in development or with that expectation.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Models
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const HospitalBed = require("../models/HospitalBed");
const HospitalDoctorSlot = require("../models/HospitalDoctorSlot");
const HospitalStaff = require("../models/HospitalStaff");
const HospitalSurgeAlert = require("../models/HospitalSurgeAlert");
const HospitalEnvironment = require("../models/HospitalEnvironment");
const HospitalAppointment = require("../models/HospitalAppointment");

// Mongo connection
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

const HOSPITAL_EMAIL = "admin@apollomumbai.com";
const HOSPITAL_PASSWORD = "apollo@2026";

async function seedApolloHospital() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Cleanup existing data for this email
    console.log("🧹 Cleaning up existing Apollo hospital data...");
    const existingUser = await User.findOne({ email: HOSPITAL_EMAIL });
    if (existingUser) {
      const existingHospital = await Hospital.findOne({ userId: existingUser._id });
      if (existingHospital) {
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
    console.log("✅ Cleanup complete");

    // Create user
    console.log("👤 Creating hospital user...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(HOSPITAL_PASSWORD, salt);
    const hospitalUser = await User.create({
      name: "Apollo Mumbai Hospital",
      email: HOSPITAL_EMAIL,
      passwordHash,
      role: "hospital",
    });
    console.log(`✅ Created user ${hospitalUser.email}`);

    // Create hospital profile
    console.log("🏥 Creating hospital profile...");
    const hospital = await Hospital.create({
      userId: hospitalUser._id,
      name: "Apollo Mumbai Hospital",
      phone: "+91 22 1234 5678",
      address: "Apollo Hospitals, Navi Mumbai, Maharashtra",
    });

    // Beds
    console.log("🛏️ Creating beds...");
    const beds = [
      { type: "ICU", total: 40, occupied: 28, available: 12 },
      { type: "General", total: 180, occupied: 130, available: 50 },
      { type: "Private", total: 70, occupied: 50, available: 20 },
      { type: "Emergency", total: 25, occupied: 17, available: 8 },
    ];
    await HospitalBed.insertMany(
      beds.map((b) => ({ hospitalId: hospital._id, ...b }))
    );

    // Doctor slots (today)
    console.log("👨‍⚕️ Creating doctor slots...");
    const today = new Date().toISOString().split("T")[0];
    const doctorSlots = [
      {
        doctorName: "Dr. Aarav Mehta",
        specialization: "Pulmonology",
        department: "Respiratory",
        date: today,
        slots: [
          { time: "09:00 AM", status: "booked", patientName: "Rohan Patil" },
          { time: "09:30 AM", status: "available" },
          { time: "10:00 AM", status: "available" },
          { time: "10:30 AM", status: "booked", patientName: "Meera Shah" },
          { time: "11:00 AM", status: "available" },
          { time: "11:30 AM", status: "blocked" },
        ],
      },
      {
        doctorName: "Dr. Kavya Iyer",
        specialization: "Cardiology",
        department: "Cardiac",
        date: today,
        slots: [
          { time: "02:00 PM", status: "available" },
          { time: "02:30 PM", status: "available" },
          { time: "03:00 PM", status: "booked", patientName: "Sameer Kulkarni" },
          { time: "03:30 PM", status: "available" },
          { time: "04:00 PM", status: "available" },
        ],
      },
      {
        doctorName: "Dr. Neha Deshpande",
        specialization: "General Medicine",
        department: "General",
        date: today,
        slots: [
          { time: "09:00 AM", status: "booked", patientName: "Anita Rao" },
          { time: "09:20 AM", status: "booked", patientName: "Vikram Nair" },
          { time: "09:40 AM", status: "available" },
          { time: "10:00 AM", status: "available" },
          { time: "10:20 AM", status: "available" },
          { time: "10:40 AM", status: "booked", patientName: "Sanjay Gupta" },
        ],
      },
    ];
    await HospitalDoctorSlot.insertMany(
      doctorSlots.map((d) => ({ hospitalId: hospital._id, ...d }))
    );

    // Staff
    console.log("👥 Creating staff...");
    const staffMembers = [
      { name: "Priya Nair", role: "Nurse", department: "ICU", shift: "Morning", status: "active" },
      { name: "Arjun Singh", role: "Technician", department: "Radiology", shift: "Evening", status: "active" },
      { name: "Leena D'Souza", role: "Nurse", department: "Emergency", shift: "Night", status: "active" },
      { name: "Ravi Sharma", role: "Support", department: "General", shift: "Morning", status: "on-leave" },
      { name: "Shweta Patil", role: "Admin", department: "Administration", shift: "Morning", status: "active" },
      { name: "Farhan Qureshi", role: "Nurse", department: "Cardiac", shift: "Evening", status: "active" },
      { name: "Gayatri Kulkarni", role: "Technician", department: "Laboratory", shift: "Night", status: "off-duty" },
      { name: "Harish Pillai", role: "Support", department: "Maintenance", shift: "Morning", status: "active" },
    ];
    await HospitalStaff.insertMany(
      staffMembers.map((s) => ({ hospitalId: hospital._id, ...s }))
    );

    // Surge alerts
    console.log("⚠️ Creating surge alerts...");
    const alerts = [
      {
        type: "pollution",
        severity: "high",
        title: "High Air Pollution Alert",
        message: "AQI levels reaching 320 - expect surge in respiratory patients",
        prediction: "+40% increase in respiratory cases expected",
        date: today,
        department: "Respiratory",
        expectedIncrease: 40,
        recommendations: [
          "Prepare 10 additional beds in respiratory ward",
          "Stock nebulizers and inhalers",
          "Add 2 pulmonologists on standby",
          "Increase oxygen supply reserves",
          "Alert ICU for potential severe cases",
        ],
      },
      {
        type: "seasonal",
        severity: "medium",
        title: "Dengue Season Alert",
        message: "Monsoon season - dengue cases rising",
        prediction: "+25% increase in dengue-related admissions",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        department: "General",
        expectedIncrease: 25,
        recommendations: [
          "Stock platelets and IV fluids",
          "Prepare 5 extra isolation beds",
          "Brief staff on dengue protocols",
          "Set up rapid testing facility",
        ],
      },
      {
        type: "weather",
        severity: "low",
        title: "Heat Wave Expected",
        message: "Temperature forecasted to reach 42°C",
        prediction: "+15% increase in heat-related cases",
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        department: "Emergency",
        expectedIncrease: 15,
        recommendations: [
          "Stock ORS and electrolyte solutions",
          "Prepare cooling facilities",
          "Alert emergency team",
        ],
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
          "Set up flu vaccination booth",
        ],
      },
    ];
    await HospitalSurgeAlert.insertMany(
      alerts.map((a) => ({ hospitalId: hospital._id, ...a }))
    );

    // Environment
    console.log("🌍 Creating environment data...");
    await HospitalEnvironment.create({
      hospitalId: hospital._id,
      aqi: 320,
      temperature: 38,
      humidity: 65,
      pollutionLevel: "Very Poor",
      festivalFlag: false,
    });

    // Appointments (today) - Enhanced with more OPD appointments
    console.log("📅 Creating appointments...");
    const appointments = [
      // OPD Appointments - Morning
      { patientName: "Rohan Patil", doctorName: "Dr. Aarav Mehta", department: "Respiratory", date: today, time: "08:00 AM", status: "completed", type: "OPD" },
      { patientName: "Anita Rao", doctorName: "Dr. Neha Deshpande", department: "General", date: today, time: "08:30 AM", status: "completed", type: "OPD" },
      { patientName: "Vikram Joshi", doctorName: "Dr. Neha Deshpande", department: "General", date: today, time: "09:00 AM", status: "completed", type: "OPD" },
      { patientName: "Priya Nair", doctorName: "Dr. Aarav Mehta", department: "Respiratory", date: today, time: "09:30 AM", status: "scheduled", type: "OPD" },
      { patientName: "Arjun Menon", doctorName: "Dr. Neha Deshpande", department: "General", date: today, time: "10:00 AM", status: "scheduled", type: "OPD" },
      { patientName: "Meera Shah", doctorName: "Dr. Aarav Mehta", department: "Respiratory", date: today, time: "10:30 AM", status: "scheduled", type: "OPD" },
      { patientName: "Sneha Reddy", doctorName: "Dr. Neha Deshpande", department: "General", date: today, time: "11:00 AM", status: "scheduled", type: "OPD" },
      { patientName: "Rahul Desai", doctorName: "Dr. Aarav Mehta", department: "Respiratory", date: today, time: "11:30 AM", status: "scheduled", type: "OPD" },
      // OPD Appointments - Afternoon
      { patientName: "Kavita Pillai", doctorName: "Dr. Kavya Iyer", department: "Cardiac", date: today, time: "02:00 PM", status: "scheduled", type: "OPD" },
      { patientName: "Sameer Kulkarni", doctorName: "Dr. Kavya Iyer", department: "Cardiac", date: today, time: "02:30 PM", status: "scheduled", type: "OPD" },
      { patientName: "Divya Nair", doctorName: "Dr. Neha Deshpande", department: "General", date: today, time: "03:00 PM", status: "scheduled", type: "OPD" },
      { patientName: "Aditya Kumar", doctorName: "Dr. Aarav Mehta", department: "Respiratory", date: today, time: "03:30 PM", status: "scheduled", type: "OPD" },
      { patientName: "Shreya Iyer", doctorName: "Dr. Kavya Iyer", department: "Cardiac", date: today, time: "04:00 PM", status: "scheduled", type: "OPD" },
      { patientName: "Nikhil Patel", doctorName: "Dr. Neha Deshpande", department: "General", date: today, time: "04:30 PM", status: "scheduled", type: "OPD" },
      { patientName: "Ananya Menon", doctorName: "Dr. Aarav Mehta", department: "Respiratory", date: today, time: "05:00 PM", status: "scheduled", type: "OPD" },
      // Follow-up appointments
      { patientName: "Rajesh Nair", doctorName: "Dr. Kavya Iyer", department: "Cardiac", date: today, time: "01:30 PM", status: "scheduled", type: "Follow-up" },
      { patientName: "Lakshmi Menon", doctorName: "Dr. Aarav Mehta", department: "Respiratory", date: today, time: "12:00 PM", status: "scheduled", type: "Follow-up" },
    ];
    await HospitalAppointment.insertMany(
      appointments.map((a) => ({ hospitalId: hospital._id, ...a }))
    );

    console.log("\n✅ Successfully seeded Apollo Mumbai hospital data!");
    console.log("\n🔑 Login:");
    console.log(`   Email: ${HOSPITAL_EMAIL}`);
    console.log(`   Password: ${HOSPITAL_PASSWORD}`);
  } catch (err) {
    console.error("❌ Error seeding Apollo hospital:", err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

seedApolloHospital()
  .then(() => {
    console.log("\n🎉 Seed script completed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Seed script failed:", err);
    process.exit(1);
  });
