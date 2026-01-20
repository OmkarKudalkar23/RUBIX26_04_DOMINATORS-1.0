const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded medical records files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

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
require('./models/Medication');
require('./models/MedicalRecord');
require('./models/DoctorMedicalRecord');
require('./models/HospitalBed');
require('./models/HospitalDoctorSlot');
require('./models/HospitalStaff');
require('./models/HospitalSurgeAlert');
require('./models/HospitalEnvironment');
require('./models/HospitalAppointment');
require('./models/HospitalOpdCheckIn');
require('./models/HospitalAdmission');
require('./models/HospitalInventoryItem');
require('./models/HospitalInventoryTxn');
require('./models/Prediction');
require('./models/Order');
require('./models/Delivery');
require('./models/Expense');

// Sample route
app.get('/', (req, res) => {
  res.json({ message: 'Mumbai Hacks Backend API' });
});

// Import routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/doctors', require('./routes/doctors'));

// Doctor dashboard routes (protected) - with error handling
try {
  const doctorRouter = require('./routes/doctor');
  app.use('/api/doctor', doctorRouter);
  console.log('✅ Doctor routes registered');
} catch (error) {
  console.error('❌ Error loading doctor routes:', error.message);
  console.error(error.stack);
}

// Hospital dashboard routes (protected) - with error handling
try {
  const hospitalRouter = require('./routes/hospital');
  app.use('/api/hospital', hospitalRouter);
  console.log('✅ Hospital routes registered');
} catch (error) {
  console.error('❌ Error loading hospital routes:', error.message);
  console.error(error.stack);
}

app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/route', require('./routes/route')); // Route endpoint for OpenRouteService
app.use('/api', require('./routes/retell')); // Retell AI routes
app.use('/api/early-warning', require('./routes/early-warning')); // Early Warning System routes
app.use('/api/inventory', require('./routes/inventory')); // Inventory Management routes

// Background job to auto-update AQI every 15 minutes
const HospitalEnvironment = require('./models/HospitalEnvironment');
const Hospital = require('./models/Hospital');
const { fetchRealTimeEnvironmentData } = require('./services/aqiService');

async function updateAllHospitalEnvironments() {
  try {
    const hospitals = await Hospital.find({});
    console.log(`🔄 Updating AQI for ${hospitals.length} hospitals...`);
    
    for (const hospital of hospitals) {
      try {
        const realTimeData = await fetchRealTimeEnvironmentData('Mumbai');
        let environment = await HospitalEnvironment.findOne({ hospitalId: hospital._id });
        
        if (environment) {
          environment.aqi = realTimeData.aqi;
          environment.temperature = realTimeData.temperature;
          environment.humidity = realTimeData.humidity;
          environment.pollutionLevel = realTimeData.pollutionLevel;
          await environment.save();
        } else {
          environment = new HospitalEnvironment({
            hospitalId: hospital._id,
            aqi: realTimeData.aqi,
            temperature: realTimeData.temperature,
            humidity: realTimeData.humidity,
            pollutionLevel: realTimeData.pollutionLevel,
            festivalFlag: false
          });
          await environment.save();
        }
        console.log(`  ✅ Updated AQI for ${hospital.name}: ${realTimeData.aqi} (${realTimeData.source})`);
      } catch (err) {
        console.warn(`  ⚠️  Failed to update AQI for ${hospital.name}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error in AQI update job:', error.message);
  }
}

// Start AQI update job immediately, then every 15 minutes
setTimeout(() => {
  updateAllHospitalEnvironments();
}, 5000); // Wait 5 seconds after server starts

setInterval(() => {
  updateAllHospitalEnvironments();
}, 15 * 60 * 1000); // Every 15 minutes

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔄 AQI auto-update job started (every 15 minutes)`);
});