const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const today = new Date().toISOString().split('T')[0];

        // Find slots for 'Cardiology' (or similar)
        const slots = await HospitalDoctorSlot.find({
            hospitalId: '678e220677a2cc6c1032470c', // From previous context logs if available, or just wild match
            date: today
        });

        console.log('--- All Slots for Today ---');
        slots.forEach(s => {
            console.log(`Doc: ${s.doctorName}, Dept: "${s.department}", Active: ${s.isActive}, CurrentPatient: ${s.currentPatientId}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
