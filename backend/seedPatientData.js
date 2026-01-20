const mongoose = require('mongoose');
require('dotenv').config();

// Import models
require('./models/User');
require('./models/Patient');
require('./models/Medication');
require('./models/MedicalRecord');
require('./models/Appointment');
require('./models/Prediction');
require('./models/Order');
require('./models/Delivery');
require('./models/Expense');

const User = mongoose.model('User');
const Patient = mongoose.model('Patient');
const Medication = mongoose.model('Medication');
const MedicalRecord = mongoose.model('MedicalRecord');
const Appointment = mongoose.model('Appointment');
const Prediction = mongoose.model('Prediction');
const Order = mongoose.model('Order');
const Delivery = mongoose.model('Delivery');
const Expense = mongoose.model('Expense');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected for seeding'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Sample patient data
const samplePatientData = {
  fullName: "John Doe",
  age: 35,
  gender: "male",
  dob: new Date("1990-01-15"),
  bloodGroup: "O+",
  phone: "+1 234-567-8900",
  address: "123 Main Street, New York, NY 10001",
  medicalHistory: [
    "Type 2 Diabetes - Diagnosed 2020",
    "Hypertension - Diagnosed 2019",
    "Seasonal Allergies"
  ],
  settings: {
    language: "English",
    currency: "USD",
    notifications: true,
    emailNotifications: true,
    location: "New York, USA"
  },
  familyMembers: [
    {
      relation: "Spouse",
      bloodGroup: "A+"
    },
    {
      relation: "Daughter",
      bloodGroup: "O+"
    }
  ]
};

// Sample medications
const sampleMedications = [
  {
    name: "Amoxicillin",
    dosage: "500mg",
    frequency: "3 times daily",
    duration: "7 days",
    remainingDays: 5,
    reminderEnabled: true,
    completed: false,
    totalStrips: 3,
    purchasedStrips: 0,
    times: ["Morning", "Afternoon", "Evening"]
  },
  {
    name: "Ibuprofen",
    dosage: "200mg",
    frequency: "As needed",
    duration: "5 days",
    remainingDays: 3,
    reminderEnabled: true,
    completed: false,
    totalStrips: 2,
    purchasedStrips: 0,
    times: []
  },
  {
    name: "Metformin",
    dosage: "850mg",
    frequency: "2 times daily",
    duration: "30 days",
    remainingDays: 22,
    reminderEnabled: true,
    completed: false,
    totalStrips: 6,
    purchasedStrips: 4,
    times: ["Morning", "Evening"]
  }
];

// Sample appointments
const sampleAppointments = [
  {
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    time: "10:00 AM",
    status: "pending",
    type: "checkup",
    reason: "Regular checkup"
  },
  {
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    time: "2:00 PM",
    status: "pending",
    type: "followup",
    reason: "Follow-up consultation"
  }
];

// Sample medical records
const sampleMedicalRecords = [
  {
    type: "prescription",
    fileName: "prescription_dr_sharma_2024.pdf",
    fileUrl: "#",
    summary: "Prescription from Dr. Sharma for upper respiratory tract infection. Medications include: Azithromycin 500mg (once daily for 5 days), Paracetamol 650mg (twice daily for fever/pain), Cetirizine 10mg (once daily at bedtime for allergic symptoms)."
  },
  {
    type: "lab-result",
    fileName: "complete_blood_count_report.pdf",
    fileUrl: "#",
    summary: "Complete Blood Count: Hemoglobin: 14.2 g/dL (normal), WBC count: 7,800/mm³ (normal range), Platelet count: 250,000/mm³ (adequate)."
  }
];

// Sample predictions
const samplePredictions = [
  {
    type: "heart",
    risk: "medium",
    probability: 45.2,
    inputs: {
      age: 35,
      cholesterol: 220,
      restingBP: 130
    },
    recommendation: "Moderate risk. Regular monitoring recommended. Focus on diet, exercise, and stress management."
  }
];

// Sample expenses
const sampleExpenses = [
  {
    name: "Amoxicillin Purchase",
    amountUSD: 45,
    category: "Medicine"
  },
  {
    name: "Dr. Sarah Mitchell Consultation",
    amountUSD: 80,
    category: "Consultation"
  }
];

async function seedData() {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Medication.deleteMany({}),
      MedicalRecord.deleteMany({}),
      Appointment.deleteMany({}),
      Prediction.deleteMany({}),
      Order.deleteMany({}),
      Delivery.deleteMany({}),
      Expense.deleteMany({})
    ]);
    
    console.log('✅ Existing data cleared');
    
    // Create a sample user
    const user = new User({
      name: "John Doe",
      email: "john.doe@example.com",
      passwordHash: "sample_hash", // In real app, this would be properly hashed
      role: "patient"
    });
    
    await user.save();
    console.log('✅ Sample user created');
    
    // Create patient profile
    const patient = new Patient({
      ...samplePatientData,
      userId: user._id
    });
    
    await patient.save();
    console.log('✅ Sample patient created');
    
    // Update user with patientId reference
    user.patientId = patient._id;
    await user.save();
    
    // Create medications
    for (const med of sampleMedications) {
      const medication = new Medication({
        ...med,
        patientId: patient._id,
        takings: [] // In a real app, we would generate historical takings
      });
      await medication.save();
    }
    console.log('✅ Sample medications created');
    
    // Create appointments
    for (const apt of sampleAppointments) {
      const appointment = new Appointment({
        ...apt,
        patientId: patient._id,
        doctorId: null, // In a real app, this would reference a doctor
        hospitalId: null // In a real app, this would reference a hospital
      });
      await appointment.save();
    }
    console.log('✅ Sample appointments created');
    
    // Create medical records
    for (const record of sampleMedicalRecords) {
      const medicalRecord = new MedicalRecord({
        ...record,
        patientId: patient._id
      });
      await medicalRecord.save();
    }
    console.log('✅ Sample medical records created');
    
    // Create predictions
    for (const pred of samplePredictions) {
      const prediction = new Prediction({
        ...pred,
        patientId: patient._id
      });
      await prediction.save();
    }
    console.log('✅ Sample predictions created');
    
    // Create expenses
    for (const exp of sampleExpenses) {
      const expense = new Expense({
        ...exp,
        patientId: patient._id
      });
      await expense.save();
    }
    console.log('✅ Sample expenses created');
    
    console.log('🎉 All sample data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedData();
}

module.exports = { seedData, samplePatientData };
