const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

// Copy-pasted function logic (slightly modified to run standalone)
const assignDoctorAutomatically = async (hospitalId, department) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        console.log(`Querying: Hospital=${hospitalId}, Dept=${department}, Date=${today}`);

        const candidateSlots = await HospitalDoctorSlot.find({
            hospitalId,
            date: today,
            department: department,
            isActive: true
        });

        console.log(`Found ${candidateSlots.length} candidate slots.`);
        candidateSlots.forEach(s => {
            console.log(` - ${s.doctorName} (ID: ${s.doctorId}): CurrentPatient=${s.currentPatientId}`);
        });

        const freeSlots = candidateSlots.filter(s => !s.currentPatientId);
        console.log(`Found ${freeSlots.length} FREE slots.`);

        if (freeSlots.length > 0) {
            console.log(`Pick: ${freeSlots[0].doctorName} (ID: ${freeSlots[0].doctorId})`);
            return {
                _id: freeSlots[0].doctorId,
                name: freeSlots[0].doctorName
            };
        }

        const randomSlot = candidateSlots[Math.floor(Math.random() * candidateSlots.length)];
        console.log(`Fallback Pick: ${randomSlot.doctorName}`);
        return {
            _id: randomSlot.doctorId,
            name: randomSlot.doctorName
        };

    } catch (error) {
        console.error("Auto-assign error:", error);
        return null;
    }
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // Using the hospitalId from previous logs/context if possible, or just grab one
        // Let's assume the one from logs: 678e220677a2cc6c1032470c
        await assignDoctorAutomatically('678e220677a2cc6c1032470c', 'Cardiology');
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
