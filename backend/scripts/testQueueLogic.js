const mongoose = require('mongoose');
const { addToQueue, updatePatientStatus, rebalanceQueue } = require('../services/queueService');
require('dotenv').config();

// Use your actual Mongo URI
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function runTest() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const hospitalId = new mongoose.Types.ObjectId("678dc23b567b5e432c66c303"); // Replace with valid hospital ID if needed
    const department = "Cardiology";

    console.log('🧪 Starting Queue Logic Test...');

    // Clear existing test data
    //   await mongoose.connection.collection('hospitalopdcheckins').deleteMany({ department });

    // 1. Add Normal Patient
    const p1 = await addToQueue({
        hospitalId,
        patientName: "Normal Patient",
        department,
        priority: "normal",
        arrivalStatus: "waiting",
        queueNumber: 0 // placeholder
    });
    console.log(`Added Normal Patient: Score ${p1.priorityScore}`);

    // 2. Add High Priority Patient (Should jump ahead)
    const p2 = await addToQueue({
        hospitalId,
        patientName: "High Priority Patient",
        department,
        priority: "high",
        arrivalStatus: "waiting",
        queueNumber: 0
    });
    console.log(`Added High Priority Patient: Score ${p2.priorityScore}`);

    // 3. Add Emergency Patient (Should be top)
    const p3 = await addToQueue({
        hospitalId,
        patientName: "Emergency Patient",
        department,
        priority: "critical", // map appropriately or use flag
        isEmergency: true,
        arrivalStatus: "waiting", // Logic should promote emergency even if not arrived? 
        // Actually my logic: emergency gives +5000, arrival +200. Emergency beats arrival.
        queueNumber: 0
    });
    console.log(`Added Emergency Patient: Score ${p3.priorityScore}`);

    // 4. Update Status: Normal Patient Arrives (Should boost score)
    console.log('🔄 Updating Normal Patient to ARRIVED...');
    const p1_updated = await updatePatientStatus(p1._id, { arrivalStatus: 'arrived' });
    console.log(`Normal Patient Updated Score: ${p1_updated.priorityScore}`);

    // 5. Verify Final Order
    const finalQueue = await rebalanceQueue(hospitalId, department);
    console.log('\n📋 Final Queue Order:');
    finalQueue.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (Score: ${p.score})`);
    });

    // Expected: 
    // 1. Emergency (Score ~5000+, even if waiting)
    // 2. High Priority (waiting) vs Normal (arrived)
    //    High: ~500 + waiting time
    //    Normal: 100 + 200 (arrived) = 300
    //    So High might still beat Normal depending on weights. 
    //    Let's check output.

    process.exit();
}

runTest().catch(console.error);
