const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  drugName: String,
  quantity: Number,
  unit: String,
  tabletsPerStrip: Number
});

const billSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    imageUrl: String,
    rawOcrText: String,
    items: [billItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);