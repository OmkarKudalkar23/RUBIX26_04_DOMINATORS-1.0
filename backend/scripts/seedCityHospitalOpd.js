/**
 * Seed script for City Hospital with complete data for admin@cityhospital.com
 * 
 * Usage: node scripts/seedCityHospitalOpd.js
 * 
 * This creates:
 * - Hospital user: admin@cityhospital.com / CityHospital@123 (role: hospital)
 * - Hospital profile for "City Hospital Mumbai"
 * - Doctor users with @cityhospital.com domain (linked to hospital)
 * - Sample beds, doctor slots, staff, surge alerts, appointments, and OPD check-ins
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const HospitalBed = require('../models/HospitalBed');
const HospitalDoctorSlot = require('../models/HospitalDoctorSlot');
const HospitalStaff = require('../models/HospitalStaff');
const HospitalSurgeAlert = require('../models/HospitalSurgeAlert');
const HospitalEnvironment = require('../models/HospitalEnvironment');
const HospitalAppointment = require('../models/HospitalAppointment');
const HospitalOpdCheckIn = require('../models/HospitalOpdCheckIn');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

const HOSPITAL_EMAIL = 'admin@cityhospital.com';
const HOSPITAL_PASSWORD = 'CityHospital@123';
const DOCTOR_PASSWORD = 'Doctor@123';

async function seedCityHospitalOpd() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Clean up existing hospital data
        console.log('🧹 Cleaning up existing City Hospital data...');
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
                await HospitalOpdCheckIn.deleteMany({ hospitalId: existingHospital._id });
                await Hospital.deleteOne({ _id: existingHospital._id });
            }
            await User.deleteOne({ _id: existingUser._id });
        }

        // Clean up doctors with @cityhospital.com domain
        const domainDoctors = await User.find({ email: /@cityhospital\.com$/i, role: 'doctor' });
        for (const doc of domainDoctors) {
            if (doc.doctorId) {
                await Doctor.deleteOne({ _id: doc.doctorId });
            }
            await User.deleteOne({ _id: doc._id });
        }
        console.log('✅ Cleanup complete');

        const salt = await bcrypt.genSalt(10);

        // 1. Create Hospital User
        console.log('👤 Creating hospital user...');
        const passwordHash = await bcrypt.hash(HOSPITAL_PASSWORD, salt);

        const hospitalUser = new User({
            name: "City Hospital Mumbai",
            email: HOSPITAL_EMAIL,
            passwordHash: passwordHash,
            role: "hospital"
        });
        await hospitalUser.save();
        console.log(`✅ Created hospital user: ${hospitalUser.email}`);

        // 2. Create Hospital Profile
        console.log('🏥 Creating hospital profile...');
        const hospital = new Hospital({
            userId: hospitalUser._id,
            name: "City Hospital Mumbai",
            phone: "+91 22 9876 5432",
            address: "456 Medical Plaza, Bandra West, Mumbai, Maharashtra"
        });
        await hospital.save();
        console.log(`✅ Created hospital profile: ${hospital.name}`);

        // 3. Create Doctor Users with @cityhospital.com domain
        console.log('👨‍⚕️ Creating doctor users + profiles...');
        const doctorDefs = [
            { name: "Dr. Priya Sharma", specialization: "General Medicine", department: "General" },
            { name: "Dr. Vikram Singh", specialization: "Cardiology", department: "Cardiac" },
            { name: "Dr. Anita Desai", specialization: "Pediatrics", department: "Pediatrics" },
            { name: "Dr. Rajesh Kumar", specialization: "Pulmonology", department: "Respiratory" },
            { name: "Dr. Meera Nair", specialization: "Orthopedics", department: "Orthopedics" }
        ];

        const createdDoctors = [];
        const doctorCreds = [];

        for (const d of doctorDefs) {
            // Create email like dr.priya.sharma@cityhospital.com
            const base = d.name
                .toLowerCase()
                .replace(/^dr\.\s*/i, 'dr.')
                .replace(/[^a-z0-9]+/g, '.')
                .replace(/\.+/g, '.')
                .replace(/\.$/, '');
            const email = `${base}@cityhospital.com`;

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

            createdDoctors.push({ ...d, doctorId: doctorProfile._id, userId: doctorUser._id });
            doctorCreds.push({ name: d.name, email, password: DOCTOR_PASSWORD });
            console.log(`  ✅ Doctor created: ${d.name} (${email})`);
        }

        // 4. Create Beds
        console.log('🛏️  Creating beds...');
        const beds = [
            { type: "ICU", total: 30, occupied: 22, available: 8 },
            { type: "General", total: 150, occupied: 110, available: 40 },
            { type: "Private", total: 60, occupied: 45, available: 15 },
            { type: "Emergency", total: 20, occupied: 14, available: 6 }
        ];

        for (const bedData of beds) {
            await HospitalBed.create({ hospitalId: hospital._id, ...bedData });
            console.log(`  ✅ Created ${bedData.type} bed: ${bedData.total} total`);
        }

        // 5. Create Doctor Slots
        console.log('👨‍⚕️ Creating doctor slots...');
        const today = new Date().toISOString().split('T')[0];

        const doctorSlots = [
            {
                doctorName: "Dr. Priya Sharma",
                specialization: "General Medicine",
                department: "General",
                date: today,
                slots: [
                    { time: "09:00 AM", status: "booked", patientName: "Amit Kumar" },
                    { time: "09:30 AM", status: "booked", patientName: "Neha Gupta" },
                    { time: "10:00 AM", status: "available" },
                    { time: "10:30 AM", status: "booked", patientName: "Raj Patel" },
                    { time: "11:00 AM", status: "available" },
                    { time: "11:30 AM", status: "available" },
                    { time: "02:00 PM", status: "available" },
                    { time: "02:30 PM", status: "blocked" },
                    { time: "03:00 PM", status: "available" }
                ]
            },
            {
                doctorName: "Dr. Vikram Singh",
                specialization: "Cardiology",
                department: "Cardiac",
                date: today,
                slots: [
                    { time: "10:00 AM", status: "available" },
                    { time: "10:30 AM", status: "booked", patientName: "Sunita Reddy" },
                    { time: "11:00 AM", status: "available" },
                    { time: "02:00 PM", status: "available" },
                    { time: "02:30 PM", status: "booked", patientName: "Arun Joshi" },
                    { time: "03:00 PM", status: "available" },
                    { time: "03:30 PM", status: "booked", patientName: "Sanjay Mehta" },
                    { time: "04:00 PM", status: "available" }
                ]
            },
            {
                doctorName: "Dr. Anita Desai",
                specialization: "Pediatrics",
                department: "Pediatrics",
                date: today,
                slots: [
                    { time: "09:00 AM", status: "booked", patientName: "Child: Rohan (Parent: Meera)" },
                    { time: "09:30 AM", status: "available" },
                    { time: "10:00 AM", status: "booked", patientName: "Child: Priya (Parent: Sanjay)" },
                    { time: "10:30 AM", status: "available" },
                    { time: "11:00 AM", status: "available" },
                    { time: "02:00 PM", status: "booked", patientName: "Child: Arjun (Parent: Kavita)" },
                    { time: "02:30 PM", status: "available" }
                ]
            },
            {
                doctorName: "Dr. Rajesh Kumar",
                specialization: "Pulmonology",
                department: "Respiratory",
                date: today,
                slots: [
                    { time: "09:00 AM", status: "booked", patientName: "Kiran Rao" },
                    { time: "09:30 AM", status: "booked", patientName: "Deepak Sharma" },
                    { time: "10:00 AM", status: "available" },
                    { time: "10:30 AM", status: "available" },
                    { time: "11:00 AM", status: "booked", patientName: "Venkat Iyer" },
                    { time: "02:00 PM", status: "available" },
                    { time: "02:30 PM", status: "available" }
                ]
            },
            {
                doctorName: "Dr. Meera Nair",
                specialization: "Orthopedics",
                department: "Orthopedics",
                date: today,
                slots: [
                    { time: "10:00 AM", status: "available" },
                    { time: "10:30 AM", status: "booked", patientName: "Rakesh Gupta" },
                    { time: "11:00 AM", status: "available" },
                    { time: "02:00 PM", status: "booked", patientName: "Sunil Patil" },
                    { time: "02:30 PM", status: "available" },
                    { time: "03:00 PM", status: "available" }
                ]
            }
        ];

        for (const slotData of doctorSlots) {
            await HospitalDoctorSlot.create({ hospitalId: hospital._id, ...slotData });
            console.log(`  ✅ Created slots for ${slotData.doctorName}`);
        }

        // 6. Create Staff
        console.log('👥 Creating staff...');
        const staffMembers = [
            { name: "Kavita Nair", role: "Nurse", department: "General", shift: "Morning", status: "active" },
            { name: "Suresh Menon", role: "Technician", department: "Radiology", shift: "Evening", status: "active" },
            { name: "Lakshmi Pillai", role: "Nurse", department: "ICU", shift: "Night", status: "active" },
            { name: "Rajesh Iyer", role: "Admin", department: "Administration", shift: "Morning", status: "active" },
            { name: "Deepa Thomas", role: "Nurse", department: "Pediatrics", shift: "Morning", status: "active" },
            { name: "Anil Sharma", role: "Nurse", department: "Cardiac", shift: "Evening", status: "active" },
            { name: "Priti Joshi", role: "Technician", department: "Laboratory", shift: "Morning", status: "active" },
            { name: "Mohan Das", role: "Support", department: "Maintenance", shift: "Morning", status: "off-duty" }
        ];

        for (const staffData of staffMembers) {
            await HospitalStaff.create({ hospitalId: hospital._id, ...staffData });
            console.log(`  ✅ Created staff: ${staffData.name} (${staffData.role})`);
        }

        // 7. Create Surge Alerts
        console.log('⚠️  Creating surge alerts...');
        const alerts = [
            {
                type: "pollution",
                severity: "high",
                title: "High Air Pollution Alert",
                message: "AQI levels reaching 280 - Expect surge in respiratory patients",
                prediction: "+35% increase in respiratory cases expected",
                date: today,
                department: "Respiratory",
                expectedIncrease: 35,
                recommendations: [
                    "Prepare 8 additional beds in respiratory ward",
                    "Stock nebulizers and inhalers",
                    "Add pulmonologist on standby",
                    "Increase oxygen supply reserves",
                    "Alert ICU for potential severe cases"
                ]
            },
            {
                type: "seasonal",
                severity: "medium",
                title: "Monsoon Season Alert",
                message: "Heavy rains expected - Increased waterborne diseases",
                prediction: "+20% increase in gastro cases",
                date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                department: "General",
                expectedIncrease: 20,
                recommendations: [
                    "Stock ORS and IV fluids",
                    "Prepare isolation beds",
                    "Brief staff on cholera/typhoid protocols",
                    "Increase sanitation measures"
                ]
            },
            {
                type: "epidemic",
                severity: "low",
                title: "Flu Season Advisory",
                message: "Seasonal flu cases rising gradually",
                prediction: "+15% increase in flu cases",
                date: today,
                department: "General",
                expectedIncrease: 15,
                recommendations: [
                    "Stock antivirals",
                    "Promote flu vaccination",
                    "Increase mask usage advisory"
                ]
            },
            {
                type: "weather",
                severity: "medium",
                title: "Heat Wave Warning",
                message: "Temperature expected to reach 40°C this week",
                prediction: "+25% increase in heat stroke cases",
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                department: "Emergency",
                expectedIncrease: 25,
                recommendations: [
                    "Stock electrolyte solutions",
                    "Prepare cooling facilities in emergency",
                    "Alert ambulance teams",
                    "Increase emergency staff"
                ]
            }
        ];

        for (const alertData of alerts) {
            await HospitalSurgeAlert.create({ hospitalId: hospital._id, ...alertData });
            console.log(`  ✅ Created alert: ${alertData.title}`);
        }

        // 8. Create Environment Data
        console.log('🌍 Creating environment data...');
        await HospitalEnvironment.create({
            hospitalId: hospital._id,
            aqi: 180,
            temperature: 32,
            humidity: 70,
            pollutionLevel: "Moderate",
            festivalFlag: false
        });
        console.log('  ✅ Created environment data');

        // 9. Create Appointments
        console.log('📅 Creating appointments...');
        const appointments = [
            // Morning OPD
            { patientName: "Amit Kumar", doctorName: "Dr. Priya Sharma", department: "General", date: today, time: "09:00 AM", status: "completed", type: "OPD" },
            { patientName: "Neha Gupta", doctorName: "Dr. Priya Sharma", department: "General", date: today, time: "09:30 AM", status: "completed", type: "OPD" },
            { patientName: "Raj Patel", doctorName: "Dr. Priya Sharma", department: "General", date: today, time: "10:30 AM", status: "scheduled", type: "OPD" },
            { patientName: "Sunita Reddy", doctorName: "Dr. Vikram Singh", department: "Cardiac", date: today, time: "10:30 AM", status: "completed", type: "OPD" },
            { patientName: "Kiran Rao", doctorName: "Dr. Rajesh Kumar", department: "Respiratory", date: today, time: "09:00 AM", status: "completed", type: "OPD" },
            { patientName: "Deepak Sharma", doctorName: "Dr. Rajesh Kumar", department: "Respiratory", date: today, time: "09:30 AM", status: "scheduled", type: "OPD" },
            // Afternoon OPD
            { patientName: "Arun Joshi", doctorName: "Dr. Vikram Singh", department: "Cardiac", date: today, time: "02:30 PM", status: "scheduled", type: "OPD" },
            { patientName: "Sanjay Mehta", doctorName: "Dr. Vikram Singh", department: "Cardiac", date: today, time: "03:30 PM", status: "scheduled", type: "OPD" },
            { patientName: "Child: Rohan", doctorName: "Dr. Anita Desai", department: "Pediatrics", date: today, time: "09:00 AM", status: "scheduled", type: "OPD" },
            { patientName: "Rakesh Gupta", doctorName: "Dr. Meera Nair", department: "Orthopedics", date: today, time: "10:30 AM", status: "scheduled", type: "OPD" },
            { patientName: "Sunil Patil", doctorName: "Dr. Meera Nair", department: "Orthopedics", date: today, time: "02:00 PM", status: "scheduled", type: "OPD" },
            // Follow-ups
            { patientName: "Venkat Iyer", doctorName: "Dr. Rajesh Kumar", department: "Respiratory", date: today, time: "11:00 AM", status: "scheduled", type: "Follow-up" },
            { patientName: "Anita Bose", doctorName: "Dr. Priya Sharma", department: "General", date: today, time: "03:00 PM", status: "scheduled", type: "Follow-up" }
        ];

        for (const aptData of appointments) {
            await HospitalAppointment.create({ hospitalId: hospital._id, ...aptData });
        }
        console.log(`  ✅ Created ${appointments.length} appointments`);

        // 10. Create OPD Check-ins
        console.log('🧾 Creating OPD check-ins...');
        const opdCheckIns = [
            // Completed
            { patientName: "Amit Kumar", department: "General", doctorName: "Dr. Priya Sharma", visitType: "OPD", status: "completed", priority: "normal", queueNumber: 1 },
            { patientName: "Neha Gupta", department: "General", doctorName: "Dr. Priya Sharma", visitType: "OPD", status: "completed", priority: "normal", queueNumber: 2 },
            { patientName: "Sunita Reddy", department: "Cardiac", doctorName: "Dr. Vikram Singh", visitType: "OPD", status: "completed", priority: "high", queueNumber: 3 },
            { patientName: "Kiran Rao", department: "Respiratory", doctorName: "Dr. Rajesh Kumar", visitType: "OPD", status: "completed", priority: "normal", queueNumber: 4 },

            // In-consultation
            { patientName: "Raj Patel", department: "General", doctorName: "Dr. Priya Sharma", visitType: "OPD", status: "in-consult", priority: "normal", queueNumber: 5 },
            { patientName: "Child: Rohan (Parent: Meera)", department: "Pediatrics", doctorName: "Dr. Anita Desai", visitType: "OPD", status: "in-consult", priority: "high", queueNumber: 6 },
            { patientName: "Deepak Sharma", department: "Respiratory", doctorName: "Dr. Rajesh Kumar", visitType: "OPD", status: "in-consult", priority: "normal", queueNumber: 7 },

            // Waiting (checked-in)
            { patientName: "Arun Joshi", department: "Cardiac", doctorName: "Dr. Vikram Singh", visitType: "OPD", status: "checked-in", priority: "normal", queueNumber: 8 },
            { patientName: "Meenakshi Sharma", department: "General", doctorName: "Dr. Priya Sharma", visitType: "OPD", status: "checked-in", priority: "normal", queueNumber: 9 },
            { patientName: "Rahul Verma", department: "General", doctorName: "Dr. Priya Sharma", visitType: "OPD", status: "checked-in", priority: "low", queueNumber: 10 },
            { patientName: "Pooja Kapoor", department: "Pediatrics", doctorName: "Dr. Anita Desai", visitType: "OPD", status: "checked-in", priority: "critical", queueNumber: 11 },
            { patientName: "Sanjay Mehta", department: "Cardiac", doctorName: "Dr. Vikram Singh", visitType: "OPD", status: "checked-in", priority: "high", queueNumber: 12 },
            { patientName: "Anita Bose", department: "General", doctorName: "Dr. Priya Sharma", visitType: "Follow-up", status: "checked-in", priority: "normal", queueNumber: 13 },
            { patientName: "Vijay Krishnan", department: "Cardiac", doctorName: "Dr. Vikram Singh", visitType: "OPD", status: "checked-in", priority: "normal", queueNumber: 14 },
            { patientName: "Rakesh Gupta", department: "Orthopedics", doctorName: "Dr. Meera Nair", visitType: "OPD", status: "checked-in", priority: "normal", queueNumber: 15 },

            // In-triage
            { patientName: "Emergency: Ravi Kumar", department: "General", doctorName: "Dr. Priya Sharma", visitType: "OPD", status: "in-triage", priority: "critical", queueNumber: 16 },
        ];

        for (let i = 0; i < opdCheckIns.length; i++) {
            await HospitalOpdCheckIn.create({
                hospitalId: hospital._id,
                checkInTime: new Date(Date.now() - (i * 10 * 60000)),
                ...opdCheckIns[i]
            });
        }
        console.log(`  ✅ Created ${opdCheckIns.length} OPD check-ins`);

        // Summary
        console.log(`\n✅ Successfully seeded City Hospital data!`);
        console.log(`\n📋 Summary:`);
        console.log(`   Hospital: ${hospital.name} (${HOSPITAL_EMAIL})`);
        console.log(`   Doctors: ${doctorDefs.length} with @cityhospital.com domain`);
        console.log(`   Beds: ${beds.length} types`);
        console.log(`   Doctor Slots: ${doctorSlots.length} doctors with slots`);
        console.log(`   Staff: ${staffMembers.length} members`);
        console.log(`   Surge Alerts: ${alerts.length} alerts`);
        console.log(`   Appointments: ${appointments.length} appointments`);
        console.log(`   OPD Check-ins: ${opdCheckIns.length} patients`);
        console.log(`\n🔑 Hospital Login:`);
        console.log(`   Email: ${HOSPITAL_EMAIL}`);
        console.log(`   Password: ${HOSPITAL_PASSWORD}`);
        console.log(`\n👨‍⚕️ Doctor Logins (all use password: ${DOCTOR_PASSWORD}):`);
        for (const cred of doctorCreds) {
            console.log(`   ${cred.name}: ${cred.email}`);
        }

    } catch (error) {
        console.error('❌ Error seeding City Hospital:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

// Run the seed function
seedCityHospitalOpd()
    .then(() => {
        console.log('\n🎉 Seed script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seed script failed:', error);
        process.exit(1);
    });
