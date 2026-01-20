const mongoose = require('mongoose');

const hospitalOpdCheckInSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    // Link to appointment if it exists (optional)
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalAppointment', required: false },
    patientName: { type: String, required: true },
    department: { type: String, required: true },
    doctorName: { type: String, required: false, default: '' },
    visitType: { type: String, enum: ['OPD', 'Follow-up'], default: 'OPD' },
    // Check-in & queue status
    status: { type: String, enum: ['checked-in', 'in-triage', 'in-consult', 'completed', 'no-show'], default: 'checked-in' },
    checkInTime: { type: Date, default: () => new Date() },
    priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },

    // New fields for Dynamic Queue Engine
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: false },
    estimatedArrivalTime: { type: Date }, // When they are expected to arrive
    arrivalStatus: { type: String, enum: ['arrived', 'delayed', 'no-show', 'on-time', 'waiting'], default: 'waiting' },
    consultationComplexity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    priorityScore: { type: Number, default: 0 }, // Calculated dynamic score
    bookingTime: { type: Date, default: () => new Date() }, // Original booking time for Appointments
    isEmergency: { type: Boolean, default: false }, // Explicit override flag

    // computed/assigned sequence
    queueNumber: { type: Number, required: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

hospitalOpdCheckInSchema.index({ hospitalId: 1, checkInTime: -1 });
hospitalOpdCheckInSchema.index({ hospitalId: 1, status: 1, checkInTime: 1 });
hospitalOpdCheckInSchema.index({ hospitalId: 1, queueNumber: 1 }, { unique: false });

module.exports = mongoose.model('HospitalOpdCheckIn', hospitalOpdCheckInSchema);

