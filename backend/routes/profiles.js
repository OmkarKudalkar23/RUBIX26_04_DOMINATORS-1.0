const express = require('express');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

const router = express.Router();

// Create patient profile
router.post('/patient', async (req, res) => {
  try {
    const { userId, age, gender, dob, bloodGroup, phone, address, education, medicalHistory, certificateUrl, aadhaarUrl } = req.body;

    // Validate required fields
    if (!userId || !age || !gender || !dob || !bloodGroup) {
      return res.status(400).json({ message: 'Missing required fields: userId, age, gender, dob, bloodGroup' });
    }

    // Check if user exists and is a patient
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'patient') {
      return res.status(400).json({ message: 'User is not a patient' });
    }

    // Check if patient profile already exists
    if (user.patientId) {
      const existingPatient = await Patient.findById(user.patientId);
      if (existingPatient) {
        return res.status(400).json({ message: 'Patient profile already exists' });
      }
    }

    // Create patient profile
    const patient = new Patient({
      userId,
      fullName: user.name, // Use name from user
      age: parseInt(age),
      gender,
      dob: new Date(dob),
      bloodGroup,
      phone: phone || "",
      address: address || "",
      education: education || "",
      medicalHistory: Array.isArray(medicalHistory) ? medicalHistory : (medicalHistory ? [medicalHistory] : []),
      certificateUrl: certificateUrl || "",
      aadhaarUrl: aadhaarUrl || ""
    });

    await patient.save();

    // Update user with patientId
    user.patientId = patient._id;
    await user.save();

    res.status(201).json({ 
      patient: {
        _id: patient._id,
        id: patient._id.toString(),
        ...patient.toObject()
      }
    });
  } catch (error) {
    console.error('Error creating patient profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create doctor profile
router.post('/doctor', async (req, res) => {
  try {
    const { userId, name, age, gender, dob, phone, address, specialization, education, certificateUrl, aadhaarUrl, hospitalId } = req.body;

    // Check if user exists and is a doctor
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'doctor') {
      return res.status(400).json({ message: 'User is not a doctor' });
    }

    // Create doctor profile
    const doctor = new Doctor({
      userId,
      name,
      age,
      gender,
      dob: new Date(dob),
      phone,
      address,
      specialization,
      education,
      certificateUrl,
      aadhaarUrl,
      hospitalId
    });

    await doctor.save();

    // Update user with doctorId
    user.doctorId = doctor._id;
    await user.save();

    res.status(201).json({ doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create hospital profile
router.post('/hospital', async (req, res) => {
  try {
    const { userId, name, phone, address, registrationDocUrl, doctors, bedTypes } = req.body;

    // Check if user exists and is a hospital
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'hospital') {
      return res.status(400).json({ message: 'User is not a hospital' });
    }

    // Create hospital profile
    const hospital = new Hospital({
      userId,
      name,
      phone,
      address,
      registrationDocUrl,
      doctors,
      bedTypes
    });

    await hospital.save();

    // Update user with hospitalId
    user.hospitalId = hospital._id;
    await user.save();

    res.status(201).json({ hospital });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;