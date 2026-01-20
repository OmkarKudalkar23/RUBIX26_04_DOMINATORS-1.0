const mongoose = require('mongoose');

const hospitalBedSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true
  },
  type: {
    type: String,
    enum: ["ICU", "General", "Private", "Emergency"],
    required: true
  },
  total: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  occupied: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  available: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, { timestamps: true });

// Virtual to calculate available beds (but we'll keep it in sync manually for consistency)
hospitalBedSchema.virtual('calculatedAvailable').get(function() {
  return Math.max(0, this.total - this.occupied);
});

// Pre-save hook to ensure available = total - occupied
hospitalBedSchema.pre('save', function(next) {
  this.available = Math.max(0, this.total - this.occupied);
  next();
});

module.exports = mongoose.model("HospitalBed", hospitalBedSchema);

