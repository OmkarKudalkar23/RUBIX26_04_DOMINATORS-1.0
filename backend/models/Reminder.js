const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription", required: true },
    medicationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reminderTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "stopped"],
      default: "pending"
    },
    channel: { type: String, enum: ["push", "sms", "email"], default: "push" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);