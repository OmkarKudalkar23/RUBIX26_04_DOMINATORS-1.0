const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const date = '2026-01-20';

        // 1. Get Vikram's Hospital ID (The "Correct" one)
        const vikramSlot = await HospitalDoctorSlot.findOne({
            date: date,
            doctorName: { $regex: /Vikram/i }
        });

        if (!vikramSlot) {
            console.log("Could not find Vikram slot!");
            return;
        }

        const correctHospitalId = vikramSlot.hospitalId;
        console.log(`Correct Hospital ID (Vikram): ${correctHospitalId}`);

        // 2. Find Atharva's slots
        const atharvaSlots = await HospitalDoctorSlot.find({
            date: date,
            doctorName: { $regex: /Atharva/i }
        });

        console.log(`Found ${atharvaSlots.length} Atharva slots.`);
        if (atharvaSlots.length > 0) {
            console.log(`Atharva Current Hospital ID: ${atharvaSlots[0].hospitalId}`);
        }

        // 3. Update Atharva's hospitalId
        const res = await HospitalDoctorSlot.updateMany(
            { doctorName: { $regex: /Atharva/i } },
            { $set: { hospitalId: correctHospitalId } }
        );

        console.log(`Updated ${res.modifiedCount} slots for Atharva to Hospital ID ${correctHospitalId}.`);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
