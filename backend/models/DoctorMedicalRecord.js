const mongoose = require('mongoose');

const doctorMedicalRecordSchema = new mongoose.Schema({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Doctor", 
    required: true 
  },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Patient",
    required: false  // Optional - may link to specific patients later
  },
  type: { 
    type: String, 
    enum: ["prescription", "report", "xray", "ct-scan", "mri", "lab-result", "other"],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true  // Server path where file is stored
  },
  mimeType: {
    type: String,
    required: true  // e.g., "application/pdf", "image/jpeg"
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  summary: {
    type: String,
    default: ""
  },
  extractedData: {
    type: mongoose.Schema.Types.Mixed,  // For structured info from Gemini
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("DoctorMedicalRecord", doctorMedicalRecordSchema);

