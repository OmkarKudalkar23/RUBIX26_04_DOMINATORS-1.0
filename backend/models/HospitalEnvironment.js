const mongoose = require('mongoose');

const hospitalEnvironmentSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
    unique: true // One document per hospital
  },
  aqi: {
    type: Number,
    required: true,
    default: 0
  },
  temperature: {
    type: Number,
    required: true,
    default: 0
  },
  humidity: {
    type: Number,
    required: true,
    default: 0
  },
  pollutionLevel: {
    type: String,
    enum: ["Good", "Moderate", "Poor", "Very Poor", "Severe"],
    required: true,
    default: "Good"
  },
  festivalFlag: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("HospitalEnvironment", hospitalEnvironmentSchema);

