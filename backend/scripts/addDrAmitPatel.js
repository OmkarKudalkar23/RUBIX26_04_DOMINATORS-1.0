/**
 * Script to add Dr. Amit Patel to the database
 * Email: amit.patel@example.com
 * Password: password123
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function addDrAmitPatel() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Check if user already exists
        const existingUser = await User.findOne({ email: 'amit.patel@example.com' });
        if (existingUser) {
            console.log('⚠️  Dr. Amit Patel already exists in the database');
            console.log('Email: amit.patel@example.com');
            console.log('Password: password123');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Create Doctor User
        console.log('👤 Creating Dr. Amit Patel user...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        const doctorUser = new User({
            name: "Dr. Amit Patel",
            email: "amit.patel@example.com",
            passwordHash: passwordHash,
            role: "doctor"
        });
        await doctorUser.save();
        console.log(`✅ Created doctor user: ${doctorUser.email} (ID: ${doctorUser._id})`);

        // Create Doctor Profile
        console.log('🩺 Creating doctor profile...');
        const doctor = new Doctor({
            userId: doctorUser._id,
            name: "Dr. Amit Patel",
            age: 34,
            gender: "male",
            dob: new Date('1991-04-21'),
            phone: "+91-9820012347",
            address: "Andheri, Mumbai",
            specialization: "Pulmonologist",
            education: "MBBS, MD (Pulmonology)",
            certificateUrl: "https://example.com/certificates/doctor.pdf",
            aadhaarUrl: "https://example.com/aadhaar/doctor.jpg"
        });
        await doctor.save();

        // Update user with doctorId
        doctorUser.doctorId = doctor._id;
        await doctorUser.save();
        console.log(`✅ Created doctor profile: ${doctor.name} (ID: ${doctor._id})`);

        // Summary
        console.log('\n✅ ========================================');
        console.log('✅ Dr. Amit Patel Added Successfully!');
        console.log('✅ ========================================');
        console.log(`\n📋 Login Credentials:`);
        console.log(`   Email: amit.patel@example.com`);
        console.log(`   Password: password123`);
        console.log(`   Role: Doctor`);
        console.log(`   Specialization: Pulmonologist`);
        console.log('\n✅ You can now log in to the Doctor Dashboard!');

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error adding Dr. Amit Patel:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the function
addDrAmitPatel();
