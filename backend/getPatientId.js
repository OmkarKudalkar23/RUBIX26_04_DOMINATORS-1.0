const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Patient = require('./models/Patient');
const User = require('./models/User');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ MongoDB connected');
  
  try {
    // Get the first patient
    const patient = await Patient.findOne().populate('userId');
    if (patient) {
      console.log(`Patient ID: ${patient._id}`);
      console.log(`Patient Name: ${patient.userId.name}`);
    } else {
      console.log('No patient found');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});