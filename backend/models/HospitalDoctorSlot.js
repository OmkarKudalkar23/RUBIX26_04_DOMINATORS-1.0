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
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor"
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
  isActive: {
    type: Boolean,
    default: true  // Doctor is ON DUTY by default when slot is created
  },
  currentPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HospitalOpdCheckIn",
    default: null  // null = Free, has value = Busy with this patient
  },
  slots: {
    type: [slotSchema],
    required: true,
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("HospitalDoctorSlot", hospitalDoctorSlotSchema);

