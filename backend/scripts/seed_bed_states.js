const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const HospitalBed = require('../models/HospitalBed');
const Hospital = require('../models/Hospital');
const User = require('../models/User');

const MONGO_URI = "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => seedBedStates())
    .catch(err => console.error(err));

async function seedBedStates() {
    try {
        console.log("🛏️ Seeding Bed States for City Hospital...");

        // Find City Hospital user
        const user = await User.findOne({ email: "admin@cityhospital.com" });
        if (!user) {
            console.log("❌ City Hospital user not found. Run seed_city_hospital.js first.");
            process.exit(1);
        }

        const hospital = await Hospital.findOne({ userId: user._id });
        if (!hospital) {
            console.log("❌ Hospital profile not found.");
            process.exit(1);
        }

        // Find or create General ward beds
        let generalBeds = await HospitalBed.findOne({ hospitalId: hospital._id, type: "General" });

        if (!generalBeds) {
            generalBeds = new HospitalBed({
                hospitalId: hospital._id,
                type: "General",
                total: 20,
                beds: []
            });
        }

        // Populate beds array if empty
        if (!generalBeds.beds || generalBeds.beds.length < 10) {
            const newBeds = [];
            for (let i = 1; i <= 20; i++) {
                newBeds.push({ number: i, status: 'available' });
            }
            generalBeds.beds = newBeds;
        }

        // Set specific beds to various states for testing
        // Bed 1: Occupied
        generalBeds.beds[0] = {
            ...generalBeds.beds[0],
            number: 1,
            status: 'occupied',
            occupiedSince: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            admissionType: 'Emergency',
            priority: 'High',
            department: 'General'
        };

        // Bed 2: Reserved
        generalBeds.beds[1] = {
            ...generalBeds.beds[1],
            number: 2,
            status: 'reserved',
            notes: 'Reserved for incoming patient from ER'
        };

        // Bed 3: Cleaning
        generalBeds.beds[2] = {
            ...generalBeds.beds[2],
            number: 3,
            status: 'cleaning',
            cleaningEta: new Date(Date.now() + 15 * 60 * 1000) // 15 mins from now
        };

        // Bed 4: Discharge Pending
        generalBeds.beds[3] = {
            ...generalBeds.beds[3],
            number: 4,
            status: 'discharge_pending',
            occupiedSince: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            expectedDischargeTime: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
            admissionType: 'OPD',
            priority: 'Normal'
        };

        // Bed 5: Blocked
        generalBeds.beds[4] = {
            ...generalBeds.beds[4],
            number: 5,
            status: 'blocked',
            blockedReason: 'Equipment malfunction - awaiting repair'
        };

        // Bed 6-8: Available (default)
        for (let i = 5; i < 8; i++) {
            generalBeds.beds[i] = {
                ...generalBeds.beds[i],
                number: i + 1,
                status: 'available'
            };
        }

        // Bed 9: Occupied with ventilator
        generalBeds.beds[8] = {
            ...generalBeds.beds[8],
            number: 9,
            status: 'occupied',
            occupiedSince: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            admissionType: 'Surgery',
            priority: 'Critical',
            hasVentilator: true,
            hasOxygen: true,
            isIsolation: false
        };

        // Bed 10: Maintenance
        generalBeds.beds[9] = {
            ...generalBeds.beds[9],
            number: 10,
            status: 'maintenance',
            blockedReason: 'Scheduled maintenance'
        };

        await generalBeds.save();

        console.log("✅ Bed States Seeded:");
        console.log("   Bed 1: Occupied (Emergency, High Priority)");
        console.log("   Bed 2: Reserved");
        console.log("   Bed 3: Cleaning (ETA 15 mins)");
        console.log("   Bed 4: Discharge Pending");
        console.log("   Bed 5: Blocked (Equipment issue)");
        console.log("   Bed 6-8: Available");
        console.log("   Bed 9: Occupied (Surgery, Critical, Ventilator)");
        console.log("   Bed 10: Maintenance");
        console.log("🎉 Done!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}
