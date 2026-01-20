const mongoose = require('mongoose');

const surgePredictionSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    date: { type: Date, required: true },
    department: String,
    predictedLoad: Number,
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"]
    }
  }
);

module.exports = mongoose.model("SurgePrediction", surgePredictionSchema);