const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Hospital = require('./models/Hospital');
const HospitalBed = require('./models/HospitalBed');

const MONGO_URI = process.env.MONGO_URI;

async function checkHospitalLinks() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');

        // Get all hospital users
        const hospitalUsers = await User.find({ role: 'hospital' }).select('_id name email hospitalId');
        console.log('🏥 Hospital Users:');
        hospitalUsers.forEach(u => {
            console.log(`  - ${u.name}`);
            console.log(`    User ID: ${u._id}`);
            console.log(`    Hospital ID: ${u.hospitalId || 'NOT SET'}`);
        });

        // Get all hospitals from Hospital collection
        const hospitals = await Hospital.find({}).select('_id name address');
        console.log('\n🏥 Hospitals Collection:');
        hospitals.forEach(h => {
            console.log(`  - ${h.name}`);
            console.log(`    ID: ${h._id}`);
            console.log(`    Address: ${h.address || 'NOT SET'}`);
        });

        // Get unique hospital IDs from beds
        const beds = await HospitalBed.find({}).select('hospitalId type total');
        const uniqueHospitalIds = [...new Set(beds.map(b => b.hospitalId.toString()))];

        console.log('\n🛏️  Hospital IDs in Beds Collection:');
        uniqueHospitalIds.forEach(id => {
            const bedCount = beds.filter(b => b.hospitalId.toString() === id).length;
            const totalBeds = beds.filter(b => b.hospitalId.toString() === id).reduce((sum, b) => sum + b.total, 0);
            console.log(`  - Hospital ID: ${id}`);
            console.log(`    Bed types: ${bedCount}, Total beds: ${totalBeds}`);
        });

        console.log('\n📊 Summary:');
        console.log(`  Hospital Users: ${hospitalUsers.length}`);
        console.log(`  Hospitals: ${hospitals.length}`);
        console.log(`  Unique Hospital IDs in Beds: ${uniqueHospitalIds.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkHospitalLinks();
