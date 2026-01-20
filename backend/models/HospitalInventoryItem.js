const mongoose = require('mongoose');

const hospitalInventoryItemSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },
    name: { type: String, required: true }, // e.g. Oxygen Cylinders, Masks, Paracetamol
    category: { type: String, required: true }, // e.g. Oxygen, PPE, Medicine, Consumables
    unit: { type: String, required: true, default: 'units' }, // e.g. cylinders, boxes, strips
    currentStock: { type: Number, required: true, default: 0, min: 0 },
    minStock: { type: Number, required: true, default: 0, min: 0 },
    reorderQty: { type: Number, required: true, default: 0, min: 0 }
  },
  { timestamps: true }
);

hospitalInventoryItemSchema.index({ hospitalId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('HospitalInventoryItem', hospitalInventoryItemSchema);

