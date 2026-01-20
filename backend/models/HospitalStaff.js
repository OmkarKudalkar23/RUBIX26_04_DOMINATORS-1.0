const mongoose = require('mongoose');

const hospitalStaffSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["Nurse", "Technician", "Support", "Admin"],
    required: true
  },
  department: {
    type: String,
    required: true
  },
  shift: {
    type: String,
    enum: ["Morning", "Evening", "Night"],
    required: true
  },
  status: {
    type: String,
    enum: ["active", "on-leave", "off-duty"],
    required: true,
    default: "active"
  }
}, { timestamps: true });

module.exports = mongoose.model("HospitalStaff", hospitalStaffSchema);

