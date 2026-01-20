const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    // Fallback fields for doctor info when doctorId is not available
    doctorName: { type: String },
    doctorSpecialty: { type: String },
    date: { type: String, required: true }, // ISO date string
    time: { type: String }, // "10:00 AM" or "Immediate"
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    type: {
      type: String,
      enum: ["checkup", "followup", "emergency"],
      default: "checkup"
    },
    reason: String,
    symptoms: String,
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
