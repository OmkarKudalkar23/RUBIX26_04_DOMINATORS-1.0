const mongoose = require('mongoose');

const hospitalInventoryTxnSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalInventoryItem', required: true },
    type: { type: String, enum: ['consume', 'restock', 'adjust'], required: true },
    qty: { type: Number, required: true }, // positive number; consume reduces stock
    reason: { type: String, default: '' },
    linkedAdmissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalAdmission', required: false },
    occurredAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true }
);

hospitalInventoryTxnSchema.index({ hospitalId: 1, occurredAt: -1 });
hospitalInventoryTxnSchema.index({ hospitalId: 1, itemId: 1, occurredAt: -1 });

module.exports = mongoose.model('HospitalInventoryTxn', hospitalInventoryTxnSchema);

