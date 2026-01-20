const express = require('express');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Reminder = require('../models/Reminder');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');

const router = express.Router();

// Get patient overview
router.get('/:id/overview', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId')
      .populate('familyMembers.userId');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescriptions = await Prescription.find({ patientId: req.params.id });
    const reminders = await Reminder.find({ 
      patientId: req.params.id, 
      status: "pending" 
    });
    
    const upcomingAppointments = await Appointment.find({ 
      patientId: req.params.id,
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(5);

    res.json({
      patient,
      prescriptions,
      reminders,
      upcomingAppointments
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;