const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

const router = express.Router();

// Middleware to handle demo patient ID
const handleDemoPatient = (req, res, next) => {
  if (req.params.patientId === 'demo-patient-id') {
    Patient.findOne({}).then(patient => {
      if (patient) {
        req.params.patientId = patient._id.toString();
        req.patientId = patient._id.toString();
        next();
      } else {
        return res.status(404).json({ message: "Patient not found. Please create a patient profile first." });
      }
    }).catch(err => {
      return res.status(500).json({ message: 'Server error', error: err.message });
    });
  } else {
    req.patientId = req.params.patientId ? req.params.patientId.toString() : req.params.patientId;
    next();
  }
};

// Helper function to find or create hospital by name and coordinates
// Returns null if hospital can't be created (won't fail the appointment)
async function findOrCreateHospital(hospitalData) {
  try {
    // Try to find hospital by name (case-insensitive)
    let hospital = await Hospital.findOne({
      name: { $regex: new RegExp(hospitalData.name, 'i') }
    });

    if (!hospital) {
      try {
        // Create a new hospital record for external hospitals from Overpass API
        // External hospitals don't have a user account, so userId is optional
        hospital = new Hospital({
          name: hospitalData.name,
          phone: hospitalData.phone || '',
          address: hospitalData.address || `Lat: ${hospitalData.lat}, Lng: ${hospitalData.lng}`,
          doctors: [], // Initialize empty doctors array
          bedTypes: [] // Initialize empty bedTypes array
          // Note: userId is intentionally omitted for external hospitals
        });
        
        await hospital.save();
        console.log(`Created new hospital record: ${hospital.name} (${hospital._id})`);
      } catch (createError) {
        console.warn('Could not create hospital, will continue without hospital ObjectId:', createError.message);
        // Return null instead of throwing - appointment can still be created
        return null;
      }
    }

    return hospital;
  } catch (error) {
    console.error('Error finding/creating hospital:', error);
    // Return null instead of throwing - don't fail the appointment
    return null;
  }
}

// POST endpoint to create a new appointment
router.post('/patient/:patientId', handleDemoPatient, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { 
      hospitalId, 
      hospitalName, 
      hospitalLat, 
      hospitalLng,
      doctorId,
      doctorName,
      doctorSpecialty,
      date, 
      time, 
      type, 
      reason 
    } = req.body;

    // Validate required fields
    if (!date || !type) {
      return res.status(400).json({ error: 'date and type are required' });
    }

    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    let hospital = null;
    let doctor = null;

    // Find or create hospital - but don't require userId
    // For external hospitals, we'll just store the name and coordinates
    let hospitalObjectId = null;
    
    if (hospitalId && hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
      // If hospitalId is a MongoDB ObjectId, try to find it
      try {
        hospital = await Hospital.findById(hospitalId);
        if (hospital) {
          hospitalObjectId = hospital._id;
        }
      } catch (findError) {
        console.warn('Could not find hospital by ID:', findError.message);
      }
    }

    // If hospital not found by ID and we have hospitalName, try to find or create
    // But don't fail if we can't create it - just store the name
    if (!hospital && hospitalName) {
      hospital = await findOrCreateHospital({
        name: hospitalName,
        lat: hospitalLat,
        lng: hospitalLng,
        phone: '',
        address: ''
      });
      if (hospital) {
        hospitalObjectId = hospital._id;
      } else {
        console.log('Hospital not created, appointment will continue without hospital ObjectId');
      }
    }

    // Find doctor if doctorId provided
    if (doctorId && doctorId.match(/^[0-9a-fA-F]{24}$/)) {
      doctor = await Doctor.findById(doctorId);
    }

    // Add doctor to hospital's doctors array if hospital exists
    if (hospital && (doctorName || doctor)) {
      try {
        const finalDoctorName = doctorName || (doctor ? doctor.name : null);
        const finalDoctorSpecialty = doctorSpecialty || (doctor ? doctor.specialization : null);
        
        if (finalDoctorName) {
          // Ensure doctors array exists (safety check for existing hospitals)
          if (!hospital.doctors || !Array.isArray(hospital.doctors)) {
            hospital.doctors = [];
          }
          
          // Check if doctor already exists in hospital's doctors array (case-insensitive)
          const existingDoctorIndex = hospital.doctors.findIndex(
            d => d.name && d.name.toLowerCase() === finalDoctorName.toLowerCase()
          );
          
          if (existingDoctorIndex === -1) {
            // Doctor doesn't exist in hospital, add them
            hospital.doctors.push({
              name: finalDoctorName,
              specialization: finalDoctorSpecialty || 'General'
            });
            hospital.markModified('doctors');
            await hospital.save();
            console.log(`✅ Added doctor ${finalDoctorName} (${finalDoctorSpecialty || 'General'}) to hospital ${hospital.name}`);
            console.log(`   Hospital now has ${hospital.doctors.length} doctor(s) in database`);
          } else {
            console.log(`⏭️  Doctor ${finalDoctorName} already exists in hospital ${hospital.name}`);
          }
        }
      } catch (doctorError) {
        console.warn('Could not add doctor to hospital:', doctorError.message);
        console.error('Error details:', doctorError);
        // Continue without failing the appointment
      }
    }

    // Create appointment - use hospitalObjectId if available, otherwise null
    // Store doctorName and doctorSpecialty as fallback if doctorId is not available
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId: doctor ? doctor._id : null,
      hospitalId: hospitalObjectId, // Use the found/created hospital ID or null
      doctorName: doctorName || (doctor ? doctor.name : null), // Store doctor name as fallback
      doctorSpecialty: doctorSpecialty || (doctor ? doctor.specialization : null), // Store specialty as fallback
      date: date,
      time: time || (type === 'emergency' ? 'Immediate' : ''),
      type: type || 'checkup',
      status: 'pending',
      reason: reason || (doctorName ? `${doctorName} - ${doctorSpecialty || 'Consultation'}` : '')
    });

    await appointment.save();

    // Populate references for response
    await appointment.populate('doctorId', 'name specialization');
    await appointment.populate('hospitalId', 'name address');

    console.log(`Appointment created: ${appointment._id} for patient ${patientId} at hospital ${hospital?.name || 'Unknown'}`);

    res.status(201).json({
      ...appointment.toObject(),
      id: appointment._id.toString(),
      _id: appointment._id.toString(),
      doctor: appointment.doctorId?.name || appointment.doctorName || doctorName || 'Unknown Doctor',
      specialty: appointment.doctorId?.specialization || appointment.doctorSpecialty || doctorSpecialty || 'General',
      hospital: appointment.hospitalId?.name || hospitalName || 'Unknown Hospital'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment', details: error.message });
  }
});

module.exports = router;

