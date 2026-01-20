const mongoose = require('mongoose');

const hospitalSurgeAlertSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true
  },
  type: {
    type: String,
    enum: ["pollution", "seasonal", "epidemic", "weather"],
    required: true
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  prediction: {
    type: String,
    required: true
  },
  date: {
    type: String, // Format: "YYYY-MM-DD"
    required: true
  },
  department: {
    type: String,
    required: true
  },
  expectedIncrease: {
    type: Number,
    required: true,
    min: 0
  },
  recommendations: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("HospitalSurgeAlert", hospitalSurgeAlertSchema);

