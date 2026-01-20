const mongoose = require('mongoose');

const bedBookingSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    bedType: {
      type: String,
      enum: ["general", "ICU", "HDU"],
      default: "general"
    },
    fromTime: { type: Date, required: true },
    toTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["booked", "occupied", "released"],
      default: "booked"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BedBooking", bedBookingSchema);