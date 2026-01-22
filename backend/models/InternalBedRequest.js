const mongoose = require('mongoose');

/**
 * Internal Bed Request Model
 * 
 * Represents a doctor-initiated admission request within the same hospital.
 * This is separate from BedRequest which handles cross-hospital transfers.
 * 
 * Flow:
 * 1. Doctor ends consultation and selects "Admit Patient"
 * 2. InternalBedRequest is created with clinical details
 * 3. Admission staff reviews and approves/rejects
 * 4. On approval, bed allocation proceeds via HospitalAdmission workflow
 */
const internalBedRequestSchema = new mongoose.Schema(
  {
    // Hospital this request belongs to
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },

    // Link to the OPD check-in record
    opdCheckInId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalOpdCheckIn',
      required: true
    },

    // Patient information (snapshot from OPD)
    patientName: {
      type: String,
      required: true
    },

    // Requested department for admission (may differ from OPD department)
    department: {
      type: String,
      required: true
    },

    // Requested bed type
    bedType: {
      type: String,
      enum: ['ICU', 'General', 'Private', 'Emergency'],
      default: 'General'
    },

    // Clinical urgency level
    urgencyLevel: {
      type: String,
      enum: ['routine', 'urgent', 'emergency'],
      default: 'routine'
    },

    // Clinical reason/notes from the doctor
    reason: {
      type: String,
      default: ''
    },

    // Doctor who initiated the request
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: false // May be null if doctor not in system
    },

    // Doctor name (fallback if doctorId not available)
    requestedByName: {
      type: String,
      default: ''
    },

    // Request status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'allocated', 'cancelled'],
      default: 'pending'
    },

    // Admission staff/admin who processed the request
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },

    // Response notes from admission staff
    responseNotes: {
      type: String,
      default: ''
    },

    // Link to HospitalAdmission if created after approval
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalAdmission',
      required: false
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
internalBedRequestSchema.index({ hospitalId: 1, status: 1, createdAt: -1 });
internalBedRequestSchema.index({ hospitalId: 1, createdAt: -1 });
internalBedRequestSchema.index({ opdCheckInId: 1 });

module.exports = mongoose.model('InternalBedRequest', internalBedRequestSchema);
