const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models - adjusting paths since this is in scripts/ folder
const User = require('../models/User');
const Patient = require('../models/Patient');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function seedXPatient() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        const email = 'x@gmail.com';
        const password = 'x';

        // Cleanup existing
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Find linked patient if any
            if (existingUser.patientId) {
                await Patient.deleteOne({ _id: existingUser.patientId });
            }
            // Also try to find by userId just in case
            await Patient.deleteMany({ userId: existingUser._id });

            await User.deleteOne({ _id: existingUser._id });
            console.log('🧹 Cleared existing user and patient profile');
        }

        // Create User
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({
            name: "X Patient",
            email,
            passwordHash,
            role: "patient"
        } catch (error) {
            console.error('❌ Error:', error);
            process.exit(1);
        }
    }

seedXPatient();
