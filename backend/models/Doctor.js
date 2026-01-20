const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    age: Number,
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: Date,
    phone: String,
    address: String,
    specialization: String,
    department: String,
    education: String,
    certificateUrl: String,
    aadhaarUrl: String,
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    // Real-time availability tracking
    isOnDuty: { type: Boolean, default: false },
    currentPatientId: { type: mongoose.Schema.Types.ObjectId, ref: "HospitalOpdCheckIn", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);