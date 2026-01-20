const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const today2 = new Date();
        today2.setHours(0, 0, 0, 0);

        // Find ALL slots to see what's there
        const slots = await HospitalDoctorSlot.find({}).limit(20);

        console.log('--- Sample Slots (upto 20) ---');
        slots.forEach(s => {
            console.log(`Date: ${s.date}, Doc: ${s.doctorName}, Dept: "${s.department}", Active: ${s.isActive}, CurrentPatient: ${s.currentPatientId}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
