const mongoose = require('mongoose');
const HospitalDoctorSlot = require('../backend/models/HospitalDoctorSlot');
const HospitalOpdCheckIn = require('../backend/models/HospitalOpdCheckIn');
const Hospital = require('../backend/models/Hospital');
require('dotenv').config({ path: '../backend/.env' });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function debugSlots() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const today = new Date().toISOString().split('T')[0];
        console.log(`Searching for slots on date: ${today}`);

        // 1. Find the target doctor mentioned in the error: "Dr. Vikram Singh"
        // We'll search broadly in HospitalDoctorSlot
        const slots = await HospitalDoctorSlot.find({
            doctorName: { $regex: /Vikram Singh/i }
        });

        console.log(`\nFound ${slots.length} slots for "Vikram Singh":`);
        slots.forEach(s => {
            console.log(`- ID: ${s._id}, Date: ${s.date}, HospitalId: ${s.hospitalId}, Active: ${s.isActive}, CurrentPatient: ${s.currentPatientId}`);
        });

        // 2. Find OPD Check-ins for this doctor
        const checkins = await HospitalOpdCheckIn.find({
            doctorName: { $regex: /Vikram Singh/i },
            status: { $in: ['in-consult', 'checked-in'] }
        }).limit(5);

        console.log(`\nFound ${checkins.length} active check-ins for "Vikram Singh":`);
        checkins.forEach(c => {
            console.log(`- ID: ${c._id}, Status: ${c.status}, Patient: ${c.patientName}, DoctorID: ${c.doctorId}`);
        });

        if (slots.length === 0) {
            console.log("\n❌ NO SLOTS FOUND! The issue is likely that slots are not generated for TODAY.");
        } else {
            const todaySlot = slots.find(s => s.date === today);
            if (!todaySlot) {
                console.log(`\n❌ NO SLOT FOUND FOR TODAY (${today})!`);
            } else {
                console.log(`\n✅ Slot exists for today. ID: ${todaySlot._id}`);
            }
        }

    } catch (error) {
        console.error('Debug Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugSlots();
