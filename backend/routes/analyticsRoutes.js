const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const HospitalOpdCheckIn = require('../models/HospitalOpdCheckIn');
const Doctor = require('../models/Doctor');
const HospitalDoctorSlot = require('../models/HospitalDoctorSlot');

/**
 * GET /api/hospital/analytics/doctor-availability
 * Returns count of doctors by availability status
 * FREE: Has slot today with isActive=true AND currentPatientId is null
 * BUSY: Has currentPatientId set (currently consulting)
 * OFFLINE: No active slot today OR isActive=false
 */
router.get('/doctor-availability', requireRole('hospital'), async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId;
        const today = new Date().toISOString().split('T')[0];

        // Get all doctors in this hospital
        const allDoctors = await Doctor.find({ hospitalId });
        const totalDoctors = allDoctors.length;

        // Get all doctor slots for today
        const todaySlots = await HospitalDoctorSlot.find({
            hospitalId,
            date: today
        });

        let free = 0;
        let occupied = 0;
        let offline = 0;

        // Count based on isActive and currentPatientId
        todaySlots.forEach(slot => {
            if (!slot.isActive) {
                offline++;
            } else if (slot.currentPatientId) {
                occupied++;  // Has a patient, is busy
            } else {
                free++;  // Active but no patient
            }
        });

        // Doctors without slots today are offline
        const doctorsWithSlots = new Set(todaySlots.map(s => s.doctorName));
        allDoctors.forEach(doc => {
            if (!doctorsWithSlots.has(doc.name)) {
                offline++;
            }
        });

        res.json({ free, occupied, offline, total: totalDoctors });
    } catch (error) {
        console.error('Error fetching doctor availability:', error);
        res.status(500).json({ error: 'Failed to fetch doctor availability' });
    }
});

/**
 * GET /api/hospital/analytics/department-workload
 * Returns patient count and doctor count by department
 */
router.get('/department-workload', requireRole('hospital'), async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId;

        // Get all departments with their doctors
        const doctors = await Doctor.find({ hospitalId });
        const departmentDoctors = {};

        doctors.forEach(doc => {
            const dept = doc.department || doc.specialization || 'General';
            if (!departmentDoctors[dept]) {
                departmentDoctors[dept] = [];
            }
            departmentDoctors[dept].push(doc._id);
        });

        // Get active patients by department
        const activePatients = await HospitalOpdCheckIn.find({
            hospitalId,
            status: { $in: ['checked-in', 'in-triage', 'in-consult'] }
        });

        // Aggregate by department
        const workload = {};
        activePatients.forEach(patient => {
            const dept = patient.department || 'General';
            if (!workload[dept]) {
                workload[dept] = { activePatients: 0, totalDoctors: 0, occupiedDoctors: new Set() };
            }
            workload[dept].activePatients++;
            if (patient.status === 'in-consult' && patient.doctorId) {
                workload[dept].occupiedDoctors.add(patient.doctorId.toString());
            }
        });

        // Add doctor counts
        Object.keys(departmentDoctors).forEach(dept => {
            if (!workload[dept]) {
                workload[dept] = { activePatients: 0, totalDoctors: 0, occupiedDoctors: new Set() };
            }
            workload[dept].totalDoctors = departmentDoctors[dept].length;
        });

        // Format response
        const result = Object.keys(workload).map(dept => ({
            department: dept,
            activePatients: workload[dept].activePatients,
            occupied: workload[dept].occupiedDoctors.size,
            free: workload[dept].totalDoctors - workload[dept].occupiedDoctors.size,
            total: workload[dept].totalDoctors
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching department workload:', error);
        res.status(500).json({ error: 'Failed to fetch department workload' });
    }
});

/**
 * GET /api/hospital/analytics/top-doctors
 * Returns top doctors by active patient count
 */
router.get('/top-doctors', requireRole('hospital'), async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId;
        const limit = parseInt(req.query.limit) || 5;

        // Aggregate active patients by doctor
        const result = await HospitalOpdCheckIn.aggregate([
            {
                $match: {
                    hospitalId,
                    status: { $in: ['checked-in', 'in-triage', 'in-consult'] }
                }
            },
            {
                $group: {
                    _id: '$doctorName',
                    activePatients: { $sum: 1 },
                    inConsult: {
                        $sum: { $cond: [{ $eq: ['$status', 'in-consult'] }, 1, 0] }
                    }
                }
            },
            { $sort: { activePatients: -1 } },
            { $limit: limit }
        ]);

        const formatted = result.map(doc => ({
            name: doc._id || 'Unassigned',
            activePatients: doc.activePatients,
            inConsult: doc.inConsult
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching top doctors:', error);
        res.status(500).json({ error: 'Failed to fetch top doctors' });
    }
});

/**
 * GET /api/hospital/analytics/queue-trend?hours=6
 * Returns queue length over time
 */
router.get('/queue-trend', requireRole('hospital'), async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId;
        const hours = parseInt(req.query.hours) || 6;

        const now = new Date();
        const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

        // Get all check-ins in the time range
        const checkIns = await HospitalOpdCheckIn.find({
            hospitalId,
            checkInTime: { $gte: startTime }
        }).sort({ checkInTime: 1 });

        // Group by hour
        const trend = [];
        for (let i = 0; i <= hours; i++) {
            const hourTime = new Date(startTime.getTime() + i * 60 * 60 * 1000);
            const hourStr = hourTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

            const count = checkIns.filter(c => {
                const checkInHour = new Date(c.checkInTime);
                return checkInHour <= hourTime &&
                    (!c.completedTime || new Date(c.completedTime) > hourTime);
            }).length;

            trend.push({
                time: hourStr,
                queueLength: count
            });
        }

        res.json(trend);
    } catch (error) {
        console.error('Error fetching queue trend:', error);
        res.status(500).json({ error: 'Failed to fetch queue trend' });
    }
});

module.exports = router;
