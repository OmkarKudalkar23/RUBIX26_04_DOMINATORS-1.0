const mongoose = require('mongoose');
const HospitalDoctorSlot = require('./backend/models/HospitalDoctorSlot');
const HospitalOpdCheckIn = require('./backend/models/HospitalOpdCheckIn');

// Connect to DB
// Connect to DB
mongoose.connect('mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db?retryWrites=true&w=majority&appName=Cluster0')
    .then(async () => {
        console.log('Connected to DB');

        const today = new Date().toISOString().split('T')[0];

        // Find Doctor Slots
        const slots = await HospitalDoctorSlot.find({ date: today });
        console.log('\n--- Doctor Slots ---');
        slots.forEach(s => {
            console.log(`Doctor: ${s.doctorName} | Status: ${s.isActive ? (s.currentPatientId ? 'BUSY' : 'FREE') : 'OFF DUTY'} | PatientID: ${s.currentPatientId}`);
        });

        // Find Active Patients
        const patients = await HospitalOpdCheckIn.find({ status: { $in: ['in-consult', 'checked-in'] } });
        console.log('\n--- Active Patients ---');
        patients.forEach(p => {
            console.log(`Patient: ${p.patientName} | Doctor: ${p.doctorName} (ID: ${p.doctorId}) | Status: ${p.status} | ID: ${p._id}`);
        });

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
