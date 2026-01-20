const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const date = '2026-01-20';

        const slots = await HospitalDoctorSlot.find({
            date: date,
            doctorName: { $regex: /Atharva/i }
        });

        console.log(`Found ${slots.length} slots.`);
        if (slots.length > 0) {
            console.log(`HOSPITAL_ID: "${slots[0].hospitalId.toString()}"`);
            console.log(`DOCTOR_ID: "${slots[0].doctorId ? slots[0].doctorId.toString() : 'undefined'}"`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
