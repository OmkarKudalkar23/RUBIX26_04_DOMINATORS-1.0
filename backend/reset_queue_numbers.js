const mongoose = require('mongoose');
require('dotenv').config();
const HospitalOpdCheckIn = require('./models/HospitalOpdCheckIn');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log(`Resetting queue numbers for: ${today.toDateString()}`);

        // Find all check-ins for today, sorted by creation time
        // We'll reset them globally per hospital/department combo?
        // Let's grouping by Hospital + Department

        const allToday = await HospitalOpdCheckIn.find({
            createdAt: { $gte: today }
        }).sort({ createdAt: 1 });

        console.log(`Found ${allToday.length} check-ins for today.`);

        // Group by department to sequence correctly
        const deptGroups = {};
        allToday.forEach(doc => {
            const key = `${doc.hospitalId}_${doc.department}`;
            if (!deptGroups[key]) deptGroups[key] = [];
            deptGroups[key].push(doc);
        });

        for (const key in deptGroups) {
            const docs = deptGroups[key];
            console.log(`Processing ${key}: ${docs.length} docs`);
            for (let i = 0; i < docs.length; i++) {
                const doc = docs[i];
                const newNum = i + 1;
                if (doc.queueNumber !== newNum) {
                    console.log(`Updating ${doc.patientName}: ${doc.queueNumber} -> ${newNum}`);
                    await HospitalOpdCheckIn.findByIdAndUpdate(doc._id, { queueNumber: newNum });
                }
            }
        }
        console.log("Queue reset complete.");

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
