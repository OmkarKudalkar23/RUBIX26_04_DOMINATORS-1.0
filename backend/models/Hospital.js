const mongoose = require('mongoose');

const hospitalDoctorSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  name: String,
  specialization: String,
  certificateUrl: String,
  aadhaarUrl: String
}, { _id: false });

const bedTypeSchema = new mongoose.Schema({
  type: String,
  count: Number
});

const hospitalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Optional for external hospitals from OpenStreetMap
    name: String,
    phone: String,
    address: String,
    registrationDocUrl: String,
    doctors: [hospitalDoctorSchema],
    bedTypes: [bedTypeSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hospital", hospitalSchema);