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
  console.log('✅ MongoDB connected for index fixing');
  
  try {
    // Get the database connection
    const db = mongoose.connection.db;
    
    // Check indexes on patients collection
    const patientIndexes = await db.collection('patients').indexes();
    console.log('Existing patient indexes:');
    patientIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Look for any email index that shouldn't be there
    const emailIndex = patientIndexes.find(index => index.key.email);
    if (emailIndex) {
      console.log(`\n⚠️  Found email index that should not exist: ${emailIndex.name}`);
      console.log('Attempting to drop it...');
      
      try {
        await db.collection('patients').dropIndex(emailIndex.name);
        console.log('✅ Email index dropped successfully');
      } catch (dropError) {
        console.log('❌ Failed to drop email index:', dropError.message);
      }
    } else {
      console.log('\n✅ No problematic email index found on patients collection');
    }
    
    console.log('\n✅ Index checking completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking indexes:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});