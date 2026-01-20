const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('./models/Hospital');
const HospitalBed = require('./models/HospitalBed');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

async function seedHospitals() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Sample hospitals
        const hospitals = [
            { name: 'City General Hospital', address: '123 Main St, Mumbai' },
            { name: 'Apollo Medical Center', address: '456 Park Ave, Mumbai' },
            { name: 'Fortis Hospital', address: '789 Medical District, Mumbai' },
            { name: 'Lilavati Hospital', address: '321 Healthcare Blvd, Mumbai' },
            { name: 'Hinduja Hospital', address: '654 Wellness Road, Mumbai' },
        ];

        console.log('🏥 Creating hospitals...');

        for (const hospitalData of hospitals) {
            // Check if hospital already exists
            let hospital = await Hospital.findOne({ name: hospitalData.name });

            if (!hospital) {
                // Create hospital
                hospital = new Hospital(hospitalData);
                await hospital.save();
                console.log(`  ✅ Created: ${hospital.name}`);

                // Create user for hospital
                const user = new User({
                    name: hospitalData.name,
                    email: `${hospitalData.name.toLowerCase().replace(/\s+/g, '')}@hospital.com`,
                    password: 'hospital123', // Will be hashed by pre-save hook
                    role: 'hospital',
                    hospitalId: hospital._id
                });
                await user.save();
                console.log(`  ✅ Created user for: ${hospital.name}`);

                // Create bed inventory
                const bedTypes = [
                    { type: 'ICU', total: 20, occupied: Math.floor(Math.random() * 15) + 5 },
                    { type: 'General', total: 50, occupied: Math.floor(Math.random() * 40) + 10 },
                    { type: 'Private', total: 30, occupied: Math.floor(Math.random() * 25) + 5 },
                    { type: 'Emergency', total: 15, occupied: Math.floor(Math.random() * 10) + 2 },
                ];

                for (const bedData of bedTypes) {
                    const bed = new HospitalBed({
                        hospitalId: hospital._id,
                        type: bedData.type,
                        total: bedData.total,
                        occupied: bedData.occupied,
                        available: bedData.total - bedData.occupied
                    });
                    await bed.save();
                }
                console.log(`  ✅ Created bed inventory for: ${hospital.name}`);
            } else {
                console.log(`  ⏭️  Skipped (already exists): ${hospital.name}`);
            }
        }

        console.log('\n✅ Hospital seeding complete!');
        console.log(`📊 Total hospitals: ${hospitals.length}`);
        console.log('\n🎯 You can now view the City Dashboard!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding hospitals:', error);
        process.exit(1);
    }
}

seedHospitals();
