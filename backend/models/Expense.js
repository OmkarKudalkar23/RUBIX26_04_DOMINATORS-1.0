const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  name: String,
  amountUSD: Number,
  date: { type: Date, default: Date.now },          // ISO
  category: { 
    type: String, 
    enum: ["Medicine", "Consultation", "Test"]
  }
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);