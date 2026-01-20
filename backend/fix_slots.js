const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');
require('dotenv').config();

const MONGO_URI = "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const today = new Date().toISOString().split('T')[0];

        // Find all slots for today (or all time, safer to fix all)
        const slots = await HospitalDoctorSlot.find({
            $or: [{ doctorId: { $exists: false } }, { doctorId: null }]
        });

        console.log(`Found ${slots.length} slots missing doctorId.`);

        for (const slot of slots) {
            // Try to find the doctor by name
            // Strip "Dr." for fuzzy matching if needed, or exact match first

            let doctor = await Doctor.findOne({ name: slot.doctorName, hospitalId: slot.hospitalId });

            if (!doctor) {
                // Try fuzzy match (e.g. "Vikram Singh" vs "Dr. Vikram Singh")
                // Escape special chars
                const cleanName = slot.doctorName.replace(/^Dr\.?\s+/i, '').trim();
                const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                doctor = await Doctor.findOne({
                    name: { $regex: new RegExp(escapedName + '$', 'i') },
                    hospitalId: slot.hospitalId
                });
            }

            if (doctor) {
                slot.doctorId = doctor._id;
                await slot.save();
                console.log(`✅ Fixed Slot for "${slot.doctorName}" -> Linked to DoctorID: ${doctor._id}`);
            } else {
                console.log(`❌ Could not find Doctor profile for slot "${slot.doctorName}"`);
            }
        }

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
