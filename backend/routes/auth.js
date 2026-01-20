const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital'); // Import Hospital model
const Doctor = require('../models/Doctor'); // Import Doctor model
const HospitalDoctorSlot = require('../models/HospitalDoctorSlot'); // Import HospitalDoctorSlot model

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required: name, email, password, role' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Validate role
    if (!['patient', 'doctor', 'hospital'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be patient, doctor, or hospital' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role
    });

    await user.save();

    // If role is 'hospital', create a Hospital profile
    if (role === 'hospital') {
      const hospital = new Hospital({
        userId: user._id,
        name: user.name,
        // Default values for other fields
        address: '',
        phone: '',
        registrationDocUrl: '',
        doctors: [],
        bedTypes: []
      });
      await hospital.save();

      // Update user with hospitalId
      user.hospitalId = hospital._id;
      await user.save();
    }

    // Generate JWT token - use a default secret if not set
    // Auto-link Doctor to Hospital by Email Domain
    if (role === 'doctor') {
      const domain = email.split('@')[1];
      if (domain) {
        // Find a hospital user with the same email domain
        const hospitalUser = await User.findOne({
          role: 'hospital',
          email: { $regex: new RegExp(`@${domain}$`, 'i') }
        });

        if (hospitalUser && hospitalUser.hospitalId) {
          user.hospitalId = hospitalUser.hospitalId;

          // Create Doctor profile
          const doctor = new Doctor({
            userId: user._id,
            name: user.name,
            email: user.email,
            hospitalId: hospitalUser.hospitalId,
            specialization: 'General', // Default, can be updated later
            department: 'General'      // Default
          });
          await doctor.save();

          user.doctorId = doctor._id;
          await user.save();

          // Generate Doctor Slots for the next 7 days
          const dates = [];
          const today = new Date();
          for (let i = 0; i < 7; i++) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + i);
            dates.push(nextDate.toISOString().split('T')[0]);
          }

          const defaultSlots = [
            { time: "09:00", status: "available" },
            { time: "09:30", status: "available" },
            { time: "10:00", status: "available" },
            { time: "10:30", status: "available" },
            { time: "11:00", status: "available" },
            { time: "11:30", status: "available" },
            { time: "12:00", status: "available" },
            { time: "14:00", status: "available" },
            { time: "14:30", status: "available" },
            { time: "15:00", status: "available" },
            { time: "15:30", status: "available" },
            { time: "16:00", status: "available" }
          ];

          for (const date of dates) {
            await HospitalDoctorSlot.create({
              hospitalId: hospitalUser.hospitalId,
              doctorName: doctor.name,
              specialization: doctor.specialization,
              department: doctor.department, // Use 'department' from doctor object
              date: date,
              slots: defaultSlots
            });
          }

          console.log(`Auto-linked doctor ${email} to hospital ${hospitalUser.name} and generated slots.`);
        }
      }
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: null, // Will be set when profile is created
        doctorId: null,
        hospitalId: null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user has a password hash (for existing users without password)
    if (!user.passwordHash) {
      return res.status(400).json({ message: 'Account not properly set up. Please sign up again.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token - use a default secret if not set
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: user.patientId ? user.patientId.toString() : null,
        doctorId: user.doctorId ? user.doctorId.toString() : null,
        hospitalId: user.hospitalId ? user.hospitalId.toString() : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;