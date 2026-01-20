const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Searching for 'Atharva Mehta'...");
        const slots = await HospitalDoctorSlot.find({
            doctorName: { $regex: /Atharva/i }
        });

        console.log(`Found ${slots.length} slots for Atharva.`);
        slots.forEach(s => {
            console.log(JSON.stringify(s, null, 2));
            console.log('Date Type:', typeof s.date);
            console.log('Is Active Type:', typeof s.isActive);
        });

        const today = new Date().toISOString().split('T')[0];
        console.log(`\nSimulating Query for Date: "${today}" (String)`);

        const query = {
            doctorName: { $regex: /Atharva/i },
            date: today,
            isActive: true
        };
        const match = await HospitalDoctorSlot.findOne(query);
        console.log('Direct Query Match:', match ? 'YES' : 'NO');

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
