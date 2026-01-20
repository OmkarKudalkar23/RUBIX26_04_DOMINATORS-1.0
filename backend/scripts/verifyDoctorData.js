/**
 * Verification script to check if doctor data exists in MongoDB
 * 
 * Usage: node scripts/verifyDoctorData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

const DOCTOR_EMAIL = 'doctor@test.com';

async function verifyDoctorData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}\n`);

    // Check doctor user
    console.log('🔍 Checking doctor user...');
    const doctorUser = await User.findOne({ email: DOCTOR_EMAIL });
    if (!doctorUser) {
      console.log('❌ Doctor user NOT FOUND!');
      console.log('   Please run: node scripts/seedDoctorSampleData.js\n');
      await mongoose.connection.close();
      process.exit(1);
    }
    console.log('✅ Doctor user found:');
    console.log(`   - ID: ${doctorUser._id}`);
    console.log(`   - Email: ${doctorUser.email}`);
    console.log(`   - Name: ${doctorUser.name}`);
    console.log(`   - Role: ${doctorUser.role}`);
    console.log(`   - Doctor ID: ${doctorUser.doctorId || 'NOT SET'}\n`);

    // Check doctor profile
    console.log('🔍 Checking doctor profile...');
    const doctor = await Doctor.findOne({ userId: doctorUser._id });
    if (!doctor) {
      console.log('❌ Doctor profile NOT FOUND!');
      console.log('   User exists but profile is missing.\n');
    } else {
      console.log('✅ Doctor profile found:');
      console.log(`   - ID: ${doctor._id}`);
      console.log(`   - Name: ${doctor.name}`);
      console.log(`   - Specialization: ${doctor.specialization}`);
      console.log(`   - User ID: ${doctor.userId}`);
      console.log(`   - Phone: ${doctor.phone || 'N/A'}`);
      console.log(`   - Address: ${doctor.address || 'N/A'}\n`);
    }

    // Check patients
    console.log('🔍 Checking patients...');
    const patients = await Patient.find({});
    console.log(`✅ Found ${patients.length} patients in database\n`);

    // Check appointments
    console.log('🔍 Checking appointments...');
    if (doctor) {
      const appointments = await Appointment.find({ doctorId: doctor._id });
      console.log(`✅ Found ${appointments.length} appointments for this doctor`);
      appointments.forEach(apt => {
        console.log(`   - ${apt.type} (${apt.status}) on ${apt.date}`);
      });
      console.log('');
    }

    // Check medical records
    console.log('🔍 Checking medical records...');
    if (doctor) {
      const medicalRecords = await MedicalRecord.find({ uploadedByDoctor: doctor._id });
      console.log(`✅ Found ${medicalRecords.length} medical records uploaded by this doctor\n`);
    }

    // Summary
    console.log('✅ ========================================');
    console.log('✅ VERIFICATION COMPLETE!');
    console.log('✅ ========================================');
    console.log(`\n📋 Login Credentials:`);
    console.log(`   Email: ${DOCTOR_EMAIL}`);
    console.log(`   Password: Password@123`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Doctor User: ${doctorUser ? '✅' : '❌'}`);
    console.log(`   - Doctor Profile: ${doctor ? '✅' : '❌'}`);
    console.log(`   - Patients: ${patients.length}`);
    console.log(`   - Appointments: ${doctor ? (await Appointment.countDocuments({ doctorId: doctor._id })) : 0}`);
    console.log(`   - Medical Records: ${doctor ? (await MedicalRecord.countDocuments({ uploadedByDoctor: doctor._id })) : 0}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error verifying data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the verification
verifyDoctorData();


