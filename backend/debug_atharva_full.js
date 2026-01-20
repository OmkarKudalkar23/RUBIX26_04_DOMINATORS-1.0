const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const date = '2026-01-20'; // UTC date that logic uses

        console.log(`Checking Atharva for Date: ${date}`);

        const slots = await HospitalDoctorSlot.find({
            date: date,
            doctorName: { $regex: /Atharva/i }
        });

        console.log(`Found ${slots.length} slots for Atharva.`);
        slots.forEach(s => {
            console.log(`ID: ${s._id}`);
            console.log(`HospID: ${s.hospitalId}`);
            console.log(`Dept: "${s.department}"`);
            console.log(`Active: ${s.isActive}`);
            console.log(`Patient: ${s.currentPatientId}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
