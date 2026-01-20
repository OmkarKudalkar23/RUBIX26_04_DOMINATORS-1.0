/**
 * Seed script to populate MongoDB with sample doctor medical records
 * 
 * Usage: node scripts/seedDoctorMedicalRecords.js
 * 
 * This script creates sample DoctorMedicalRecord documents for the test doctor
 * (doctor@test.com). These are records uploaded by the doctor, not patient records.
 * 
 * IMPORTANT: This will DELETE existing doctor medical records for the test doctor before inserting new data.
 * Run this in development only!
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorMedicalRecord = require('../models/DoctorMedicalRecord');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

const DOCTOR_EMAIL = 'doctor@test.com';

async function seedDoctorMedicalRecords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find test doctor
    const doctorUser = await User.findOne({ email: DOCTOR_EMAIL });
    if (!doctorUser) {
      console.error('❌ Test doctor user not found. Please run seedDoctorSampleData.js first.');
      process.exit(1);
    }

    const doctor = await Doctor.findOne({ userId: doctorUser._id });
    if (!doctor) {
      console.error('❌ Test doctor profile not found. Please run seedDoctorSampleData.js first.');
      process.exit(1);
    }

    console.log('🧹 Cleaning up existing doctor medical records...');
    // Delete existing records for this doctor
    await DoctorMedicalRecord.deleteMany({ doctorId: doctor._id });
    console.log('✅ Cleaned up existing records');

    // Sample medical records data - More variety for better testing
    const sampleRecords = [
      {
        type: 'report',
        fileName: 'Blood_Test_Report_2024.pdf',
        filePath: path.join(__dirname, '../uploads/medical-records/sample-report-1.pdf'),
        mimeType: 'application/pdf',
        summary: 'Blood Report Analysis: All parameters within normal range. Hemoglobin: 14.2 g/dL (Normal), WBC: 7,800/μL (Normal), Platelets: 250,000/μL (Normal). Liver and kidney function tests show healthy values. No immediate concerns detected.',
        uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        type: 'xray',
        fileName: 'Chest_XRay_Patient_001.jpg',
        filePath: path.join(__dirname, '../uploads/medical-records/sample-xray-1.jpg'),
        mimeType: 'image/jpeg',
        summary: 'Chest X-Ray: Clear lung fields bilaterally. No signs of pneumonia, pleural effusion, or masses. Heart size normal. No acute cardiopulmonary abnormalities detected.',
        uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        type: 'lab-result',
        fileName: 'Lipid_Profile_Results.pdf',
        filePath: path.join(__dirname, '../uploads/medical-records/sample-lab-1.pdf'),
        mimeType: 'application/pdf',
        summary: 'Lipid Profile: Total cholesterol slightly elevated at 210 mg/dL. LDL: 135 mg/dL (borderline high), HDL: 45 mg/dL (acceptable), Triglycerides: 150 mg/dL (normal). Recommend dietary modifications and exercise. Recheck in 3 months.',
        uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        type: 'mri',
        fileName: 'Brain_MRI_Scan_2024.pdf',
        filePath: path.join(__dirname, '../uploads/medical-records/sample-mri-1.pdf'),
        mimeType: 'application/pdf',
        summary: 'Brain MRI: No evidence of acute infarction or hemorrhage. No mass lesions identified. White matter changes consistent with age. Ventricular system normal.',
        uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        type: 'prescription',
        fileName: 'Prescription_Antibiotics_2024.pdf',
        filePath: path.join(__dirname, '../uploads/medical-records/sample-prescription-1.pdf'),
        mimeType: 'application/pdf',
        summary: 'Prescription Analysis: Amoxicillin 500mg, 3 times daily for 7 days. Ibuprofen 400mg as needed for pain. Follow-up recommended after course completion.',
        uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        type: 'ct-scan',
        fileName: 'Abdominal_CT_Scan_2024.pdf',
        filePath: path.join(__dirname, '../uploads/medical-records/sample-ctscan-1.pdf'),
        mimeType: 'application/pdf',
        summary: 'Abdominal CT Scan: Liver, spleen, pancreas, and kidneys appear normal. No masses, stones, or collections identified. Small hiatal hernia noted. No acute abdominal pathology detected.',
        uploadDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        type: 'report',
        fileName: 'Thyroid_Function_Test.pdf',
        filePath: path.join(__dirname, '../uploads/medical-records/sample-report-2.pdf'),
        mimeType: 'application/pdf',
        summary: 'Thyroid Function Test: TSH levels at 2.5 mIU/L (normal range). T3 and T4 within acceptable limits. No signs of thyroid dysfunction. Patient shows normal thyroid activity.',
        uploadDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        type: 'xray',
        fileName: 'Knee_XRay_Patient_002.jpg',
        filePath: path.join(__dirname, '../uploads/medical-records/sample-xray-2.jpg'),
        mimeType: 'image/jpeg',
        summary: 'Knee X-Ray: Mild degenerative changes noted in medial compartment. Joint space narrowing with small osteophytes present. Consistent with early-stage osteoarthritis. Recommend physical therapy.',
        uploadDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      }
    ];

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads/medical-records');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }

    // Create placeholder files (in production, these would be real files)
    // For seeding, we'll just create empty placeholder files
    console.log('📝 Creating sample records...');
    const createdRecords = [];

    for (const recordData of sampleRecords) {
      // Create a placeholder file if it doesn't exist
      if (!fs.existsSync(recordData.filePath)) {
        // Create a simple text file as placeholder
        fs.writeFileSync(recordData.filePath, `Placeholder file for ${recordData.fileName}\nThis is a sample medical record file.`);
      }

      const record = new DoctorMedicalRecord({
        doctorId: doctor._id,
        type: recordData.type,
        fileName: recordData.fileName,
        filePath: recordData.filePath,
        mimeType: recordData.mimeType,
        summary: recordData.summary,
        uploadDate: recordData.uploadDate,
        extractedData: {
          documentType: recordData.type,
          analyzedAt: recordData.uploadDate.toISOString(),
          fileName: recordData.fileName
        }
      });

      await record.save();
      createdRecords.push(record);
      console.log(`  ✅ Created record: ${recordData.fileName}`);
    }

    console.log(`\n✅ Successfully created ${createdRecords.length} doctor medical records`);
    console.log(`\n📋 Summary:`);
    console.log(`   Doctor: ${doctor.name} (${DOCTOR_EMAIL})`);
    console.log(`   Records created: ${createdRecords.length}`);
    console.log(`\n💡 Note: The files are placeholder files. In production, these would be real medical documents.`);

  } catch (error) {
    console.error('❌ Error seeding doctor medical records:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the seed function
seedDoctorMedicalRecords()
  .then(() => {
    console.log('\n🎉 Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });

