const mongoose = require('mongoose');

const hospitalAdmissionSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientName: { type: String, required: true },
    age: { type: Number, required: false },
    department: { type: String, required: true }, // requested department/ward type
    bedType: { type: String, enum: ['ICU', 'General', 'Private', 'Emergency'], required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    oxygenRequired: { type: Boolean, default: false },
    isolationRequired: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'allocated', 'admitted', 'discharged', 'cancelled'], default: 'pending' },
    // Allocation outcome
    allocatedBedTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBed', required: false },
    allocationNote: { type: String, default: '' },
    admittedAt: { type: Date, required: false },
    dischargedAt: { type: Date, required: false }
  },
  { timestamps: true }
);

hospitalAdmissionSchema.index({ hospitalId: 1, createdAt: -1 });
hospitalAdmissionSchema.index({ hospitalId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('HospitalAdmission', hospitalAdmissionSchema);

