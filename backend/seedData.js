const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
.then(() => console.log('✅ MongoDB connected for seeding'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Sample data
const sampleUsers = [
  {
    name: "Rohan Sharma",
    email: "rohan@example.com",
    password: "password123",
    role: "patient"
  },
  {
    name: "Dr. Amit Patel",
    email: "amit.patel@example.com",
    password: "password123",
    role: "doctor"
  },
  {
    name: "XYZ Hospital",
    email: "admin@xyzhospital.com",
    password: "password123",
    role: "hospital"
  }
];

const samplePatients = [
  {
    age: 45,
    gender: "male",
    dob: new Date("1978-05-15"),
    bloodGroup: "O+",
    phone: "+91-9820012345",
    address: "Dombivli, Mumbai",
    education: "B.Tech in CS",
    medicalHistory: "Type 2 Diabetes since 2020. Allergic to penicillin.",
    certificateUrl: "https://example.com/certificates/patient.pdf",
    aadhaarUrl: "https://example.com/aadhaar/patient.jpg"
  }
];

const sampleDoctors = [
  {
    name: "Dr. Amit Patel",
    age: 34,
    gender: "male",
    dob: new Date("1991-04-21"),
    phone: "+91-9820012347",
    address: "Andheri, Mumbai",
    specialization: "Pulmonologist",
    education: "MBBS, MD (Pulmonology)",
    certificateUrl: "https://example.com/certificates/doctor.pdf",
    aadhaarUrl: "https://example.com/aadhaar/doctor.jpg"
  }
];

const sampleHospitals = [
  {
    name: "XYZ Hospital",
    phone: "+91-22-1234-5678",
    address: "Vile Parle, Mumbai, MH 400057",
    registrationDocUrl: "https://example.com/documents/hospital-reg.pdf",
    doctors: [
      {
        name: "Dr. Rohan Gupta",
        specialization: "Cardiologist",
        certificateUrl: "https://example.com/certificates/rohan.pdf",
        aadhaarUrl: "https://example.com/aadhaar/rohan.jpg"
      },
      {
        name: "Dr. Meera Patel",
        specialization: "Pulmonologist",
        certificateUrl: "https://example.com/certificates/meera.pdf",
        aadhaarUrl: "https://example.com/aadhaar/meera.jpg"
      }
    ],
    bedTypes: [
      { type: "ICU", count: 10 },
      { type: "General", count: 30 },
      { type: "Private", count: 8 },
      { type: "Emergency", count: 5 }
    ]
  }
];

const samplePrescriptions = [
  {
    date: new Date("2025-11-27T00:00:00Z"),
    imageUrl: "https://example.com/prescriptions/xyz.png",
    rawOcrText: "Tab Augmentin 625 mg 1-0-1 for 5 days ...",
    medications: [
      {
        drugName: "Augmentin",
        dose: "625 mg",
        frequencyPerDay: 2,
        durationDays: 5,
        startDate: new Date("2025-11-28T00:00:00Z"),
        endDate: new Date("2025-12-02T00:00:00Z"),
        status: "active"
      },
      {
        drugName: "Montair LC",
        dose: "1 tab",
        frequencyPerDay: 1,
        durationDays: 10,
        startDate: new Date("2025-11-28T00:00:00Z"),
        endDate: new Date("2025-12-07T00:00:00Z"),
        status: "active"
      }
    ]
  }
];

const sampleAppointments = [
  {
    date: new Date("2025-11-30T17:30:00Z"),
    status: "confirmed",
    type: "OPD",
    reason: "Follow-up for asthma"
  }
];

const sampleBills = [
  {
    imageUrl: "https://example.com/bills/abc.png",
    rawOcrText: "Augmentin 625 strip of 10, Montair LC strip of 15...",
    items: [
      {
        drugName: "Augmentin 625",
        quantity: 1,
        unit: "strip",
        tabletsPerStrip: 10
      },
      {
        drugName: "Montair LC",
        quantity: 1,
        unit: "strip",
        tabletsPerStrip: 15
      }
    ]
  }
];

const sampleEnvironmentReadings = [
  {
    city: "Mumbai",
    timestamp: new Date(),
    aqi: 320,
    temp: 32.5,
    humidity: 70,
    pollutionLevel: "high",
    festivalFlag: true
  }
];

const sampleSurgePredictions = [
  {
    date: new Date("2025-12-01T00:00:00Z"),
    department: "Pulmonology",
    predictedLoad: 1.4,
    riskLevel: "high"
  }
];

async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Hospital.deleteMany({});
    await Prescription.deleteMany({});
    await Reminder.deleteMany({});
    await Bill.deleteMany({});
    await Appointment.deleteMany({});
    await BedBooking.deleteMany({});
    await EnvironmentReading.deleteMany({});
    await SurgePrediction.deleteMany({});
    
    console.log("✅ Existing data cleared");

    // Create users with hashed passwords
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        passwordHash
      });
      
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.role})`);
    }

    // Get user IDs
    const patientUser = createdUsers.find(u => u.role === "patient");
    const doctorUser = createdUsers.find(u => u.role === "doctor");
    const hospitalUser = createdUsers.find(u => u.role === "hospital");

    // Create patient profile
    if (patientUser) {
      const patient = new Patient({
        ...samplePatients[0],
        userId: patientUser._id
      });
      await patient.save();
      
      // Update user with patientId
      patientUser.patientId = patient._id;
      await patientUser.save();
      
      console.log(`✅ Created patient profile for: ${patientUser.name}`);
    }

    // Create doctor profile
    if (doctorUser) {
      const doctor = new Doctor({
        ...sampleDoctors[0],
        userId: doctorUser._id
      });
      await doctor.save();
      
      // Update user with doctorId
      doctorUser.doctorId = doctor._id;
      await doctorUser.save();
      
      console.log(`✅ Created doctor profile for: ${doctorUser.name}`);
    }

    // Create hospital profile
    if (hospitalUser) {
      const hospital = new Hospital({
        ...sampleHospitals[0],
        userId: hospitalUser._id
      });
      await hospital.save();
      
      // Update user with hospitalId
      hospitalUser.hospitalId = hospital._id;
      await hospitalUser.save();
      
      console.log(`✅ Created hospital profile for: ${hospitalUser.name}`);
    }

    // Create prescriptions, appointments, etc. if users exist
    if (patientUser && doctorUser && hospitalUser) {
      // Get the created profiles
      const patientProfile = await Patient.findOne({ userId: patientUser._id });
      const doctorProfile = await Doctor.findOne({ userId: doctorUser._id });
      const hospitalProfile = await Hospital.findOne({ userId: hospitalUser._id });

      // Create prescriptions
      const prescription = new Prescription({
        ...samplePrescriptions[0],
        patientId: patientProfile._id,
        doctorId: doctorProfile._id,
        hospitalId: hospitalProfile._id
      });
      await prescription.save();
      console.log(`✅ Created prescription for patient`);

      // Create reminders for medications
      for (const medication of prescription.medications) {
        const reminder = new Reminder({
          patientId: patientProfile._id,
          prescriptionId: prescription._id,
          medicationId: medication._id,
          reminderTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          status: "pending",
          channel: "push"
        });
        await reminder.save();
      }
      console.log(`✅ Created reminders for medications`);

      // Create bills
      const bill = new Bill({
        ...sampleBills[0],
        patientId: patientProfile._id
      });
      await bill.save();
      console.log(`✅ Created bill for patient`);

      // Create appointments
      const appointment = new Appointment({
        ...sampleAppointments[0],
        patientId: patientProfile._id,
        doctorId: doctorProfile._id,
        hospitalId: hospitalProfile._id
      });
      await appointment.save();
      console.log(`✅ Created appointment for patient`);

      // Create environment readings
      for (const readingData of sampleEnvironmentReadings) {
        const reading = new EnvironmentReading(readingData);
        await reading.save();
      }
      console.log(`✅ Created environment readings`);

      // Create surge predictions
      for (const predictionData of sampleSurgePredictions) {
        const prediction = new SurgePrediction({
          ...predictionData,
          hospitalId: hospitalProfile._id
        });
        await prediction.save();
      }
      console.log(`✅ Created surge predictions`);
    }

    console.log("🌱 Database seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();