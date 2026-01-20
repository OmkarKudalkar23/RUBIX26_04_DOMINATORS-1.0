const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');
const Prescription = require('./models/Prescription');
const Reminder = require('./models/Reminder');
const Bill = require('./models/Bill');
const Appointment = require('./models/Appointment');
const BedBooking = require('./models/BedBooking');
const EnvironmentReading = require('./models/EnvironmentReading');
const SurgePrediction = require('./models/SurgePrediction');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ MongoDB connected for verification');
  
  try {
    // Count documents in each collection
    const userCount = await User.countDocuments();
    const patientCount = await Patient.countDocuments();
    const doctorCount = await Doctor.countDocuments();
    const hospitalCount = await Hospital.countDocuments();
    const prescriptionCount = await Prescription.countDocuments();
    const reminderCount = await Reminder.countDocuments();
    const billCount = await Bill.countDocuments();
    const appointmentCount = await Appointment.countDocuments();
    const bedBookingCount = await BedBooking.countDocuments();
    const environmentReadingCount = await EnvironmentReading.countDocuments();
    const surgePredictionCount = await SurgePrediction.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`Users: ${userCount}`);
    console.log(`Patients: ${patientCount}`);
    console.log(`Doctors: ${doctorCount}`);
    console.log(`Hospitals: ${hospitalCount}`);
    console.log(`Prescriptions: ${prescriptionCount}`);
    console.log(`Reminders: ${reminderCount}`);
    console.log(`Bills: ${billCount}`);
    console.log(`Appointments: ${appointmentCount}`);
    console.log(`Bed Bookings: ${bedBookingCount}`);
    console.log(`Environment Readings: ${environmentReadingCount}`);
    console.log(`Surge Predictions: ${surgePredictionCount}`);
    
    // Show sample data
    console.log('\n📝 Sample Data:');
    
    const sampleUser = await User.findOne();
    console.log(`User: ${sampleUser?.name} (${sampleUser?.role})`);
    
    const sampleHospital = await Hospital.findOne();
    console.log(`Hospital: ${sampleHospital?.name}`);
    
    const sampleDoctor = await Doctor.findOne().populate('userId');
    console.log(`Doctor: ${sampleDoctor?.userId?.name}`);
    
    const samplePatient = await Patient.findOne().populate('userId');
    console.log(`Patient: ${samplePatient?.userId?.name}`);
    
    const samplePrescription = await Prescription.findOne();
    console.log(`Prescriptions: ${samplePrescription?.medications?.length || 0} medications`);
    
    console.log('\n✅ Database verification completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});