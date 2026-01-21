const mongoose = require('mongoose');
const HospitalOpdCheckIn = require('../models/HospitalOpdCheckIn');
const Doctor = require('../models/Doctor');
const HospitalDoctorSlot = require('../models/HospitalDoctorSlot');

// Tunable Weights for the Algorithm
const WEIGHTS = {
    MEDICAL_PRIORITY: {
        critical: 1000,
        high: 500,
        normal: 100,
        low: 10
    },
    EMERGENCY_OVERRIDE: 5000, // Massive boost for emergencies
    WAITING_TIME_FACTOR: 2, // Points per minute waiting
    ETA_PENALTY_FACTOR: 5,  // Points lost per minute late
    APPOINTMENT_BONUS: 50,  // Bonus for having a scheduled appointment
    CONSULTATION_COMPLEXITY: {
        high: 20,    // Slight boost to clear hard cases if urgent? Or maybe de-prioritize? 
        // Actually, usually complexity doesn't mean "do it sooner", but let's give a small weight 
        // to maybe group them or just acknowledge them. 
        // For now, let's say fairness means we treat them normally, but maybe 
        // slightly favoring quick ones could reduce avg wait time (Shortest Job First), 
        // but let's stick to user request: "Fair (no starvation)".
        // Let's keep it neutral for now or use it for estimated duration calculation.
        medium: 0,
        low: 0
    },
    ARRIVAL_STATUS: {
        'arrived': 200,   // Big boost for being physically present
        'on-time': 100,
        'delayed': 0,     // Neutral base (additional -50 penalty applied in logic)
        'no-show': 0,     // Neutral base (additional -1000 penalty applied in logic)
        'waiting': 0      // Remote/En-route
    }
};

/**
 * Automatically assign a doctor based on department and current workload
 * @param {ObjectId} hospitalId - Hospital ID
 * @param {String} department - Department name
 * @returns {Object|null} - Doctor object or null if none available
 */
async function assignDoctorAutomatically(hospitalId, department) {
    try {
        // Find all doctors in this hospital matching the department
        const doctors = await Doctor.find({
            hospitalId,
            $or: [
                { department: department },
                { specialization: department }
            ]
        });

        if (doctors.length === 0) {
            console.log(`No doctors found for department: ${department}`);
            return null;
        }

        // Calculate workload for each doctor (active patients)
        const workloads = await Promise.all(
            doctors.map(async (doctor) => {
                const activePatientCount = await HospitalOpdCheckIn.countDocuments({
                    hospitalId,
                    doctorId: doctor._id,
                    status: { $in: ['checked-in', 'in-triage', 'in-consult'] }
                });
                return {
                    doctor,
                    workload: activePatientCount
                };
            })
        );

        // Sort by workload (ascending) - assign to least busy doctor
        workloads.sort((a, b) => a.workload - b.workload);

        const assigned = workloads[0];
        console.log(`Auto-assigned to ${assigned.doctor.name} (current workload: ${assigned.workload})`);

        return assigned.doctor;
    } catch (error) {
        console.error('Error in auto-assignment:', error);
        return null;
    }
}

/**
 * Calculates the dynamic priority score for a patient.
 * Higher score = Higher priority (closer to front of queue).
 */
const calculatePriorityScore = (checkIn) => {
    let score = 0;
    const now = new Date();

    // 1. Base Medical Priority
    score += WEIGHTS.MEDICAL_PRIORITY[checkIn.priority] || WEIGHTS.MEDICAL_PRIORITY.normal;

    // 2. Emergency Override
    if (checkIn.isEmergency) {
        score += WEIGHTS.EMERGENCY_OVERRIDE;
    }

    // 3. Waiting Time Weight (Prevent Starvation)
    // Time since check-in (or booking time if earlier?)
    // Let's use checkInTime as the start of the "wait".
    const waitDurationMinutes = (now - new Date(checkIn.checkInTime)) / (1000 * 60);
    if (waitDurationMinutes > 0) {
        score += waitDurationMinutes * WEIGHTS.WAITING_TIME_FACTOR;
    }

    // 4. ETA & Arrival Status
    // If they are physically here, they get a boost.
    score += WEIGHTS.ARRIVAL_STATUS[checkIn.arrivalStatus] || 0;

    // Apply additional penalties for delayed and no-show
    if (checkIn.arrivalStatus === 'no-show') {
        score -= 1000;
    } else if (checkIn.arrivalStatus === 'delayed') {
        score -= 50;
    }

    // ETA Logic:
    // If they are not arrived yet, checks ETA.
    if (checkIn.arrivalStatus !== 'arrived' && checkIn.estimatedArrivalTime) {
        const eta = new Date(checkIn.estimatedArrivalTime);
        const timeUntilArrival = (eta - now) / (1000 * 60);

        if (timeUntilArrival > 15) {
            // If arriving much later (>15 mins), reduce priority heavily so they don't block
            // (This is "ETA-expired patients must not block" logic, interpreted as "future patients shouldn't block present ones")
            score -= 500;
        } else if (timeUntilArrival < -10) {
            // If ETA passed by 10 mins and still not 'arrived', penalty
            // "Patients who have not arrived near their ETA must lose priority"
            score -= Math.abs(timeUntilArrival) * WEIGHTS.ETA_PENALTY_FACTOR;
        }
    }

    // 5. Appointment Bonus
    if (checkIn.appointmentId) {
        score += WEIGHTS.APPOINTMENT_BONUS;
    }

    return Math.round(score);
};

/**
 * Rebalances the queue for a specific hospital and department/doctor.
 * Recalculates scores, sorts, and assigns new queue numbers.
 */
const rebalanceQueue = async (hospitalId, department, doctorId = null) => {
    try {
        const query = {
            hospitalId,
            department,
            status: { $in: ['checked-in', 'in-triage', 'waiting'] } // Only reorder waiting patients, not those in-consult or completed
        };

        // Optional: Rebalance specific doctor's queue if assigned
        // If dynamic queue is per-department, we ignore doctorId filter or handle it differently.
        // Assuming mixed queue for department unless doctor specified.
        if (doctorId) {
            query.doctorId = doctorId;
        }

        const patients = await HospitalOpdCheckIn.find(query);

        // 1. Recalculate Scores
        const scoredPatients = patients.map(p => {
            const score = calculatePriorityScore(p);
            return { doc: p, score };
        });

        // 2. Sort: Highest score first. 
        // Tie-breaker: Earlier booking/check-in time.
        scoredPatients.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score; // Descending Score
            return a.doc.checkInTime - b.doc.checkInTime;  // Ascending Time (FIFO fallback)
        });

        // 3. Update DB
        // We update queueNumber (1-based index) and priorityScore
        const bulkOps = scoredPatients.map((item, index) => ({
            updateOne: {
                filter: { _id: item.doc._id },
                update: {
                    $set: {
                        priorityScore: item.score,
                        queueNumber: index + 1
                    }
                }
            }
        }));

        if (bulkOps.length > 0) {
            await HospitalOpdCheckIn.bulkWrite(bulkOps);
        }

        return scoredPatients.map(p => ({
            id: p.doc._id,
            name: p.doc.patientName,
            score: p.score,
            queueNumber: p.queueNumber
        }));

    } catch (error) {
        console.error("Queue Rebalance Error:", error);
        throw error;
    }
};

/**
 * Add a new patient to the queue and trigger rebalance.
 */
const addToQueue = async (checkInData) => {
    const newEntry = new HospitalOpdCheckIn(checkInData);
    await newEntry.save();

    // Trigger real-time rebalance
    await rebalanceQueue(newEntry.hospitalId, newEntry.department, newEntry.doctorId);

    return newEntry;
};

/**
 * Update patient status (e.g. arrival, emergency upgrade) and rebalance.
 * Also updates doctor's currentPatientId for accurate busy/free tracking.
 */
const updatePatientStatus = async (id, updates) => {
    const patient = await HospitalOpdCheckIn.findByIdAndUpdate(id, updates, { new: true });

    if (patient) {
        const today = new Date().toISOString().split('T')[0];

        // Update doctor's currentPatientId based on consultation status
        if (updates.status === 'in-consult') {
            // Try to find slot by doctorId first (more reliable), then name
            const query = {
                hospitalId: patient.hospitalId,
                date: today
            };

            if (patient.doctorId) {
                query.doctorId = patient.doctorId;
            } else {
                // Fallback: Name match with "Dr." prefix handling and case-insensitivity
                const cleanName = patient.doctorName.replace(/^Dr\.?\s+/i, '').trim();
                const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.doctorName = { $regex: new RegExp(escapedName + '$', 'i') };
            }

            let updatedSlot = await HospitalDoctorSlot.findOneAndUpdate(
                query,
                { currentPatientId: patient._id },
                { new: true }
            );

            // AUTO-CREATE SLOT IF MISSING
            if (!updatedSlot) {
                console.log(`⚠️ Slot not found for ${query.doctorName || patient.doctorId}. Creating new slot for today...`);

                // We need more details to create a slot. Try to fetch doctor profile if possible.
                let doctorProfile = null;
                if (patient.doctorId) {
                    doctorProfile = await Doctor.findById(patient.doctorId);
                } else {
                    // Try finding by name
                    const cleanName = patient.doctorName.replace(/^Dr\.?\s+/i, '').trim();
                    doctorProfile = await Doctor.findOne({
                        hospitalId: patient.hospitalId,
                        name: { $regex: new RegExp(cleanName, 'i') }
                    });
                }

                if (doctorProfile) {
                    const defaultSlots = [
                        { time: '09:00 AM', status: 'available' }, { time: '09:30 AM', status: 'available' },
                        { time: '10:00 AM', status: 'available' }, { time: '10:30 AM', status: 'available' },
                        { time: '11:00 AM', status: 'available' }, { time: '11:30 AM', status: 'available' },
                        { time: '02:00 PM', status: 'available' }, { time: '02:30 PM', status: 'available' },
                        { time: '03:00 PM', status: 'available' }, { time: '03:30 PM', status: 'available' },
                        { time: '04:00 PM', status: 'available' }
                    ];

                    updatedSlot = await HospitalDoctorSlot.create({
                        hospitalId: patient.hospitalId,
                        doctorId: doctorProfile._id,
                        doctorName: doctorProfile.name,
                        specialization: doctorProfile.specialization || 'General',
                        department: doctorProfile.department || patient.department || 'General',
                        date: today,
                        isActive: true,
                        currentPatientId: patient._id, // Set busy immediately
                        slots: defaultSlots
                    });
                    console.log(`✅ Created and assigned new slot for ${doctorProfile.name}`);
                }
            }

            if (updatedSlot) {
                console.log(`Doctor ${updatedSlot.doctorName} (ID matched: ${!!patient.doctorId}) is now BUSY with patient ${patient.patientName}`);

                // CRITICAL FIX: If we matched by name, save the doctorId to the patient record
                // This guarantees the "Complete" step will find the EXACT same slot via ID
                if (!patient.doctorId && updatedSlot.doctorId) {
                    console.log(`✅ Linking Patient ${patient.patientName} to DoctorID ${updatedSlot.doctorId}`);
                    // We must use a separate update because 'patient' is already fetched
                    await HospitalOpdCheckIn.findByIdAndUpdate(patient._id, { doctorId: updatedSlot.doctorId });
                }
            } else {
                console.warn(`Could not find or create doctor slot for ${patient.doctorName} (ID: ${patient.doctorId}) to set BUSY status.`);
            }
        }
        else if (updates.status === 'completed' || updates.status === 'no-show') {
            // Doctor is now FREE
            const query = {
                hospitalId: patient.hospitalId,
                date: today
            };

            if (patient.doctorId) {
                query.doctorId = patient.doctorId;
            } else {
                // Fallback: Name match with "Dr." prefix handling and case-insensitivity
                const cleanName = patient.doctorName.replace(/^Dr\.?\s+/i, '').trim();
                const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.doctorName = { $regex: new RegExp(escapedName + '$', 'i') };
            }

            let updatedSlot = await HospitalDoctorSlot.findOneAndUpdate(
                query,
                { currentPatientId: null },
                { new: true }
            );

            // AUTO-CREATE SLOT IF MISSING (Even for completion, though rare)
            if (!updatedSlot) {
                // Logic similar to above, but setting currentPatientId to null is default, so just create empty available slot
                // Not strictly necessary to create a slot just to free it, but keeps data consistent.
                // Skipping specifically for 'freeing' to avoid complexity, but logging it.
                console.warn(`Slot missing while trying to free doctor ${patient.doctorName}. This is minor as they are being freed anyway.`);
            }

            if (updatedSlot) {
                console.log(`Doctor ${updatedSlot.doctorName} is now FREE`);
            } else {
                // If we really can't find the slot, it's fine, the doctor is "effectively" free if no slot says busy.
                console.warn(`Could not find doctor slot for ${patient.doctorName} to set FREE status.`);
            }
        }

        // Rebalance queue
        await rebalanceQueue(patient.hospitalId, patient.department, patient.doctorId);
    }
    return patient;
    /**
     * Auto-assigns a doctor based on Department and Availability.
     * Strategy:
     * 1. Filter usable slots by Department for today.
     * 2. Priorities:
     *    a) FREE status (currentPatientId === null)
     *    b) Least loaded (fewest assigned patients in queue - TODO for future)
     *    c) First available
     */
    const assignDoctorAutomatically = async (hospitalId, department) => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Find all active doctor slots for this department
            // We look for doctors who are 'isActive'
            const candidateSlots = await HospitalDoctorSlot.find({
                hospitalId,
                date: today,
                department: department, // Strict department match
                isActive: true
            });

            if (!candidateSlots || candidateSlots.length === 0) {
                console.warn(`No active doctor slots found for department: ${department}`);
                return null;
            }

            // 2. Filter for FREE doctors first (currentPatientId is null)
            const freeSlots = candidateSlots.filter(s => !s.currentPatientId);

            if (freeSlots.length > 0) {
                // Pick the first free doctor (Simple "Next Available")
                // Enhancement: could be round-robin or random
                const selected = freeSlots[0];
                console.log(`✅ Smart Assign: Found FREE doctor ${selected.doctorName} for department ${department}`);
                return {
                    _id: selected.doctorId,
                    name: selected.doctorName
                };
            }

            // 3. If all busy, pick the one with fewest patients in queue (Load Balancing)
            // For now, simpler fallback: Random
            const randomSlot = candidateSlots[Math.floor(Math.random() * candidateSlots.length)];
            console.log(`⚠️ Smart Assign: All doctors busy. Assigning to ${randomSlot.doctorName} (Load Balancing)`);
            return {
                _id: randomSlot.doctorId,
                name: randomSlot.doctorName
            };

        } catch (error) {
            console.error("Auto-assign error:", error);
            return null; // Fallback to unassigned
        }
    }
};

module.exports = {
    calculatePriorityScore,
    rebalanceQueue,
    addToQueue,
    updatePatientStatus,
    assignDoctorAutomatically
};
