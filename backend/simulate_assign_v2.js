const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const today = new Date().toISOString().split('T')[0];
        const dept = 'Cardiology'; // Fixed spelling
        const hospitalId = '678e220677a2cc6c1032470c'; // Matches logs

        console.log(`Searching for slots: Date=${today}, Dept=${dept}, Hosp=${hospitalId}`);

        const slots = await HospitalDoctorSlot.find({
            hospitalId: hospitalId,
            date: today,
            department: dept,
            isActive: true
        });

        console.log(`Found ${slots.length} slots.`);

        slots.forEach(s => {
            const isFree = !s.currentPatientId;
            console.log(`Slot: ${s.doctorName} | ID: ${s.doctorId} | Free: ${isFree} | CurrPat: ${s.currentPatientId}`);
        });

        if (slots.length === 0) {
            console.log("No slots found! Checking without hospitalId...");
            const looseSlots = await HospitalDoctorSlot.find({
                date: today,
                department: dept,
                isActive: true
            });
            console.log(`Found ${looseSlots.length} slots ignoring hospitalId.`);
            looseSlots.forEach(s => console.log(` - ${s.doctorName} (Hosp: ${s.hospitalId})`));
        }

    } catch (e) {
        console.error("FATAL ERROR:", e);
    } finally {
        mongoose.disconnect();
    }
};

run();
