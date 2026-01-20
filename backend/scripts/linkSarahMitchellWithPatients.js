/**
 * Script to link Dr. Sarah Mitchell with existing patients and create appointments
 * 
 * Usage: node scripts/linkSarahMitchellWithPatients.js
 * 
 * This script:
 * - Finds Dr. Sarah Mitchell in the database
 * - Links her with existing patients
 * - Creates appointments for her with those patients
 * - Ensures she appears in the doctor dropdown
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function linkSarahMitchellWithPatients() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // 1. Find Dr. Sarah Mitchell
    console.log('🔍 Finding Dr. Sarah Mitchell...');
    let doctor = await Doctor.findOne({ name: { $regex: /Sarah Mitchell/i } });
    
    if (!doctor) {
      // Try to find by email
      const doctorUser = await User.findOne({ 
        $or: [
          { email: /sarah/i },
          { name: /Sarah Mitchell/i }
        ],
        role: 'doctor'
      });
      
      if (doctorUser) {
        doctor = await Doctor.findOne({ userId: doctorUser._id });
      }
    }

    if (!doctor) {
      console.log('❌ Dr. Sarah Mitchell not found. Creating her profile...');
      
      // Create user for Dr. Sarah Mitchell
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Password@123', salt);
      
      const doctorUser = new User({
        name: "Dr. Sarah Mitchell",
        email: "sarah.mitchell@doctor.com",
        passwordHash: passwordHash,
        role: "doctor"
      });
      await doctorUser.save();
      console.log(`✅ Created doctor user: ${doctorUser.email} (ID: ${doctorUser._id})`);

      // Create doctor profile
      doctor = new Doctor({
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
      
      doctorUser.doctorId = doctor._id;
      await doctorUser.save();
      console.log(`✅ Created doctor profile: ${doctor.name} (ID: ${doctor._id})`);
    } else {
      console.log(`✅ Found Dr. Sarah Mitchell: ${doctor.name} (ID: ${doctor._id})`);
    }

    // 2. Find existing patients (get first 5 patients)
    console.log('\n🔍 Finding existing patients...');
    const patients = await Patient.find({}).limit(5);
    
    if (patients.length === 0) {
      console.log('⚠️  No patients found. Creating sample patients...');
      
      const bcrypt = require('bcryptjs');
      const samplePatients = [
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
        }
      ];

      for (const data of samplePatients) {
        const patientUser = new User({
          name: data.fullName,
          email: `${data.fullName.toLowerCase().replace(/\s+/g, '.')}@patient.test.com`,
          passwordHash: await bcrypt.hash('Patient@123', 10),
          role: "patient"
        });
        await patientUser.save();

        const patient = new Patient({
          userId: patientUser._id,
          ...data
        });
        await patient.save();
        
        patientUser.patientId = patient._id;
        await patientUser.save();
        
        patients.push(patient);
        console.log(`✅ Created patient: ${patient.fullName} (ID: ${patient._id})`);
      }
    } else {
      console.log(`✅ Found ${patients.length} existing patients`);
      patients.forEach(p => console.log(`   - ${p.fullName} (ID: ${p._id})`));
    }

    // 3. Create appointments for Dr. Sarah Mitchell with these patients
    console.log('\n📅 Creating appointments for Dr. Sarah Mitchell...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const appointmentsData = [
      {
        patient: patients[0],
        date: today.toISOString().split('T')[0],
        time: "10:00 AM",
        type: "checkup",
        status: "pending",
        reason: "Routine cardiac checkup",
        symptoms: "Chest pain, shortness of breath"
      },
      {
        patient: patients[1] || patients[0],
        date: today.toISOString().split('T')[0],
        time: "11:30 AM",
        type: "followup",
        status: "pending",
        reason: "Follow-up on hypertension medication",
        symptoms: "Follow-up on hypertension medication"
      },
      {
        patient: patients[2] || patients[0],
        date: tomorrow.toISOString().split('T')[0],
        time: "02:00 PM",
        type: "checkup",
        status: "accepted",
        reason: "Routine checkup",
        symptoms: "Irregular heartbeat",
        notes: "Patient confirmed for appointment"
      },
      {
        patient: patients[0],
        date: dayAfter.toISOString().split('T')[0],
        time: "10:30 AM",
        type: "followup",
        status: "accepted",
        reason: "Post-treatment follow-up",
        symptoms: "Post-treatment monitoring",
        notes: "Continue current medication"
      }
    ].filter(apt => apt.patient); // Filter out appointments without patients

    const createdAppointments = [];
    for (const data of appointmentsData) {
      // Check if appointment already exists
      const existing = await Appointment.findOne({
        patientId: data.patient._id,
        doctorId: doctor._id,
        date: data.date,
        time: data.time
      });

      if (!existing) {
        const appointment = new Appointment({
          patientId: data.patient._id,
          doctorId: doctor._id,
          date: data.date,
          time: data.time,
          type: data.type,
          status: data.status,
          reason: data.reason,
          symptoms: data.symptoms,
          notes: data.notes || "",
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialization
        });
        await appointment.save();
        createdAppointments.push(appointment);
        console.log(`✅ Created appointment: ${data.patient.fullName} - ${data.type} (${data.status}) on ${data.date} at ${data.time}`);
      } else {
        console.log(`⏭️  Appointment already exists: ${data.patient.fullName} on ${data.date} at ${data.time}`);
      }
    }

    // 4. Summary
    console.log('\n✅ ========================================');
    console.log('✅ LINKING COMPLETE!');
    console.log('✅ ========================================');
    console.log(`\n📊 Summary:`);
    console.log(`   - Doctor: ${doctor.name} (ID: ${doctor._id})`);
    console.log(`   - Specialization: ${doctor.specialization}`);
    console.log(`   - Linked with ${patients.length} patients`);
    console.log(`   - Created ${createdAppointments.length} new appointments`);
    console.log(`   - Total appointments for Dr. Sarah Mitchell: ${await Appointment.countDocuments({ doctorId: doctor._id })}`);
    console.log('\n✅ Dr. Sarah Mitchell is now linked with patients and has appointments!');
    console.log('✅ She will appear in the doctor dropdown when booking appointments.');

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error linking Dr. Sarah Mitchell:', error);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
linkSarahMitchellWithPatients();

