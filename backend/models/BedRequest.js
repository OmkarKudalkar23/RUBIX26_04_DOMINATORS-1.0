const mongoose = require('mongoose');

const bedRequestSchema = new mongoose.Schema(
    {
        // From which hospital the request is sent
        fromHospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hospital',
            required: true
        },
        fromHospitalName: { type: String, required: true },

        // To which hospital the request is sent
        toHospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hospital',
            required: true
        },
        toHospitalName: { type: String, required: true },

        // Patient details
        patientName: { type: String, required: true },
        age: { type: Number },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
        contact: { type: String },
        bloodGroup: { type: String },
        condition: { type: String },

        // Bed details
        bedType: { type: String, default: 'General' },

        // Request status
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },

        // Read status for notification
        isRead: { type: Boolean, default: false },

        // Response notes (optional, when approved/rejected)
        responseNotes: { type: String }
    },
    { timestamps: true }
);

// Indexes for efficient queries
bedRequestSchema.index({ toHospitalId: 1, status: 1, createdAt: -1 });
bedRequestSchema.index({ fromHospitalId: 1, createdAt: -1 });

module.exports = mongoose.model('BedRequest', bedRequestSchema);
