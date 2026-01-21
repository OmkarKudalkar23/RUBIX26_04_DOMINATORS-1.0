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
  },
  // New: Track individual beds
  beds: [{
    number: Number,
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'cleaning', 'discharge_pending', 'blocked', 'maintenance'],
      default: 'available'
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalAdmission',
      default: null
    },
    // Context fields for advanced management
    occupiedSince: { type: Date, default: null },
    expectedDischargeTime: { type: Date, default: null },
    cleaningEta: { type: Date, default: null },
    blockedReason: { type: String, default: '' },
    notes: { type: String, default: '' },

    // Admission metadata snapshot (for quick dashboard access)
    admissionType: { type: String, enum: ['Emergency', 'OPD', 'Surgery', 'Transfer', ''], default: '' },
    priority: { type: String, enum: ['Normal', 'High', 'Critical', ''], default: '' },

    // Equipment availability for admission workflow
    hasVentilator: {
      type: Boolean,
      default: false
    },
    hasOxygen: {
      type: Boolean,
      default: false
    },
    department: {
      type: String,
      default: 'General'
    },
    isIsolation: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

// Virtual to calculate available beds
hospitalBedSchema.virtual('calculatedAvailable').get(function () {
  if (this.beds && this.beds.length > 0) {
    return this.beds.filter(b => b.status === 'available').length;
  }
  return Math.max(0, this.total - this.occupied);
});

// Pre-save hook to ensure consistency
hospitalBedSchema.pre('save', function (next) {
  // Migration/Initialization: If beds array is empty but total > 0, generate beds
  if (this.total > 0 && (!this.beds || this.beds.length === 0)) {
    const newBeds = [];
    for (let i = 1; i <= this.total; i++) {
      // Mark first 'occupied' count as occupied, rest available
      const status = i <= this.occupied ? 'occupied' : 'available';
      newBeds.push({ number: i, status });
    }
    this.beds = newBeds;
  }
  // If beds array exists, sync counts FROM the array
  else if (this.beds && this.beds.length > 0) {
    this.total = this.beds.length;
    this.occupied = this.beds.filter(b => b.status === 'occupied').length;
    this.available = this.beds.filter(b => b.status === 'available').length;
  }
  // Fallback (shouldn't happen often if we use array): strict math
  else {
    this.available = Math.max(0, this.total - this.occupied);
  }
  next();
});

module.exports = mongoose.model("HospitalBed", hospitalBedSchema);

