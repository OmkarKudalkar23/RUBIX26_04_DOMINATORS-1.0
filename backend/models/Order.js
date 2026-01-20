const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  medicineId: mongoose.Schema.Types.ObjectId,       // or name
  name: String,
  priceUSD: Number,
  quantity: Number,
  prescriptionUploaded: Boolean
}, { _id: false });

const orderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  items: [orderItemSchema],
  totalUSD: Number,
  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ["Processing", "Dispatched", "Delivered", "Cancelled"],
    default: "Processing"
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);