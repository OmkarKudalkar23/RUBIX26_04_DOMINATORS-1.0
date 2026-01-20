const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');
require('dotenv').config();

// Connect to DB
const MONGO_URI = "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const today = new Date().toISOString().split('T')[0];

        // Names to check (fuzzy)
        const names = ["Atharva", "Vikram"];

        console.log(`\n--- Checking Records for names: ${names.join(', ')} ---`);

        for (const name of names) {
            // 1. Check User
            const users = await User.find({ name: { $regex: name, $options: 'i' } });
            console.log(`\nFound ${users.length} Users matching "${name}":`);
            for (const u of users) {
                console.log(` - User: ${u.name} | Role: ${u.role} | ID: ${u._id}`);

                // 2. Check Doctor Profile
                const doc = await Doctor.findOne({ userId: u._id });
                console.log(`   > Doctor Profile: ${doc ? `Found (ID: ${doc._id}, Name: ${doc.name})` : 'MISSING'}`);

                // 3. Check Slot
                const slot = await HospitalDoctorSlot.findOne({
                    $or: [{ doctorName: { $regex: name, $options: 'i' } }, { doctorId: doc ? doc._id : null }],
                    date: today
                });
                if (slot) {
                    console.log(`   > Today's Slot: FOUND`);
                    console.log(`     Slot ID: ${slot._id}`);
                    console.log(`     Doctor Name in Slot: "${slot.doctorName}"`);
                    console.log(`     Doctor ID in Slot: ${slot.doctorId}`); // This is likely missing or different!
                    console.log(`     Current Patient: ${slot.currentPatientId}`);
                } else {
                    console.log(`   > Today's Slot: MISSING`);
                }
            }
        }

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
