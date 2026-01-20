const mongoose = require('mongoose');

const takingSchema = new mongoose.Schema({
  date: { type: String, required: true },          // "YYYY-MM-DD"
  time: { type: String, required: true },          // "Morning", etc
  taken: { type: Boolean, default: false },
  takenAt: { type: Date }
}, { _id: false });

const medicationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  name: String,
  dosage: String,
  frequency: String,
  duration: String,
  remainingDays: Number,
  reminderEnabled: { type: Boolean, default: true },
  completed: { type: Boolean, default: false },
  totalStrips: Number,
  purchasedStrips: { type: Number, default: 0 },
  times: [String],
  takings: [takingSchema],
}, { timestamps: true });

module.exports = mongoose.model("Medication", medicationSchema);