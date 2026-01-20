const express = require('express');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');

const router = express.Router();

// Get all doctors (for patient appointment booking)
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find({}).select('name specialization hospitalId').populate('hospitalId', 'name');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doctor's patients
router.get('/:id/patients', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const prescriptions = await Prescription.find({ doctorId: req.params.id })
      .populate('patientId')
      .populate('hospitalId');

    // Extract unique patient IDs
    const patientIds = [...new Set(prescriptions.map(p => p.patientId))];
    const patients = await Patient.find({
      '_id': { $in: patientIds }
    }).populate('userId');

    res.json({
      doctor,
      patients
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;