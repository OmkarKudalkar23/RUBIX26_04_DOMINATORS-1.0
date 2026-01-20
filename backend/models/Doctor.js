const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    age: Number,
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: Date,
    phone: String,
    address: String,
    specialization: String,
    education: String,
    certificateUrl: String,
    aadhaarUrl: String,
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);