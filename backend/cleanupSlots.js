const mongoose = require('mongoose');
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function cleanupSlots() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const slots = await HospitalDoctorSlot.find({});
        console.log(`Scanning ${slots.length} slots for duplicates...`);

        const groups = {};
        const today = new Date().toISOString().split('T')[0];

        slots.forEach(s => {
            // Group by Doctor + Date
            const key = `${s.doctorId}|${s.date}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(s);
        });

        let removedCount = 0;

        for (const key in groups) {
            const group = groups[key];
            if (group.length > 1) {
                console.log(`\n🔍 Found ${group.length} slots for DoctorID ${group[0].doctorId} on ${group[0].date}`);

                // Keep the one that is BUSY (currentPatientId != null) if any
                // Or the most recently updated one

                // Sort: Busy ones first, then by updatedAt desc
                group.sort((a, b) => {
                    const aBusy = !!a.currentPatientId;
                    const bBusy = !!b.currentPatientId;
                    if (aBusy && !bBusy) return -1; // a comes first
                    if (!aBusy && bBusy) return 1;
                    return new Date(b.updatedAt) - new Date(a.updatedAt); // Newest first
                });

                const keeper = group[0];
                const toRemove = group.slice(1);

                console.log(`   Keeping ID: ${keeper._id} (Busy: ${!!keeper.currentPatientId})`);

                for (const s of toRemove) {
                    console.log(`   🗑️ Removing ID: ${s._id} (Busy: ${!!s.currentPatientId})`);
                    await HospitalDoctorSlot.findByIdAndDelete(s._id);
                    removedCount++;
                }
            }
        }

        console.log(`\n✅ Cleanup complete. Removed ${removedCount} duplicate slots.`);

    } catch (error) {
        console.error('Cleanup Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanupSlots();
