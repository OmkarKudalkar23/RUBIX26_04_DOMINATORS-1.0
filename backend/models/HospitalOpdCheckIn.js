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

