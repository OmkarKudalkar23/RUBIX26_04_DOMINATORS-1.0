const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
  {
    drugName: String,
    dose: String,
    frequencyPerDay: Number,
    durationDays: Number,
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ["active", "completed", "stopped"],
      default: "active"
    }
  },
  { _id: true }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    date: { type: Date, default: Date.now },
    imageUrl: String,
    rawOcrText: String,
    medications: [medicationSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);