const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now },
  location: String
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  status: { 
    type: String, 
    enum: ["preparing", "dispatched", "in_transit", "delivered"],
    default: "preparing"
  },
  estimatedDelivery: Date,
  driverName: String,
  driverPhone: String,
  driverLocation: { 
    lat: Number, 
    lng: Number 
  },
  progress: { type: Number, default: 0 },   // 0-100
  statusHistory: [statusHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model("Delivery", deliverySchema);