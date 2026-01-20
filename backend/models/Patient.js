const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: String,
    age: Number,
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: Date,
    bloodGroup: String,
    phone: String,
    address: String,
    education: String,
    medicalHistory: [String],
    certificateUrl: String,
    aadhaarUrl: String,
    settings: {
      language: { type: String, default: "en" },
      currency: { type: String, default: "INR" },
      notifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      location: String
    },
    familyMembers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        relation: String,
        bloodGroup: String
      }
    ],
    location: {
      latitude: Number,
      longitude: Number,
      lastUpdated: Date
    },
    nearestHospital: {
      hospitalId: String,
      name: String,
      distance: Number,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      lastUpdated: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);