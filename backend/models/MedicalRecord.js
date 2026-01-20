const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  uploadedByDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  type: { 
    type: String, 
    enum: ["prescription", "report", "xray", "ct-scan", "mri", "lab-result", "other"],
    required: true
  },
  fileName: String,
  fileUrl: String,
  uploadDate: { type: Date, default: Date.now },
  summary: String,
  extractedData: mongoose.Schema.Types.Mixed  // optional JSON if prescription OCR
}, { timestamps: true });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);