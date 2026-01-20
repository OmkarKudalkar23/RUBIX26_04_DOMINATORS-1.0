/**
 * Seed script to populate MongoDB with sample data for a specific doctor
 * 
 * Usage: node scripts/seedMyDoctorData.js
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
const DoctorMedicalRecord = require('../models/DoctorMedicalRecord');
const path = require('path');
const fs = require('fs');

// MongoDB connection
const MONGO_URI = "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

const TARGET_DOCTOR_EMAIL = 'doctor@gmail.com';

async function seedMyDoctorData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // 1. Find Target Doctor
        const doctorUser = await User.findOne({ email: TARGET_DOCTOR_EMAIL });
        if (!doctorUser) {
            console.error(`❌ User with email ${TARGET_DOCTOR_EMAIL} not found. Please sign up first.`);
            process.exit(1);
        }

        let doctor = await Doctor.findOne({ userId: doctorUser._id });
        if (!doctor) {
            console.log('ℹ️ Doctor profile not found, creating one...');
            doctor = new Doctor({
                userId: doctorUser._id,
                name: doctorUser.name || "Dr. User",
                age: 35,
                gender: "female",
                dob: new Date('1988-01-01'),
                phone: "+1 (555) 000-0000",
                address: "Mumbai, India",
                specialization: "General Physician",
                education: "MBBS",
                certificateUrl: "",
                aadhaarUrl: ""
            });
            await doctor.save();
            doctorUser.doctorId = doctor._id;
            await doctorUser.save();
            console.log('✅ Created doctor profile');
        } else {
            console.log(`✅ Found doctor profile: ${doctor.name}`);
        }

        // 2. Clear existing appointments/records for this doctor (optional, to avoid duplicates)
        console.log('🧹 Clearing existing appointments and records for this doctor...');
        await Appointment.deleteMany({ doctorId: doctor._id });
        await DoctorMedicalRecord.deleteMany({ doctorId: doctor._id });

        // 3. Create Sample Patients (if they don't exist, or just create new ones linked to this doctor implicitly via appointment)
        // We'll create some dedicated patients for this doctor
        console.log('👥 Creating/Finding patients...');
        const patientNames = ["Rahul Sharma", "Priya Patel", "Amit Singh", "Sneha Gupta", "Vikram Malhotra"];
        const patients = [];

        for (const name of patientNames) {
            // Check if patient user exists, else create
            const email = `${name.toLowerCase().replace(/\s+/g, '.')}@demo.com`;
            let pUser = await User.findOne({ email });
            if (!pUser) {
                pUser = new User({
                    name: name,
                    email: email,
                    passwordHash: await bcrypt.hash('password', 10),
                    role: 'patient'
                });
                await pUser.save();
            }

            let patient = await Patient.findOne({ userId: pUser._id });
            if (!patient) {
                patient = new Patient({
                    userId: pUser._id,
                    fullName: name,
                    age: Math.floor(Math.random() * 40) + 20,
                    gender: Math.random() > 0.5 ? 'male' : 'female',
                    dob: new Date('1990-01-01'),
                    bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
                    phone: "9876543210",
                    address: "Mumbai",
                    medicalHistory: ["None"]
                });
                await patient.save();
                pUser.patientId = patient._id;
                await pUser.save();
            }
            patients.push(patient);
        }

        // 4. Create Appointments
        console.log('📅 Creating appointments...');
        const today = new Date();
        const appointmentsData = [
            { patient: patients[0], type: 'checkup', status: 'pending', time: '10:00 AM', symptoms: 'Fever and cold' },
            { patient: patients[1], type: 'followup', status: 'accepted', time: '11:00 AM', symptoms: 'Headache' },
            { patient: patients[2], type: 'emergency', status: 'pending', time: '12:00 PM', symptoms: 'Severe chest pain' },
            { patient: patients[3], type: 'checkup', status: 'accepted', time: '02:00 PM', symptoms: 'Regular checkup' },
            { patient: patients[4], type: 'followup', status: 'rejected', time: '04:00 PM', symptoms: 'Back pain' }
        ];

        for (const data of appointmentsData) {
            const apt = new Appointment({
                patientId: data.patient._id,
                doctorId: doctor._id,
                date: today.toISOString().split('T')[0],
                time: data.time,
                type: data.type,
                status: data.status,
                symptoms: data.symptoms,
                reason: data.symptoms
            });
            await apt.save();
            console.log(`✅ Created appointment for ${data.patient.fullName}`);
        }

        // 5. Create Doctor Medical Records
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../uploads/medical-records');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        console.log('📄 Creating medical records...');
        const recordTypes = ['report', 'prescription', 'xray'];

        for (let i = 0; i < 3; i++) {
            const type = recordTypes[i];
            const fileName = `demo_record_${i + 1}.txt`;
            const filePath = path.join(uploadsDir, fileName);

            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, "Demo medical record content");
            }

            const record = new DoctorMedicalRecord({
                doctorId: doctor._id,
                patientId: patients[i]._id,
                type: type,
                fileName: fileName,
                filePath: filePath,
                mimeType: 'text/plain',
                summary: `Demo summary for ${type}`,
                uploadDate: new Date()
            });
            await record.save();
            console.log(`✅ Created medical record: ${fileName}`);
        }

        console.log('\n✅ Seeding for ' + TARGET_DOCTOR_EMAIL + ' complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

seedMyDoctorData();
