const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('./models/Hospital');
const HospitalAppointment = require('./models/HospitalAppointment');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function seedOPD() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        const hospitals = await Hospital.find({});
        console.log(`Found ${hospitals.length} hospitals.`);

        // Clear existing appointments to avoid duplicates if re-run
        await HospitalAppointment.deleteMany({});
        console.log("Cleared existing Hospital Appointments.");

        const today = new Date();
        const statuses = ["scheduled", "completed", "cancelled"];
        const departments = ["Cardiology", "Orthopedics", "General Medicine", "Pediatrics"];
        const types = ["OPD", "Emergency", "Follow-up"];

        for (const hospital of hospitals) {
            const appointments = [];

            // Generate for last 7 days including today
            for (let i = 0; i < 8; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                // Random number of appointments per day (e.g. 10 to 50)
                const count = Math.floor(Math.random() * 40) + 10;

                for (let j = 0; j < count; j++) {
                    appointments.push({
                        hospitalId: hospital._id,
                        patientName: `Patient ${Math.floor(Math.random() * 1000)}`,
                        doctorName: `Dr. ${['Smith', 'Patel', 'Gupta', 'Khan', 'Lee'][Math.floor(Math.random() * 5)]}`,
                        department: departments[Math.floor(Math.random() * departments.length)],
                        date: dateStr,
                        time: "10:00 AM", // Simplified
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                        type: "OPD" // Focus on OPD for the chart
                    });
                }
            }

            await HospitalAppointment.insertMany(appointments);
            console.log(`✅ Seeded ${appointments.length} appointments for ${hospital.name}`);
        }

        console.log("🌱 OPD Seeding completed!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding OPD:", error);
        process.exit(1);
    }
}

seedOPD();
