const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const today = '2026-01-21'; // Explicitly today

        console.log(`Checking slots for DATE: ${today}`);

        const slots = await HospitalDoctorSlot.find({
            date: today
        }).sort({ doctorName: 1 });

        console.log(`Found ${slots.length} slots for today.`);
        slots.forEach(s => {
            console.log(`[${s.department}] ${s.doctorName} (Free: ${!s.currentPatientId})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
