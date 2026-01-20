const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Hospital = require('../models/Hospital');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function fixHospitalUser() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected');

        // Find the hospital user
        const user = await User.findOne({ email: 'admin@cityhospital.com' });
        if (!user) {
            console.error('❌ User not found');
            process.exit(1);
        }

        console.log('Found user:', {
            id: user._id,
            email: user.email,
            role: user.role,
            hospitalId: user.hospitalId
        });

        // Find the hospital by userId
        let hospital = await Hospital.findOne({ userId: user._id });

        if (!hospital) {
            // Try to find by name or create one
            hospital = await Hospital.findOne({ name: /city.*hospital/i });

            if (!hospital) {
                console.log('Creating new hospital...');
                hospital = new Hospital({
                    userId: user._id,
                    name: 'City General Hospital',
                    phone: '1234567890',
                    address: 'Mumbai, India',
                    doctors: [],
                    bedTypes: []
                });
                await hospital.save();
                console.log('✅ Created new hospital:', hospital._id);
            }
        }

        console.log('Found/Created hospital:', {
            id: hospital._id,
            name: hospital.name,
            userId: hospital.userId
        });

        // Update user with hospitalId
        user.hospitalId = hospital._id;
        await user.save();

        console.log('✅ Updated user with hospitalId:', hospital._id);
        console.log('\n🎉 Fix complete! Please try logging in again.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixHospitalUser();
