const mongoose = require('mongoose');

const environmentReadingSchema = new mongoose.Schema(
  {
    city: String,
    timestamp: { type: Date, default: Date.now },
    aqi: Number,
    temp: Number,
    humidity: Number,
    pollutionLevel: String,
    festivalFlag: Boolean
  }
);

module.exports = mongoose.model("EnvironmentReading", environmentReadingSchema);