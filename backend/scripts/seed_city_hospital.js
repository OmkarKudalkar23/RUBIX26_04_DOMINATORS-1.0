const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const HospitalBed = require('../models/HospitalBed');

const MONGO_URI = "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => seedCityHospital())
    .catch(err => console.error(err));

async function seedCityHospital() {
    try {
        console.log("🏥 Seeding City Hospital...");

        // 1. Create/Update Link User
        const email = "admin@cityhospital.com";
        let user = await User.findOne({ email });

        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash("password123", salt);
            user = new User({
                name: "City Hospital Admin",
                email,
                passwordHash,
                role: "hospital"
            });
            await user.save();
            console.log("✅ Created User: admin@cityhospital.com");
        } else {
            console.log("ℹ️ User admin@cityhospital.com already exists");
        }

        // 2. Create/Update Hospital Profile
        let hospital = await Hospital.findOne({ userId: user._id });
        if (!hospital) {
            hospital = new Hospital({
                userId: user._id,
                name: "City Hospital",
                phone: "+91-22-9988-7766",
                address: "Downtown, Mumbai",
                bedTypes: [
                    { type: "General", count: 20 },
                    { type: "ICU", count: 10 }
                ]
            });
            await hospital.save();

            user.hospitalId = hospital._id;
            await user.save();
            console.log("✅ Created Hospital Profile: City Hospital");
        } else {
            console.log("ℹ️ Hospital Profile exists");
        }

        // 3. Create/Update Beds
        // We want to ensure we have detailed bed records for "General" to test our features.
        let generalBeds = await HospitalBed.findOne({ hospitalId: hospital._id, type: "General" });

        if (!generalBeds) {
            generalBeds = new HospitalBed({
                hospitalId: hospital._id,
                type: "General",
                total: 20,
                occupied: 0,
                available: 20,
                beds: []
            });
        }

        // Populate/Refill beds array
        // We will seed them with "available" first, or mixed states if we want to test immediately
        // But for now, let's just ensure they exist.
        if (!generalBeds.beds || generalBeds.beds.length === 0) {
            const beds = [];
            for (let i = 1; i <= 20; i++) {
                beds.push({ number: i, status: 'available' });
            }
            generalBeds.beds = beds;
            generalBeds.total = 20;
            generalBeds.available = 20;
            generalBeds.occupied = 0;
        }

        await generalBeds.save();
        console.log("✅ Seeded General Ward Beds");

        console.log("🎉 City Hospital Seeding Complete");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}
