/**
 * Seed script to populate MongoDB with sample doctor data
 * 
 * Usage: node scripts/seedDoctorSampleData.js
 * 
 * This script creates:
 * - 1 doctor user (email: doctor@test.com, password: Password@123)
 * - 1 Doctor profile linked to that user
 * - 5 Patient profiles
 * - 7 Appointments for the doctor
 * - 6 MedicalRecord documents for patients
 * 
 * IMPORTANT: This will DELETE existing data for the test doctor before inserting new data.
 * Run this in development only!
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
const DOCTOR_PASSWORD = 'Password@123'; // Clearly documented password for testing

async function seedDoctorData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clean up existing test doctor data
    console.log('🧹 Cleaning up existing test doctor data...');
    const existingUser = await User.findOne({ email: DOCTOR_EMAIL });
    if (existingUser) {
      // Find and delete doctor profile
      const existingDoctor = await Doctor.findOne({ userId: existingUser._id });
      if (existingDoctor) {
        // Delete appointments for this doctor
        await Appointment.deleteMany({ doctorId: existingDoctor._id });
        // Delete medical records uploaded by this doctor
        await MedicalRecord.deleteMany({ uploadedByDoctor: existingDoctor._id });
        // Delete doctor profile
        await Doctor.deleteOne({ _id: existingDoctor._id });
      }
      // Delete user
      await User.deleteOne({ _id: existingUser._id });
    }
    
    // Clean up existing test patient users (to avoid duplicate key errors)
    const testPatientEmails = [
      'john.anderson@patient.test.com',
      'emma.wilson@patient.test.com',
      'michael.brown@patient.test.com',
      'sarah.davis@patient.test.com',
      'robert.martinez@patient.test.com'
    ];
    
    for (const email of testPatientEmails) {
      const patientUser = await User.findOne({ email });
      if (patientUser) {
        // Delete patient profile if exists
        if (patientUser.patientId) {
          await Patient.deleteOne({ _id: patientUser.patientId });
        }
        // Delete user
        await User.deleteOne({ _id: patientUser._id });
      }
    }
    
    console.log('✅ Cleanup complete');

    // 1. Create Doctor User
    console.log('👤 Creating doctor user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DOCTOR_PASSWORD, salt);
    
    const doctorUser = new User({
      name: "Dr. Sarah Mitchell",
      email: DOCTOR_EMAIL,
      passwordHash: passwordHash,
      role: "doctor"
    });
    await doctorUser.save();
    console.log(`✅ Created doctor user: ${doctorUser.email} (ID: ${doctorUser._id})`);

    // 2. Create Doctor Profile
    console.log('🩺 Creating doctor profile...');
    const doctor = new Doctor({
      userId: doctorUser._id,
      name: "Dr. Sarah Mitchell",
      age: 42,
      gender: "female",
      dob: new Date('1982-05-15'),
      phone: "+1 (555) 123-4567",
      address: "123 Medical Center Dr, New York, NY 10001",
      specialization: "Cardiologist",
      education: "MBBS, MD (Cardiology)",
      certificateUrl: "",
      aadhaarUrl: ""
    });
    await doctor.save();
    
    // Update user with doctorId
    doctorUser.doctorId = doctor._id;
    await doctorUser.save();
    console.log(`✅ Created doctor profile: ${doctor.name} (ID: ${doctor._id})`);

    // 3. Create Patients
    console.log('👥 Creating patients...');
    const patients = [];
    const patientData = [
      {
        fullName: "John Anderson",
        age: 45,
        gender: "male",
        dob: new Date('1979-03-20'),
        bloodGroup: "O+",
        phone: "+1 (555) 234-5678",
        address: "456 Oak Street, New York, NY 10002",
        medicalHistory: ["Hypertension", "Elevated cholesterol"]
      },
      {
        fullName: "Emma Wilson",
        age: 32,
        gender: "female",
        dob: new Date('1992-07-10'),
        bloodGroup: "A+",
        phone: "+1 (555) 345-6789",
        address: "789 Pine Avenue, New York, NY 10003",
        medicalHistory: ["Stage 1 Hypertension"]
      },
      {
        fullName: "Michael Brown",
        age: 58,
        gender: "male",
        dob: new Date('1966-11-05'),
        bloodGroup: "B+",
        phone: "+1 (555) 456-7890",
        address: "321 Maple Drive, New York, NY 10004",
        medicalHistory: ["Angina", "Coronary Artery Disease"]
      },
      {
        fullName: "Sarah Davis",
        age: 41,
        gender: "female",
        dob: new Date('1983-09-18'),
        bloodGroup: "AB+",
        phone: "+1 (555) 567-8901",
        address: "654 Birch Lane, New York, NY 10005",
        medicalHistory: ["Atrial Fibrillation"]
      },
      {
        fullName: "Robert Martinez",
        age: 67,
        gender: "male",
        dob: new Date('1957-12-22'),
        bloodGroup: "O-",
        phone: "+1 (555) 678-9012",
        address: "987 Cedar Court, New York, NY 10006",
        medicalHistory: ["Post-Coronary Bypass Surgery"]
      }
    ];

    for (const data of patientData) {
      // Create a user for each patient (optional, but good for consistency)
      const patientUser = new User({
        name: data.fullName,
        email: `${data.fullName.toLowerCase().replace(/\s+/g, '.')}@patient.test.com`,
        passwordHash: await bcrypt.hash('Patient@123', 10),
        role: "patient"
      });
      await patientUser.save();

      const patient = new Patient({
        userId: patientUser._id,
        fullName: data.fullName,
        age: data.age,
        gender: data.gender,
        dob: data.dob,
        bloodGroup: data.bloodGroup,
        phone: data.phone,
        address: data.address,
        medicalHistory: data.medicalHistory
      });
      await patient.save();
      
      patientUser.patientId = patient._id;
      await patientUser.save();
      
      patients.push(patient);
      console.log(`✅ Created patient: ${patient.fullName} (ID: ${patient._id})`);
    }

    // 4. Create Appointments
    console.log('📅 Creating appointments...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const threeDays = new Date(today);
    threeDays.setDate(threeDays.getDate() + 3);

    const appointmentsData = [
      {
        patient: patients[0], // John Anderson
        date: today.toISOString().split('T')[0],
        time: "10:00 AM",
        type: "checkup",
        status: "pending",
        symptoms: "Chest pain, shortness of breath",
        reason: "Routine checkup"
      },
      {
        patient: patients[1], // Emma Wilson
        date: today.toISOString().split('T')[0],
        time: "11:30 AM",
        type: "followup",
        status: "pending",
        symptoms: "Follow-up on hypertension medication",
        reason: "Follow-up visit"
      },
      {
        patient: patients[2], // Michael Brown
        date: today.toISOString().split('T')[0],
        time: "09:00 AM",
        type: "emergency",
        status: "pending",
        symptoms: "Severe chest pain, nausea",
        reason: "Emergency consultation"
      },
      {
        patient: patients[3], // Sarah Davis
        date: tomorrow.toISOString().split('T')[0],
        time: "02:00 PM",
        type: "checkup",
        status: "accepted",
        symptoms: "Irregular heartbeat",
        reason: "Routine checkup",
        notes: "Patient confirmed for appointment"
      },
      {
        patient: patients[4], // Robert Martinez
        date: dayAfter.toISOString().split('T')[0],
        time: "10:30 AM",
        type: "followup",
        status: "accepted",
        symptoms: "Post-surgery check-up",
        reason: "Post-surgery follow-up",
        notes: "Post-operative monitoring"
      },
      {
        patient: patients[0], // John Anderson
        date: threeDays.toISOString().split('T')[0],
        time: "03:00 PM",
        type: "checkup",
        status: "rejected",
        symptoms: "General consultation",
        reason: "Routine checkup",
        notes: "Reschedule requested by patient"
      },
      {
        patient: patients[2], // Michael Brown
        date: tomorrow.toISOString().split('T')[0],
        time: "01:00 PM",
        type: "followup",
        status: "accepted",
        symptoms: "Follow-up on cardiac condition",
        reason: "Follow-up visit",
        notes: "Continue current medication"
      }
    ];

    const appointments = [];
    for (const data of appointmentsData) {
      const appointment = new Appointment({
        patientId: data.patient._id,
        doctorId: doctor._id,
        date: data.date,
        time: data.time,
        type: data.type,
        status: data.status,
        reason: data.reason,
        symptoms: data.symptoms,
        notes: data.notes || ""
      });
      await appointment.save();
      appointments.push(appointment);
      console.log(`✅ Created appointment: ${data.patient.fullName} - ${data.type} (${data.status})`);
    }

    // 5. Create Medical Records
    console.log('📄 Creating medical records...');
    const medicalRecordsData = [
      {
        patient: patients[0], // John Anderson
        type: "report",
        fileName: "cbc_report_john.pdf",
        fileUrl: "#",
        summary: "Complete Blood Count: All parameters within normal range. Hemoglobin: 14.2 g/dL (Normal), WBC: 7,800/μL (Normal), Platelets: 250,000/μL (Normal)."
      },
      {
        patient: patients[0], // John Anderson
        type: "lab-result",
        fileName: "lipid_profile_john.pdf",
        fileUrl: "#",
        summary: "Lipid Profile: Total cholesterol slightly elevated at 210 mg/dL. LDL: 135 mg/dL (borderline high), HDL: 45 mg/dL (acceptable)."
      },
      {
        patient: patients[2], // Michael Brown
        type: "xray",
        fileName: "chest_xray_michael.pdf",
        fileUrl: "#",
        summary: "Chest X-Ray: Clear lung fields bilaterally. No signs of pneumonia, pleural effusion, or masses. Heart size normal."
      },
      {
        patient: patients[2], // Michael Brown
        type: "report",
        fileName: "ecg_report_michael.pdf",
        fileUrl: "#",
        summary: "ECG Report: Sinus rhythm with occasional premature ventricular contractions. No acute ST-T changes."
      },
      {
        patient: patients[3], // Sarah Davis
        type: "lab-result",
        fileName: "blood_test_sarah.pdf",
        fileUrl: "#",
        summary: "Blood Test: INR levels within therapeutic range for warfarin. No adjustments needed."
      },
      {
        patient: patients[4], // Robert Martinez
        type: "report",
        fileName: "post_surgery_report_robert.pdf",
        fileUrl: "#",
        summary: "Post-Surgery Report: Incision healing well. No signs of infection. Continue current medication regimen."
      }
    ];

    for (const data of medicalRecordsData) {
      const medicalRecord = new MedicalRecord({
        patientId: data.patient._id,
        uploadedByDoctor: doctor._id,
        type: data.type,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        summary: data.summary,
        uploadDate: new Date()
      });
      await medicalRecord.save();
      console.log(`✅ Created medical record: ${data.fileName} for ${data.patient.fullName}`);
    }

    // Summary
    console.log('\n✅ ========================================');
    console.log('✅ SEEDING COMPLETE!');
    console.log('✅ ========================================');
    console.log(`\n📋 Login Credentials:`);
    console.log(`   Email: ${DOCTOR_EMAIL}`);
    console.log(`   Password: ${DOCTOR_PASSWORD}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - 1 Doctor user created`);
    console.log(`   - 1 Doctor profile created`);
    console.log(`   - ${patients.length} Patients created`);
    console.log(`   - ${appointments.length} Appointments created`);
    console.log(`   - ${medicalRecordsData.length} Medical Records created`);
    console.log('\n✅ You can now log in to the Doctor Dashboard!');

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedDoctorData();

