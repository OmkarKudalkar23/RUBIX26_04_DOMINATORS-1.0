const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('./models/Hospital');
const HospitalBed = require('./models/HospitalBed');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function seedBeds() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        const hospitals = await Hospital.find({});
        console.log(`Found ${hospitals.length} hospitals.`);

        // Clear existing beds
        await HospitalBed.deleteMany({});
        console.log("Cleared existing Hospital Beds.");

        const bedTypes = ['General', 'ICU', 'Emergency', 'Private'];

        for (const hospital of hospitals) {
            console.log(`\n🏥 Seeding beds for ${hospital.name}...`);

            for (const type of bedTypes) {
                // Random total beds between 20-100
                const total = Math.floor(Math.random() * 80) + 20;

                // Random occupancy between 35% and 85%
                const occupancyRate = Math.random() * 0.5 + 0.35; // 0.35 to 0.85
                const occupied = Math.floor(total * occupancyRate);
                const available = total - occupied;

                // Create individual bed records
                const bedsArray = [];
                for (let i = 1; i <= total; i++) {
                    bedsArray.push({
                        number: i,
                        status: i <= occupied ? 'occupied' : 'available'
                    });
                }

                const bedRecord = new HospitalBed({
                    hospitalId: hospital._id,
                    type: type,
                    total: total,
                    occupied: occupied,
                    available: available,
                    beds: bedsArray
                });

                await bedRecord.save();
                console.log(`  ✅ ${type}: ${total} beds (${occupied} occupied, ${available} available)`);
            }
        }

        console.log("\n🌱 Bed Seeding completed!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding beds:", error);
        process.exit(1);
    }
}

seedBeds();
