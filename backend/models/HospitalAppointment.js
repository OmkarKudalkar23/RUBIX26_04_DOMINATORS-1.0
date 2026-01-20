const mongoose = require('mongoose');

const hospitalAppointmentSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  doctorName: {
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
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    required: true,
    default: "scheduled"
  },
  type: {
    type: String,
    enum: ["OPD", "Emergency", "Follow-up"],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("HospitalAppointment", hospitalAppointmentSchema);

