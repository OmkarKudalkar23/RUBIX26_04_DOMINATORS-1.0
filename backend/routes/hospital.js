const express = require('express');
const bcrypt = require('bcryptjs');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const HospitalBed = require('../models/HospitalBed');
const HospitalDoctorSlot = require('../models/HospitalDoctorSlot');
const HospitalStaff = require('../models/HospitalStaff');
const HospitalSurgeAlert = require('../models/HospitalSurgeAlert');
const HospitalEnvironment = require('../models/HospitalEnvironment');
const HospitalAppointment = require('../models/HospitalAppointment');
const HospitalOpdCheckIn = require('../models/HospitalOpdCheckIn');
const HospitalAdmission = require('../models/HospitalAdmission');
const HospitalInventoryItem = require('../models/HospitalInventoryItem');
const HospitalInventoryTxn = require('../models/HospitalInventoryTxn');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const { fetchRealTimeEnvironmentData } = require('../services/aqiService');
const axios = require('axios');
const { allocateBed } = require('../services/admissionRules');

const router = express.Router();

// All routes require authentication and hospital role
router.use(authenticate);
router.use(requireRole('hospital'));

// Helper function to get hospital by userId
const getHospitalByUserId = async (userId) => {
  return await Hospital.findOne({ userId });
};

// ==================== BEDS ====================

// GET /api/hospital/beds
// GET /api/hospital/beds
router.get('/beds', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const beds = await HospitalBed.find({ hospitalId: hospital._id }).sort({ type: 1 });

    // Ensure beds array is populated via the pre-save hook logic if it was empty
    // We might need to save once to trigger the migration if it hasn't happened yet
    /* 
    // OPTIONAL: Force migration if needed (can be removed if seeding handles it)
    for (let b of beds) {
      if ((!b.beds || b.beds.length === 0) && b.total > 0) {
        await b.save(); 
      }
    }
    */

    res.json(beds.map(bed => ({
      id: bed._id.toString(),
      type: bed.type,
      total: bed.total,
      occupied: bed.occupied,
      available: bed.available,
      beds: bed.beds // Return individual bed details
    })));
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/hospital/bed-summary
// Live bed availability summary (driven by admissions admit/discharge updates to HospitalBed)
router.get('/bed-summary', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const beds = await HospitalBed.find({ hospitalId: hospital._id }).sort({ type: 1 });
    const totalBeds = beds.reduce((sum, b) => sum + (b.total || 0), 0);
    const occupiedBeds = beds.reduce((sum, b) => sum + (b.occupied || 0), 0);
    const availableBeds = beds.reduce((sum, b) => sum + (b.available || 0), 0);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Admissions today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const admissionsToday = await HospitalAdmission.countDocuments({
      hospitalId: hospital._id,
      createdAt: { $gte: start, $lte: end }
    });

    res.json({
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate,
      admissionsToday,
      byType: beds.map((b) => ({
        id: b._id.toString(),
        type: b.type,
        total: b.total,
        occupied: b.occupied,
        available: b.available,
        beds: b.beds
      }))
    });
  } catch (error) {
    console.error('Error fetching bed summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/beds - Add a new ward/bed type
router.post('/beds', async (req, res) => {
  try {
    let { type, total } = req.body;

    if (!type || total === undefined) {
      return res.status(400).json({ message: 'Ward type and total capacity are required' });
    }

    total = parseInt(total);
    if (isNaN(total) || total < 0) {
      return res.status(400).json({ message: 'Total capacity must be a valid number' });
    }

    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    // Check if ward type already exists
    const existing = await HospitalBed.findOne({
      hospitalId: hospital._id,
      type: { $regex: new RegExp(`^${type}$`, 'i') } // Case insensitive check
    });

    if (existing) {
      return res.status(400).json({ message: `Ward type '${existing.type}' already exists. Please update the existing one.` });
    }

    // Create individual bed objects
    const bedsArr = [];
    for (let i = 1; i <= total; i++) {
      bedsArr.push({ number: i, status: 'available' });
    }

    const newBed = new HospitalBed({
      hospitalId: hospital._id,
      type,
      total,
      occupied: 0,
      available: total,
      beds: bedsArr
    });

    await newBed.save();

    res.status(201).json({
      id: newBed._id.toString(),
      type: newBed.type,
      total: newBed.total,
      occupied: newBed.occupied,
      available: newBed.available,
      beds: newBed.beds
    });

  } catch (error) {
    console.error('Error creating bed type:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/hospital/beds/:id
router.patch('/beds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { total, occupied, available, action, bedNumber } = req.body;

    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const bed = await HospitalBed.findById(id);
    if (!bed) {
      return res.status(404).json({ message: 'Bed record not found' });
    }

    // Verify ownership
    if (bed.hospitalId.toString() !== hospital._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Ensure beds array exists (migration)
    if ((!bed.beds || bed.beds.length === 0) && bed.total > 0) {
      const newBeds = [];
      for (let i = 1; i <= bed.total; i++) {
        const status = i <= bed.occupied ? 'occupied' : 'available';
        newBeds.push({ number: i, status });
      }
      bed.beds = newBeds;
    }

    // Handle action-based updates
    if (action === 'occupy') {
      if (bedNumber) {
        // Occupy SPECIFIC bed
        const targetBed = bed.beds.find(b => b.number === bedNumber);
        if (!targetBed) return res.status(404).json({ message: 'Bed number not found' });
        if (targetBed.status === 'occupied') return res.status(400).json({ message: 'Bed already occupied' });
        targetBed.status = 'occupied';
      } else {
        // Auto-occupy first available
        const firstAvailable = bed.beds.find(b => b.status === 'available');
        if (firstAvailable) {
          firstAvailable.status = 'occupied';
        } else {
          return res.status(400).json({ message: 'No available beds to occupy' });
        }
      }
    } else if (action === 'release') {
      if (bedNumber) {
        // Release SPECIFIC bed
        const targetBed = bed.beds.find(b => b.number === bedNumber);
        if (!targetBed) return res.status(404).json({ message: 'Bed number not found' });
        if (targetBed.status === 'available') return res.status(400).json({ message: 'Bed already available' });
        targetBed.status = 'available';
        targetBed.patientId = null;
        targetBed.admissionId = null;
      } else {
        // Auto-release first occupied (LIFO or FIFO doesn't strictly matter for counts, but LIFO matches typical "undo")
        const lastOccupied = [...bed.beds].reverse().find(b => b.status === 'occupied');
        if (lastOccupied) {
          lastOccupied.status = 'available';
          lastOccupied.patientId = null;
          lastOccupied.admissionId = null;
        } else {
          return res.status(400).json({ message: 'No occupied beds to release' });
        }
      }
    } else if (action === 'add-bed') {
      const nextNumber = (bed.beds.length > 0) ? Math.max(...bed.beds.map(b => b.number)) + 1 : 1;
      bed.beds.push({ number: nextNumber, status: 'available' });
    } else {
      // Legacy or direct updates (e.g. just changing totals manually)
      // If user passes 'total', we might need to resize array. 
      // For simplicity, let's assume UI uses 'add-bed' for adding. 
      // If 'total' is passed and it differs from current length, we can try to adjust.
      if (total !== undefined && total > bed.beds.length) {
        const diff = total - bed.beds.length;
        let startNum = (bed.beds.length > 0) ? Math.max(...bed.beds.map(b => b.number)) + 1 : 1;
        for (let i = 0; i < diff; i++) {
          bed.beds.push({ number: startNum++, status: 'available' });
        }
      }
    }

    // pre-save hook will sync calculate occupied/available/total from beds array
    await bed.save();

    res.json({
      id: bed._id.toString(),
      type: bed.type,
      total: bed.total,
      occupied: bed.occupied,
      available: bed.available,
      beds: bed.beds
    });
  } catch (error) {
    console.error('Error updating bed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== DOCTORS ====================

// GET /api/hospital/doctors - Get all doctors linked to this hospital
router.get('/doctors', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    // Find doctor users linked to this hospital
    const doctorUsers = await User.find({
      role: 'doctor',
      $or: [
        { hospitalId: hospital._id },
        { doctorId: { $ne: null } }
      ]
    }).populate('doctorId');

    const doctors = doctorUsers
      .filter((u) => {
        if (u.hospitalId && u.hospitalId.toString() === hospital._id.toString()) return true;
        const d = u.doctorId;
        return d && d.hospitalId && d.hospitalId.toString() === hospital._id.toString();
      })
      .map((u) => {
        const d = u.doctorId;
        return {
          id: u._id.toString(),
          name: u.name || (d && d.name) || 'Unknown Doctor',
          email: u.email,
          specialization: d ? d.specialization : null,
          department: d ? d.department : null,
          available: true // Can be extended to check slot availability
        };
      });

    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/doctors - Add a new doctor
router.post('/doctors', async (req, res) => {
  try {
    const { name, email, specialization, department } = req.body;

    // Basic validation
    if (!name || !email || !specialization || !department) {
      return res.status(400).json({ message: 'Name, email, specialization, and department are required' });
    }

    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    // Check if user with this email already exists
    let user = await User.findOne({ email });
    let doctorProfile;

    if (user) {
      // If user exists, they must be a doctor to be added here.
      // In a real system, you might invite them. For now, we assume simple creation flow.
      if (user.role !== 'doctor') {
        return res.status(400).json({ message: 'User with this email exists but is not a doctor' });
      }

      // If user exists but is not linked to this hospital, we define linking logic.
      // For simplicity in this demo: we update their hospitalId if it's currently null
      if (!user.hospitalId) {
        user.hospitalId = hospital._id;
        await user.save();
      }

      // Also ensure Doctor profile exists
      if (user.doctorId) {
        doctorProfile = await Doctor.findById(user.doctorId);
        if (doctorProfile && !doctorProfile.hospitalId) {
          doctorProfile.hospitalId = hospital._id;
          await doctorProfile.save();
        }
      }

    } else {
      // Create new User and Doctor profile
      const tempPassword = "DoctorPassword@123"; // Default password for new doctors
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      // 1. Create Doctor Profile first (to get ID) or after?
      // Let's create Doctor profile first since User references it in this schema style often, 
      // or User first. Looking at User model (not visible but inferred), it has doctorId ref.

      doctorProfile = new Doctor({
        name,
        specialization,
        department, // Note: Schema might not have department explicitly on top level? Checking Doctor.js view... 
        // Doctor.js has: name, specialization, education, etc. NO 'department' field in the schema trace earlier!
        // Wait, HospitalDoctorSlot has 'department'. Doctor model usually implies department via specialization.
        // I will add 'department' to Doctor model if needed or distinct.
        // The view of Doctor.js showed: name, specialization, education, phone, address, hospitalId. 
        // NO 'department'. I should probably stick to specialization or add it.
        // For now, I'll store it in specialization if department is redundant, OR assume specialization ~= department.
        // Actually, UI asks for both. I will save 'specialization' as "Specialization (Department)" or 
        // update Doctor schema. 
        // Let's update Doctor schema to include department. It's cleaner.
        // For now, I will proceed assuming I can add it, or just use specialization.
        hospitalId: hospital._id
      });
      // Adding department dynamically if schema strictly enforces... Mongoose ignores unknown fields if strict is true.
      // I'll check strictness later. I'll save it to be safe.

      await doctorProfile.save();

      // 2. Create User
      user = new User({
        name,
        email,
        passwordHash,
        role: 'doctor',
        hospitalId: hospital._id,
        doctorId: doctorProfile._id
      });
      await user.save();

      // Update doctor with userId
      doctorProfile.userId = user._id;
      // Also, if I can't add department to Doctor model without schema change, I'll rely on Slot generation to pick up department from elsewhere?
      // Actually hospital-doctor-slot requires department. 
      // I will save the department in the Doctor model - I need to update the model file too.
      await doctorProfile.save();
    }

    res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      specialization: doctorProfile?.specialization || specialization,
      department: department, // Pass back what was sent
      available: true
    });

  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== DOCTOR SLOTS ====================

// GET /api/hospital/doctor-slots
router.get('/doctor-slots', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    // Source doctors from `users` table (role: doctor) instead of the HospitalDoctorSlot table.
    // We still store slots in HospitalDoctorSlot so the existing UI + toggle endpoint continue to work.
    const today = new Date().toISOString().split('T')[0];

    // Find doctor users for this hospital. 
    // Logic updated to dynamic sync by domain + existing links
    // 1. Get hospital admin email domain
    const hospitalAdmin = await User.findById(req.user.id);
    const adminEmail = hospitalAdmin ? hospitalAdmin.email : '';
    const domain = adminEmail.split('@')[1]; // e.g., cityhospital.com

    let domainQuery = {};
    if (domain) {
      domainQuery = {
        email: { $regex: new RegExp(`@${domain}$`, 'i') }
      };
    }

    const doctorUsers = await User.find({
      role: 'doctor',
      $or: [
        { hospitalId: hospital._id },
        { doctorId: { $ne: null }, ...domainQuery }, // If linked to different hospital, might be tricky, but usually implies same org via domain
        domainQuery // Matches domain
      ]
    }).populate('doctorId');

    const doctorsForHospital = [];

    for (const u of doctorUsers) {
      let shouldInclude = false;

      // Check strict ID match
      if (u.hospitalId && u.hospitalId.toString() === hospital._id.toString()) {
        shouldInclude = true;
      }
      // Check profile match
      else if (u.doctorId && u.doctorId.hospitalId && u.doctorId.hospitalId.toString() === hospital._id.toString()) {
        shouldInclude = true;
      }
      // Check Domain match
      else if (domain && u.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) {
        shouldInclude = true;

        // AUTO-LINKING: Update user if not linked
        if (!u.hospitalId) {
          u.hospitalId = hospital._id;
          await u.save();

          // Ensure profile exists/linked
          if (u.doctorId) {
            const d = await Doctor.findById(u.doctorId);
            if (d && !d.hospitalId) {
              d.hospitalId = hospital._id;
              await d.save();
            }
          } else {
            // Create profile if missing (handled in slot generation implicitly or we can do here)
            // Let's create it here to be robust
            const d = new Doctor({
              userId: u._id,
              name: u.name,
              email: u.email,
              hospitalId: hospital._id,
              specialization: 'General',
              department: 'General'
            });
            await d.save();
            u.doctorId = d._id;
            await u.save();
          }
        }
      }

      if (shouldInclude) {
        doctorsForHospital.push(u);
      }
    }

    // Default slot template (can be edited by toggling available/blocked)
    const defaultSlots = [
      { time: '09:00 AM', status: 'available' },
      { time: '09:30 AM', status: 'available' },
      { time: '10:00 AM', status: 'available' },
      { time: '10:30 AM', status: 'available' },
      { time: '11:00 AM', status: 'available' },
      { time: '11:30 AM', status: 'available' },
      { time: '02:00 PM', status: 'available' },
      { time: '02:30 PM', status: 'available' },
      { time: '03:00 PM', status: 'available' },
      { time: '03:30 PM', status: 'available' },
      { time: '04:00 PM', status: 'available' }
    ];

    // Ensure we have a slot document for each doctor for "today"
    // (Only create if missing; do not overwrite existing schedules)
    for (const u of doctorsForHospital) {
      const doctorProfile = u.doctorId || null;
      const doctorName = doctorProfile?.name || u.name;
      const specialization = doctorProfile?.specialization || 'General Medicine';
      const department = specialization || 'General';

      const existing = await HospitalDoctorSlot.findOne({
        hospitalId: hospital._id,
        doctorName,
        date: today
      });

      if (!existing) {
        await HospitalDoctorSlot.create({
          hospitalId: hospital._id,
          doctorName,
          specialization,
          department,
          date: today,
          slots: defaultSlots
        });
      }
    }

    // Return today's slots (generated from users/doctors)
    const slots = await HospitalDoctorSlot.find({ hospitalId: hospital._id, date: today })
      .sort({ doctorName: 1 });

    res.json(slots.map(slot => ({
      id: slot._id.toString(),
      doctorName: slot.doctorName,
      specialization: slot.specialization,
      department: slot.department,
      date: slot.date,
      slots: slot.slots.map(s => ({
        time: s.time,
        status: s.status,
        patientName: s.patientName
      }))
    })));
  } catch (error) {
    console.error('Error fetching doctor slots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/hospital/doctor-slots/:doctorSlotId/slots/:slotIndex
router.patch('/doctor-slots/:doctorSlotId/slots/:slotIndex', async (req, res) => {
  try {
    const { doctorSlotId, slotIndex } = req.params;
    const index = parseInt(slotIndex);

    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const doctorSlot = await HospitalDoctorSlot.findById(doctorSlotId);
    if (!doctorSlot) {
      return res.status(404).json({ message: 'Doctor slot not found' });
    }

    // Verify ownership
    if (doctorSlot.hospitalId.toString() !== hospital._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (index < 0 || index >= doctorSlot.slots.length) {
      return res.status(400).json({ message: 'Invalid slot index' });
    }

    const slot = doctorSlot.slots[index];

    // Cannot modify booked slots
    if (slot.status === 'booked') {
      return res.status(400).json({ message: 'Cannot modify booked slots' });
    }

    // Toggle between available and blocked
    if (slot.status === 'available') {
      slot.status = 'blocked';
    } else if (slot.status === 'blocked') {
      slot.status = 'available';
    }

    await doctorSlot.save();

    res.json({
      id: doctorSlot._id.toString(),
      doctorName: doctorSlot.doctorName,
      specialization: doctorSlot.specialization,
      department: doctorSlot.department,
      date: doctorSlot.date,
      slots: doctorSlot.slots.map(s => ({
        time: s.time,
        status: s.status,
        patientName: s.patientName
      }))
    });
  } catch (error) {
    console.error('Error toggling slot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== STAFF ====================

// GET /api/hospital/staff
router.get('/staff', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const staff = await HospitalStaff.find({ hospitalId: hospital._id }).sort({ name: 1 });

    res.json(staff.map(member => ({
      id: member._id.toString(),
      name: member.name,
      role: member.role,
      department: member.department,
      shift: member.shift,
      status: member.status
    })));
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/hospital/staff/:id/status
router.patch('/staff/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'on-leave', 'off-duty'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const staffMember = await HospitalStaff.findById(id);
    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Verify ownership
    if (staffMember.hospitalId.toString() !== hospital._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    staffMember.status = status;
    await staffMember.save();

    res.json({
      id: staffMember._id.toString(),
      name: staffMember.name,
      role: staffMember.role,
      department: staffMember.department,
      shift: staffMember.shift,
      status: staffMember.status
    });
  } catch (error) {
    console.error('Error updating staff status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/hospital/staff/:id
router.delete('/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const staffMember = await HospitalStaff.findById(id);
    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Verify ownership
    if (staffMember.hospitalId.toString() !== hospital._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await HospitalStaff.findByIdAndDelete(id);

    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/staff
router.post('/staff', async (req, res) => {
  try {
    const { name, role, department, shift, status } = req.body;

    if (!name || !role || !department || !shift) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const staffMember = new HospitalStaff({
      hospitalId: hospital._id,
      name,
      role,
      department,
      shift,
      status: status || 'active'
    });

    await staffMember.save();

    res.status(201).json({
      id: staffMember._id.toString(),
      name: staffMember.name,
      role: staffMember.role,
      department: staffMember.department,
      shift: staffMember.shift,
      status: staffMember.status
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== SURGE ALERTS ====================

// GET /api/hospital/surge-alerts
router.get('/surge-alerts', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const alerts = await HospitalSurgeAlert.find({ hospitalId: hospital._id })
      .sort({ date: -1, severity: -1 });

    res.json(alerts.map(alert => ({
      id: alert._id.toString(),
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      prediction: alert.prediction,
      date: alert.date,
      department: alert.department,
      expectedIncrease: alert.expectedIncrease,
      recommendations: alert.recommendations
    })));
  } catch (error) {
    console.error('Error fetching surge alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ENVIRONMENT ====================

// GET /api/hospital/environment
router.get('/environment', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    let environment = await HospitalEnvironment.findOne({ hospitalId: hospital._id });

    // Fetch real-time AQI and weather data
    try {
      const realTimeData = await fetchRealTimeEnvironmentData('Mumbai');

      // Update or create environment record with real-time data
      if (environment) {
        environment.aqi = realTimeData.aqi;
        environment.temperature = realTimeData.temperature;
        environment.humidity = realTimeData.humidity;
        environment.pollutionLevel = realTimeData.pollutionLevel;
        environment.festivalFlag = realTimeData.festivalFlag;
        await environment.save();
      } else {
        environment = new HospitalEnvironment({
          hospitalId: hospital._id,
          aqi: realTimeData.aqi,
          temperature: realTimeData.temperature,
          humidity: realTimeData.humidity,
          pollutionLevel: realTimeData.pollutionLevel,
          festivalFlag: realTimeData.festivalFlag
        });
        await environment.save();
      }

      console.log(`✅ Updated environment data: AQI=${realTimeData.aqi}, Temp=${realTimeData.temperature}°C, Source=${realTimeData.source}`);
    } catch (aqiError) {
      console.warn('Failed to fetch real-time AQI, using stored data:', aqiError.message);
      // If real-time fetch fails, use existing data or create default
      if (!environment) {
        environment = new HospitalEnvironment({
          hospitalId: hospital._id,
          aqi: 100,
          temperature: 30,
          humidity: 65,
          pollutionLevel: 'Moderate',
          festivalFlag: false
        });
        await environment.save();
      }
    }

    res.json({
      aqi: environment.aqi,
      temperature: environment.temperature,
      humidity: environment.humidity,
      pollutionLevel: environment.pollutionLevel,
      festivalFlag: environment.festivalFlag
    });
  } catch (error) {
    console.error('Error fetching environment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== HOSPITAL LOAD (Weather/Pollution Agent) ====================

// GET /api/hospital/load-forecast?city=Mumbai
// Uses Weather/Pollution Agent running on http://localhost:8000 to provide hospital load forecast.
router.get('/load-forecast', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const city = (req.query.city || 'Mumbai').toString();

    // Compute bed usage (%) and recent OPD volume as optional inputs
    const beds = await HospitalBed.find({ hospitalId: hospital._id });
    const totalBeds = beds.reduce((sum, b) => sum + (b.total || 0), 0);
    const occupiedBeds = beds.reduce((sum, b) => sum + (b.occupied || 0), 0);
    const bedUsage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : null;

    const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // HospitalAppointment stores date as YYYY-MM-DD, so filter via string comparison window
    const todayStr = new Date().toISOString().split('T')[0];
    const last7Str = last7.toISOString().split('T')[0];
    const last7Count = await HospitalAppointment.countDocuments({
      hospitalId: hospital._id,
      type: 'OPD',
      date: { $gte: last7Str, $lte: todayStr }
    });

    // Call Weather/Pollution Agent
    // Endpoint exists in ml/Mumbai_hacks/Whether_pollution_agent/api.py: GET /predict/{city}
    const agentUrl = `http://localhost:8000/predict/${encodeURIComponent(city)}`;
    const agentResp = await axios.get(agentUrl, { timeout: 8000 });
    const data = agentResp.data || {};

    return res.json({
      status: 'success',
      city,
      hospital_load: {
        expected_patients_next_24h: data.expected_patients_next_24h ?? null,
        surge_probability: data.surge_probability ?? null,
        aqi: data.aqi ?? null,
        pm25: data.pm25 ?? null,
        bed_usage_percent: bedUsage,
        last_7day_opd_patients: last7Count
      },
      timestamp: data.timestamp || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting hospital load forecast:', error.message);
    // Keep 200 to avoid UI spam; return a clear unavailable payload.
    return res.status(200).json({
      status: 'unavailable',
      city: (req.query.city || 'Mumbai').toString(),
      hospital_load: null,
      message: 'Weather/Pollution Agent is not running. Start it to enable hospital load forecasting on port 8000.'
    });
  }
});

// ==================== APPOINTMENTS ====================

// GET /api/hospital/appointments
router.get('/appointments', async (req, res) => {
  try {
    const { date } = req.query;
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    let query = { hospitalId: hospital._id };
    if (date) {
      query.date = date;
    }

    const appointments = await HospitalAppointment.find(query)
      .sort({ date: 1, time: 1 });

    res.json(appointments.map(apt => ({
      id: apt._id.toString(),
      patientName: apt.patientName,
      doctorName: apt.doctorName,
      department: apt.department,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      type: apt.type
    })));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== OPD QUEUE (Check-ins) ====================

// POST /api/hospital/opd/check-in
router.post('/opd/check-in', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const { patientName, department, doctorName, priority, appointmentId, visitType } = req.body;
    if (!patientName || !department) {
      return res.status(400).json({ message: 'patientName and department are required' });
    }

    // Queue number = max(queueNumber for today) + 1
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const last = await HospitalOpdCheckIn.findOne({
      hospitalId: hospital._id,
      checkInTime: { $gte: startOfToday, $lte: endOfToday }
    }).sort({ queueNumber: -1 });

    const nextQueueNumber = (last?.queueNumber || 0) + 1;

    const checkIn = await HospitalOpdCheckIn.create({
      hospitalId: hospital._id,
      appointmentId: appointmentId || undefined,
      patientName,
      department,
      doctorName: doctorName || '',
      visitType: visitType || 'OPD',
      priority: priority || 'normal',
      queueNumber: nextQueueNumber
    });

    res.status(201).json({
      id: checkIn._id.toString(),
      patientName: checkIn.patientName,
      department: checkIn.department,
      doctorName: checkIn.doctorName,
      visitType: checkIn.visitType,
      status: checkIn.status,
      priority: checkIn.priority,
      queueNumber: checkIn.queueNumber,
      checkInTime: checkIn.checkInTime
    });
  } catch (error) {
    console.error('Error creating OPD check-in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/hospital/opd/queue?date=YYYY-MM-DD
router.get('/opd/queue', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const date = (req.query.date || new Date().toISOString().split('T')[0]).toString();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const items = await HospitalOpdCheckIn.find({
      hospitalId: hospital._id,
      checkInTime: { $gte: start, $lte: end }
    }).sort({ priority: 1, queueNumber: 1, checkInTime: 1 });

    res.json(items.map((c) => ({
      id: c._id.toString(),
      patientName: c.patientName,
      department: c.department,
      doctorName: c.doctorName,
      visitType: c.visitType,
      status: c.status,
      priority: c.priority,
      queueNumber: c.queueNumber,
      checkInTime: c.checkInTime
    })));
  } catch (error) {
    console.error('Error fetching OPD queue:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/hospital/opd/queue/:id
router.patch('/opd/queue/:id', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const checkIn = await HospitalOpdCheckIn.findById(req.params.id);
    if (!checkIn) return res.status(404).json({ message: 'Check-in not found' });
    if (checkIn.hospitalId.toString() !== hospital._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, priority, doctorName, notes } = req.body;
    if (status) checkIn.status = status;
    if (priority) checkIn.priority = priority;
    if (doctorName !== undefined) checkIn.doctorName = doctorName;
    if (notes !== undefined) checkIn.notes = notes;

    await checkIn.save();

    res.json({
      id: checkIn._id.toString(),
      patientName: checkIn.patientName,
      department: checkIn.department,
      doctorName: checkIn.doctorName,
      visitType: checkIn.visitType,
      status: checkIn.status,
      priority: checkIn.priority,
      queueNumber: checkIn.queueNumber,
      checkInTime: checkIn.checkInTime,
      notes: checkIn.notes
    });
  } catch (error) {
    console.error('Error updating OPD check-in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== INVENTORY ====================

// GET /api/hospital/inventory
router.get('/inventory', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const items = await HospitalInventoryItem.find({ hospitalId: hospital._id }).sort({ category: 1, name: 1 });
    res.json(items.map((i) => ({
      id: i._id.toString(),
      name: i.name,
      category: i.category,
      unit: i.unit,
      currentStock: i.currentStock,
      minStock: i.minStock,
      reorderQty: i.reorderQty
    })));
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/inventory/:itemId/consume
router.post('/inventory/:itemId/consume', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const { qty, reason, linkedAdmissionId } = req.body;
    const q = Number(qty);
    if (!q || q <= 0) return res.status(400).json({ message: 'qty must be > 0' });

    const item = await HospitalInventoryItem.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    if (item.hospitalId.toString() !== hospital._id.toString()) return res.status(403).json({ message: 'Access denied' });

    item.currentStock = Math.max(0, item.currentStock - q);
    await item.save();

    const txn = await HospitalInventoryTxn.create({
      hospitalId: hospital._id,
      itemId: item._id,
      type: 'consume',
      qty: q,
      reason: reason || '',
      linkedAdmissionId: linkedAdmissionId || undefined
    });

    res.status(201).json({
      item: {
        id: item._id.toString(),
        name: item.name,
        currentStock: item.currentStock,
        minStock: item.minStock
      },
      txn: { id: txn._id.toString(), type: txn.type, qty: txn.qty, occurredAt: txn.occurredAt }
    });
  } catch (error) {
    console.error('Error consuming inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/hospital/inventory/alerts
router.get('/inventory/alerts', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const items = await HospitalInventoryItem.find({ hospitalId: hospital._id });
    const lowStock = items
      .filter((i) => i.currentStock <= i.minStock)
      .map((i) => ({
        id: i._id.toString(),
        name: i.name,
        category: i.category,
        unit: i.unit,
        currentStock: i.currentStock,
        minStock: i.minStock,
        reorderQty: i.reorderQty
      }));

    res.json({ lowStock });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/hospital/inventory/trends?days=7
router.get('/inventory/trends', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const days = Math.max(1, Math.min(30, parseInt((req.query.days || '7').toString(), 10) || 7));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const txns = await HospitalInventoryTxn.find({
      hospitalId: hospital._id,
      occurredAt: { $gte: since }
    }).populate('itemId');

    // Aggregate per day per item (consumption only)
    const dayKey = (d) => new Date(d).toISOString().split('T')[0];
    const byItem = {};
    for (const t of txns) {
      const item = t.itemId;
      if (!item) continue;
      const key = item._id.toString();
      if (!byItem[key]) byItem[key] = { itemId: key, name: item.name, unit: item.unit, days: {} };
      const dk = dayKey(t.occurredAt);
      if (!byItem[key].days[dk]) byItem[key].days[dk] = 0;
      if (t.type === 'consume') byItem[key].days[dk] += t.qty;
      if (t.type === 'restock') byItem[key].days[dk] -= t.qty; // optional: negative means restock
    }

    res.json({
      days,
      since: since.toISOString(),
      items: Object.values(byItem)
    });
  } catch (error) {
    console.error('Error fetching inventory trends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ADMISSIONS (Rule-based Workflow) ====================

// GET /api/hospital/admissions
router.get('/admissions', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const admissions = await HospitalAdmission.find({ hospitalId: hospital._id }).sort({ createdAt: -1 }).limit(200);
    res.json(admissions.map((a) => ({
      id: a._id.toString(),
      patientName: a.patientName,
      age: a.age,
      department: a.department,
      bedType: a.bedType,
      severity: a.severity,
      oxygenRequired: a.oxygenRequired,
      isolationRequired: a.isolationRequired,
      status: a.status,
      allocatedBedTypeId: a.allocatedBedTypeId ? a.allocatedBedTypeId.toString() : null,
      allocationNote: a.allocationNote,
      admittedAt: a.admittedAt,
      dischargedAt: a.dischargedAt,
      createdAt: a.createdAt
    })));
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/admissions (creates + attempts allocation)
router.post('/admissions', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const { patientName, age, department, bedType, severity, oxygenRequired, isolationRequired } = req.body;
    if (!patientName || !department || !bedType) {
      return res.status(400).json({ message: 'patientName, department, bedType are required' });
    }

    const admission = await HospitalAdmission.create({
      hospitalId: hospital._id,
      patientName,
      age: age !== undefined ? Number(age) : undefined,
      department,
      bedType,
      severity: severity || 'medium',
      oxygenRequired: !!oxygenRequired,
      isolationRequired: !!isolationRequired,
      status: 'pending'
    });

    // Attempt allocation immediately
    const beds = await HospitalBed.find({ hospitalId: hospital._id });
    const alloc = allocateBed(admission, beds);
    if (alloc) {
      admission.status = 'allocated';
      admission.allocatedBedTypeId = alloc.allocatedBed._id;
      admission.allocationNote = alloc.allocationNote;
      await admission.save();
    } else {
      admission.allocationNote = 'No beds available for the requested constraints.';
      await admission.save();
    }

    res.status(201).json({
      id: admission._id.toString(),
      status: admission.status,
      allocatedBedTypeId: admission.allocatedBedTypeId ? admission.allocatedBedTypeId.toString() : null,
      allocationNote: admission.allocationNote
    });
  } catch (error) {
    console.error('Error creating admission:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/admissions/:id/admit (occupy bed + auto-consume inventory)
router.post('/admissions/:id/admit', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const admission = await HospitalAdmission.findById(req.params.id);
    if (!admission) return res.status(404).json({ message: 'Admission not found' });
    if (admission.hospitalId.toString() !== hospital._id.toString()) return res.status(403).json({ message: 'Access denied' });

    if (!admission.allocatedBedTypeId) return res.status(400).json({ message: 'Admission not allocated to a bed yet' });

    const bed = await HospitalBed.findById(admission.allocatedBedTypeId);
    if (!bed) return res.status(400).json({ message: 'Allocated bed type missing' });
    if (bed.available <= 0) return res.status(400).json({ message: 'No available beds for allocation' });

    // Occupy bed
    bed.occupied += 1;
    await bed.save();

    admission.status = 'admitted';
    admission.admittedAt = new Date();
    await admission.save();

    // Inventory consumption templates (basic)
    const consumePlan = [];
    const items = await HospitalInventoryItem.find({ hospitalId: hospital._id });
    const byName = (n) => items.find((i) => i.name.toLowerCase() === n.toLowerCase());

    // Always: masks 1 box/ patient admission (demo)
    const masks = byName('Medical Masks');
    if (masks) consumePlan.push({ item: masks, qty: 1, reason: 'admission-ppe' });

    // Oxygen requirement: consume cylinders
    if (admission.oxygenRequired) {
      const oxy = byName('Oxygen Cylinders');
      if (oxy) consumePlan.push({ item: oxy, qty: 1, reason: 'admission-oxygen' });
    }

    // IV fluids for high/critical
    if (admission.severity === 'high' || admission.severity === 'critical') {
      const iv = byName('IV Fluids');
      if (iv) consumePlan.push({ item: iv, qty: 1, reason: 'admission-iv' });
    }

    const txns = [];
    for (const p of consumePlan) {
      p.item.currentStock = Math.max(0, p.item.currentStock - p.qty);
      await p.item.save();
      const txn = await HospitalInventoryTxn.create({
        hospitalId: hospital._id,
        itemId: p.item._id,
        type: 'consume',
        qty: p.qty,
        reason: p.reason,
        linkedAdmissionId: admission._id
      });
      txns.push(txn);
    }

    res.json({
      admission: {
        id: admission._id.toString(),
        status: admission.status,
        admittedAt: admission.admittedAt
      },
      bed: { id: bed._id.toString(), type: bed.type, total: bed.total, occupied: bed.occupied, available: bed.available },
      inventoryTxns: txns.map((t) => ({ id: t._id.toString(), itemId: t.itemId.toString(), qty: t.qty, occurredAt: t.occurredAt }))
    });
  } catch (error) {
    console.error('Error admitting patient:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/admissions/:id/discharge (release bed)
router.post('/admissions/:id/discharge', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const admission = await HospitalAdmission.findById(req.params.id);
    if (!admission) return res.status(404).json({ message: 'Admission not found' });
    if (admission.hospitalId.toString() !== hospital._id.toString()) return res.status(403).json({ message: 'Access denied' });

    if (!admission.allocatedBedTypeId) return res.status(400).json({ message: 'Admission not allocated' });

    const bed = await HospitalBed.findById(admission.allocatedBedTypeId);
    if (!bed) return res.status(400).json({ message: 'Allocated bed type missing' });
    if (bed.occupied <= 0) return res.status(400).json({ message: 'No occupied beds to release' });

    bed.occupied -= 1;
    await bed.save();

    admission.status = 'discharged';
    admission.dischargedAt = new Date();
    await admission.save();

    res.json({
      admission: { id: admission._id.toString(), status: admission.status, dischargedAt: admission.dischargedAt },
      bed: { id: bed._id.toString(), type: bed.type, total: bed.total, occupied: bed.occupied, available: bed.available }
    });
  } catch (error) {
    console.error('Error discharging patient:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PROFILE & SETTINGS ====================

// PATCH /api/hospital/profile
router.patch('/profile', async (req, res) => {
  try {
    const { hospitalName, email, phone, address } = req.body;

    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    // Update hospital profile
    if (hospitalName !== undefined) hospital.name = hospitalName;
    if (phone !== undefined) hospital.phone = phone;
    if (address !== undefined) hospital.address = address;

    await hospital.save();

    // Update user email if provided
    if (email !== undefined) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.email = email;
        await user.save();
      }
    }

    res.json({
      hospitalName: hospital.name,
      email: email || (await User.findById(req.user.id))?.email,
      phone: hospital.phone,
      address: hospital.address
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/appointments - Manual entry for walk-ins/phone
router.post('/appointments', async (req, res) => {
  try {
    const { patientName, doctorName, department, date, time, type } = req.body;
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const newAppointment = new HospitalAppointment({
      hospitalId: hospital._id,
      patientName,
      doctorName,
      department,
      date,
      time,
      type,
      status: 'scheduled'
    });

    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
});

// GET /api/hospital/doctors
router.get('/doctors', async (req, res) => {
  try {
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    // Fetch doctors linked to this hospital from the Doctor collection
    // This allows both manually added doctors AND auto-linked doctors to appear
    const doctors = await Doctor.find({ hospitalId: hospital._id });

    // Also fetch legacy embedded doctors if any (optional, but good for backward compatibility)
    // const embeddedDoctors = hospital.doctors || [];

    // Merge/Map to response format
    const response = doctors.map(d => ({
      id: d._id.toString(),
      name: d.name,
      email: d.email,
      specialization: d.specialization,
      department: d.department,
      available: true // Default
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching hospital doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/hospital/doctors - Add manual doctor
router.post('/doctors', async (req, res) => {
  try {
    const { name, email, specialization, department } = req.body;
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    // Create new Doctor profile
    const newDoctor = new Doctor({
      userId: req.user.id, // Note: For manually added doctors, we might not have a userId if they haven't signed up yet. 
      // But usually, manual add implies we are just creating a record.
      // ideally, we should check if a user exists with this email.
      // For now, let's create a standalone Doctor document. 
      // Note: Model requires userId. If manual add, we might need a workaround or create a placeholder User?
      // Re-reading Doctor model: userId is required.
      // If manually adding, maybe we search for User by email?
      name,
      email,
      specialization,
      department,
      hospitalId: hospital._id
    });

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      newDoctor.userId = user._id;
      await newDoctor.save();

      // Link user back
      user.doctorId = newDoctor._id;
      user.hospitalId = hospital._id;
      await user.save();
    } else {
      // If no user exists, we can't create a Doctor because userId is required.
      // However, the "Add Doctor" modal in dashboard takes name/email.
      // We should probably create a "pending" doctor or similar.
      // For this hackathon, let's create a placeholder User or remove required constraint.
      // Checking Doctor model again... yes required.
      // Let's create a placeholder User for them so they can claim it later?
      // Or simpler: just fail if user doesn't exist?
      // Let's assume for now we just create it. To bypass 'required', we need a valid ObjectId.
      // We'll use the hospital admin's ID as a placeholder if no user found, 
      // OR (Better) we find the user. If not found, we shouldn't allow adding?
      // Let's just create a dummy ID or skip userId check if possible? No, it's db level.
      // Let's try to find user. If null, maybe throw error "User must sign up first"?
      // But typically "Add Doctor" invites them.

      // DECISION: For now, I will use a generated ObjectId for userId if user missing, 
      // or better, I will assume the User MUST exist for this flow to work cleanly.
      // Actually, the user request is about the Signup flow. I should focus on GET first.

      // I will just add the GET endpoint for now to solve the immediate "Visibility" issue.
      // I'll add POST as well but keep it simple - find user or fail.

      if (!user) {
        return res.status(400).json({ message: 'Doctor must be registered as a user first (email not found)' });
      }
      newDoctor.userId = user._id;
      await newDoctor.save();
    }

    res.status(201).json({
      id: newDoctor._id.toString(),
      name: newDoctor.name,
      email: newDoctor.email,
      specialization: newDoctor.specialization,
      department: newDoctor.department
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Error adding doctor', error: error.message });
  }
});

// POST /api/hospital/surge-alerts - Manual alert creation
router.post('/surge-alerts', async (req, res) => {
  try {
    const { type, message, severity } = req.body; // severity: low, medium, high, critical
    const hospital = await getHospitalByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

    const newAlert = new HospitalSurgeAlert({
      hospitalId: hospital._id,
      alertType: type,
      message,
      severity: severity || 'high',
      status: 'active',
      timestamp: new Date()
    });

    await newAlert.save();
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(500).json({ message: 'Error creating alert', error: error.message });
  }
});

module.exports = router;

