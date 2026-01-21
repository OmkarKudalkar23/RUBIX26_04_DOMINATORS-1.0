const mongoose = require('mongoose');
const Doctor = require('../backend/models/Doctor');
require('dotenv').config({ path: '../backend/.env' });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function checkDuplicates() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const doctors = await Doctor.find({});
        console.log(`Found ${doctors.length} total doctor profiles.`);

        const nameMap = {};
        doctors.forEach(d => {
            const key = `${d.name}-${d.hospitalId}`;
            if (!nameMap[key]) {
                nameMap[key] = [];
            }
            nameMap[key].push(d);
        });

        let duplicateCount = 0;
        for (const key in nameMap) {
            if (nameMap[key].length > 1) {
                duplicateCount++;
                console.log(`\n⚠️ Duplicate found for: ${nameMap[key][0].name} (Hospital: ${nameMap[key][0].hospitalId})`);
                nameMap[key].forEach(d => {
                    console.log(`   - ID: ${d._id}, Specialization: ${d.specialization}, Dept: ${d.department}`);
                });
            }
        }

        if (duplicateCount === 0) {
            console.log("\n✅ No duplicate doctor profiles found.");
        }

    } catch (error) {
        console.error('Debug Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkDuplicates();
