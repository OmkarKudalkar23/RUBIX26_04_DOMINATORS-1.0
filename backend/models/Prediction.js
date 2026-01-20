const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  type: { 
    type: String, 
    enum: ["heart", "diabetes", "kidney", "sepsis"],
    required: true
  },
  date: { type: Date, default: Date.now },
  risk: { 
    type: String, 
    enum: ["low", "medium", "high"]
  },
  probability: Number,
  inputs: mongoose.Schema.Types.Mixed,          // whatever you send from UI
  recommendation: String
}, { timestamps: true });

module.exports = mongoose.model("Prediction", predictionSchema);