const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["available", "booked", "blocked"],
    required: true,
    default: "available"
  },
  patientName: {
    type: String,
    required: false
  }
}, { _id: false });

const hospitalDoctorSlotSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  date: {
    type: String, // Format: "YYYY-MM-DD"
    required: true
  },
  slots: {
    type: [slotSchema],
    required: true,
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("HospitalDoctorSlot", hospitalDoctorSlotSchema);

