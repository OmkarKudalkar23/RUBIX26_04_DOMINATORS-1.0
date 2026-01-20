const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');
const Doctor = require('./models/Doctor'); // Assuming this model exists

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Fixing typos in HospitalDoctorSlot...');
        const resSlots = await HospitalDoctorSlot.updateMany(
            { department: 'Caridology' }, // The typo seen in screenshot
            { $set: { department: 'Cardiology' } }
        );
        console.log(`Updated ${resSlots.modifiedCount} slots.`);

        // Also check if it's 'Caridology' (case sensitive?) or just fix regex
        const resSlots2 = await HospitalDoctorSlot.updateMany(
            { department: { $regex: /Caridology/i } },
            { $set: { department: 'Cardiology' } }
        );
        console.log(`Updated ${resSlots2.modifiedCount} slots (regex match).`);


    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
