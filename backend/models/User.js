const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: String,
    role: {
      type: String,
      enum: ["patient", "doctor", "hospital"],
      required: true
    },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);