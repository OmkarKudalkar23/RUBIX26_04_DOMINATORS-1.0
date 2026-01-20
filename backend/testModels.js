const mongoose = require('mongoose');
require('dotenv').config();

// Import models
require('./models/User');
require('./models/Patient');
require('./models/Doctor');
require('./models/Hospital');
require('./models/Prescription');
require('./models/Reminder');
require('./models/Bill');
require('./models/Appointment');
require('./models/BedBooking');
require('./models/EnvironmentReading');
require('./models/SurgePrediction');

const User = mongoose.model('User');
const Patient = mongoose.model('Patient');
const Doctor = mongoose.model('Doctor');
const Hospital = mongoose.model('Hospital');
const Prescription = mongoose.model('Prescription');
const Reminder = mongoose.model('Reminder');
const Bill = mongoose.model('Bill');
const Appointment = mongoose.model('Appointment');
const BedBooking = mongoose.model('BedBooking');
const EnvironmentReading = mongoose.model('EnvironmentReading');
const SurgePrediction = mongoose.model('SurgePrediction');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ MongoDB connected for testing');
  
  // Test creating a user
  try {
    console.log('🧪 Testing User model...');
    // Check if user already exists
    let user = await User.findOne({ email: "test@example.com" });
    if (!user) {
      user = new User({
        name: "Test User",
        email: "test@example.com",
        phone: "+91-9820012349",
        passwordHash: "hashed_password_here",
        role: "patient"
      });
      await user.save();
      console.log('✅ User model working');
    } else {
      console.log('✅ User already exists, skipping creation');
    }
    
    // Test creating a patient
    console.log('🧪 Testing Patient model...');
    // Check if patient already exists for this user
    let patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      patient = new Patient({
        userId: user._id,
        age: 30,
        gender: "male",
        address: "Mumbai",
        comorbidities: ["none"]
      });
      await patient.save();
      console.log('✅ Patient model working');
    } else {
      console.log('✅ Patient already exists, skipping creation');
    }
    
    // Test creating a hospital
    console.log('🧪 Testing Hospital model...');
    // Check if hospital already exists
    let hospital = await Hospital.findOne({ name: "Test Hospital" });
    if (!hospital) {
      hospital = new Hospital({
        name: "Test Hospital",
        location: {
          city: "Mumbai",
          area: "Andheri",
          lat: 19.11,
          lng: 72.85
        },
        totalBeds: 100,
        departments: [
          { name: "General Medicine", capacity: 30 }
        ]
      });
      await hospital.save();
      console.log('✅ Hospital model working');
    } else {
      console.log('✅ Hospital already exists, skipping creation');
    }
    
    console.log('🎉 All models are working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing models:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});