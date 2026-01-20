const mongoose = require('mongoose');
require('dotenv').config();
const HospitalDoctorSlot = require('./models/HospitalDoctorSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const slots = await HospitalDoctorSlot.find({});
        const depts = [...new Set(slots.map(s => s.department))];
        const doctors = slots.map(s => ({ name: s.doctorName, dept: s.department, isActive: s.isActive }));

        console.log('Unique Departments in Slots:', depts);
        console.log('Doctor Slots Details:', doctors);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
