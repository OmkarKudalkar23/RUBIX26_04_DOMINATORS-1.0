const express = require('express');
const router = express.Router();
const queueService = require('../services/queueService');
const HospitalOpdCheckIn = require('../models/HospitalOpdCheckIn');
const Doctor = require('../models/Doctor');
const { authenticate, requireRole } = require('../middleware/auth'); // Assuming you have these

// Middleware to authenticate all routes
router.use(authenticate);

// POST /api/queue/check-in
// Add a patient to the dynamic queue
router.post('/check-in', requireRole('hospital'), async (req, res) => {
    try {
        // DEBUG: Log what we're receiving
        console.log('=== OPD CHECK-IN DEBUG ===');
        console.log('req.user:', req.user);
        console.log('req.body:', req.body);

        const checkInData = {
            ...req.body,
            hospitalId: req.user.hospitalId || req.body.hospitalId // Handle both if needed, usually from user
        };

        console.log('checkInData after merge:', checkInData);

        // Fix: Convert estimatedArrivalTime (HH:MM string OR ISO datetime) to Date object if present
        if (checkInData.estimatedArrivalTime && typeof checkInData.estimatedArrivalTime === 'string') {
            if (checkInData.estimatedArrivalTime.includes('T')) {
                // It's a full datetime string from datetime-local input
                checkInData.estimatedArrivalTime = new Date(checkInData.estimatedArrivalTime);
            } else {
                // Fallback for just HH:MM time string
                const [hours, minutes] = checkInData.estimatedArrivalTime.split(':');
                const etaDate = new Date();
                etaDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                checkInData.estimatedArrivalTime = etaDate;
            }
        }

        // Basic validation
        if (!checkInData.hospitalId || !checkInData.patientName || !checkInData.department) {
            console.error('VALIDATION FAILED:');
            console.error('  hospitalId:', checkInData.hospitalId);
            console.error('  patientName:', checkInData.patientName);
            console.error('  department:', checkInData.department);
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Auto-assign doctor if not provided
        if (!checkInData.doctorName || checkInData.doctorName === '') {
            console.log('No doctor specified, attempting auto-assignment...');
            const assignedDoctor = await queueService.assignDoctorAutomatically(
                checkInData.hospitalId,
                checkInData.department
            );

            if (assignedDoctor) {
                checkInData.doctorId = assignedDoctor._id;
                checkInData.doctorName = assignedDoctor.name;
                console.log(`✅ Auto-assigned to: ${assignedDoctor.name}`);
            } else {
                console.log('⚠️  No available doctors found, patient will be unassigned');
            }
        } else if (!checkInData.doctorId) {
            // Doctor name provided manually, try to resolve ID
            try {
                const cleanName = checkInData.doctorName.replace(/^Dr\.?\s+/i, '').trim();
                const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                const doctor = await Doctor.findOne({
                    hospitalId: checkInData.hospitalId,
                    name: { $regex: new RegExp(escapedName + '$', 'i') }
                });

                if (doctor) {
                    checkInData.doctorId = doctor._id;
                    console.log(`✅ Resolved doctorId for "${checkInData.doctorName}": ${doctor._id}`);
                }
            } catch (err) {
                console.warn('Error resolving doctor ID:', err);
            }
        }


        // Default queueNumber to end of list initially (service will rebalance)
        // Reset queue number count for TODAY
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const count = await HospitalOpdCheckIn.countDocuments({
            hospitalId: checkInData.hospitalId,
            department: checkInData.department,
            checkInTime: { $gte: startOfDay, $lte: endOfDay }
        });
        checkInData.queueNumber = count + 1;

        // Set default status to 'checked-in' so patients don't auto-start
        if (!checkInData.status) {
            checkInData.status = 'checked-in';
        }

        const newEntry = await queueService.addToQueue(checkInData);
        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: 'Failed to check in patient', details: error.message });
    }
});

// GET /api/queue
// Get the current sorted queue
router.get('/', requireRole('hospital'), async (req, res) => {
    try {
        const { department, doctorId } = req.query;
        const hospitalId = req.user.hospitalId;

        // Build query - department is now OPTIONAL
        const query = {
            hospitalId,
            status: { $nin: ['completed', 'no-show'] } // Don't show completed or no-show
        };

        // Only filter by department if explicitly provided
        if (department) {
            query.department = department;
        }
        if (doctorId) query.doctorId = doctorId;

        // Return sorted by queueNumber
        const queue = await HospitalOpdCheckIn.find(query).sort({ queueNumber: 1 });
        res.json(queue);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch queue', details: error.message });
    }
});

// PATCH /api/queue/:id
// Update patient status (e.g. arrival, emergency) -> Triggers Rebalance
router.patch('/:id', requireRole('hospital'), async (req, res) => {
    try {
        const updates = req.body;
        const { id } = req.params;

        const updatedPatient = await queueService.updatePatientStatus(id, updates);
        res.json(updatedPatient);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update patient', details: error.message });
    }
});

// POST /api/queue/rebalance
// Manually trigger rebalance (admin/debug)
router.post('/rebalance', requireRole('hospital'), async (req, res) => {
    try {
        const { department, doctorId } = req.body;
        const hospitalId = req.user.hospitalId;
        const result = await queueService.rebalanceQueue(hospitalId, department, doctorId);
        res.json({ message: 'Queue rebalanced', result });
    } catch (error) {
        res.status(500).json({ error: 'Rebalance failed', details: error.message });
    }
});

module.exports = router;
