const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Loose search for the two doctors
        const docs = await HospitalDoctorSlot.find({
            doctorName: { $regex: /Atharva|Vikram/i }
        }).sort({ createdAt: -1 }).limit(10);

        console.log('--- Targeted Doctor Slots ---');
        docs.forEach(s => {
            console.log(`Name: ${s.doctorName}`);
            console.log(`Dept: "${s.department}"`); // Quote it to see spaces/typos
            console.log(`Date: ${s.date}`);
            console.log(`Active: ${s.isActive}, CurrentPatient: ${s.currentPatientId}`);
            console.log('----------------');
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
