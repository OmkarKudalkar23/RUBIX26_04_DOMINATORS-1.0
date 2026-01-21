const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function cleanupDoctors() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const doctors = await Doctor.find({});
        console.log(`Scanning ${doctors.length} doctors for duplicates...`);

        const groups = {};
        doctors.forEach(d => {
            // Normalize name to catch "Dr. Vikram Singh" vs "Vikram Singh" if needed, 
            // but for now strict name match within same hospital
            const key = `${d.name.trim().toLowerCase()}|${d.hospitalId}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(d);
        });

        let removedCount = 0;

        for (const key in groups) {
            const group = groups[key];
            if (group.length > 1) {
                console.log(`\n🔍 Found ${group.length} records for "${group[0].name}"`);

                // Sort by creation time (assuming ObjectId has timestamp) or just keep first
                // We want to keep the one that might have slots assigned?
                // Let's check which one has slots?
                // For simplicity, we'll keep the first one and re-assign slots if needed.
                // Actually, better to keep the oldest one (first created).

                const keeper = group[0];
                const toRemove = group.slice(1);

                console.log(`   Keeping ID: ${keeper._id}`);

                for (const d of toRemove) {
                    console.log(`   🗑️ Removing ID: ${d._id}`);
                    await Doctor.findByIdAndDelete(d._id);

                    // Optional: Delete orphan slots for this deleted doctor
                    await HospitalDoctorSlot.deleteMany({ doctorId: d._id });
                    removedCount++;
                }
            }
        }

        console.log(`\n✅ Cleanup complete. Removed ${removedCount} duplicate profiles.`);

    } catch (error) {
        console.error('Cleanup Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanupDoctors();
