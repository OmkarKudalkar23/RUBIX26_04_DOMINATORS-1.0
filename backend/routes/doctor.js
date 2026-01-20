const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const DoctorMedicalRecord = require('../models/DoctorMedicalRecord');
const { authenticate, requireRole } = require('../middleware/auth');
const { analyzeMedicalDocument } = require('../services/geminiService');

const router = express.Router();

// All routes require authentication and doctor role
router.use(authenticate);
router.use(requireRole('doctor'));

// Helper function to get doctor by userId
const getDoctorByUserId = async (userId) => {
  return await Doctor.findOne({ userId });
};

// a) GET /api/doctor/me - Get doctor profile
router.get('/me', async (req, res) => {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found. Please complete your profile setup.' });
    }

    // Populate hospital if exists
    await doctor.populate('hospitalId', 'name address');

    res.json({
      id: doctor._id.toString(),
      userId: doctor.userId.toString(),
      name: doctor.name,
      age: doctor.age,
      gender: doctor.gender,
      dob: doctor.dob,
      phone: doctor.phone,
      address: doctor.address,
      specialization: doctor.specialization,
      education: doctor.education,
      certificateUrl: doctor.certificateUrl,
      aadhaarUrl: doctor.aadhaarUrl,
      hospitalId: doctor.hospitalId ? doctor.hospitalId._id.toString() : null,
      hospital: doctor.hospitalId ? {
        name: doctor.hospitalId.name,
        address: doctor.hospitalId.address
      } : null
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// b) GET /api/doctor/me/appointments - Get all appointments for this doctor
router.get('/me/appointments', async (req, res) => {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Find all appointments for this doctor
    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId', 'fullName age gender bloodGroup phone address')
      .populate('hospitalId', 'name address')
      .sort({ 
        // Sort by: emergency first, then by date/time
        date: 1,
        time: 1
      });

    // Transform to match frontend expectations
    const formattedAppointments = appointments.map(apt => ({
      id: apt._id.toString(),
      patientId: apt.patientId ? apt.patientId._id.toString() : null,
      patientName: apt.patientId ? apt.patientId.fullName : 'Unknown Patient',
      patientAge: apt.patientId ? apt.patientId.age : null,
      patientGender: apt.patientId ? apt.patientId.gender : null,
      patientBloodGroup: apt.patientId ? apt.patientId.bloodGroup : null,
      patientPhone: apt.patientId ? apt.patientId.phone : null,
      patientAddress: apt.patientId ? apt.patientId.address : null,
      date: apt.date,
      time: apt.time,
      type: apt.type,
      status: apt.status,
      symptoms: apt.symptoms || apt.reason || '',
      notes: apt.notes || '',
      reason: apt.reason || '',
      hospitalId: apt.hospitalId ? apt.hospitalId._id.toString() : null,
      hospitalName: apt.hospitalId ? apt.hospitalId.name : null,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt
    }));

    // Custom sort: emergency first, then by date/time
    formattedAppointments.sort((a, b) => {
      if (a.type === 'emergency' && b.type !== 'emergency') return -1;
      if (a.type !== 'emergency' && b.type === 'emergency') return 1;
      
      // Both same type, sort by date/time
      const dateTimeA = new Date(`${a.date} ${a.time || '00:00'}`);
      const dateTimeB = new Date(`${b.date} ${b.time || '00:00'}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });

    res.json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// c) PATCH /api/doctor/appointments/:id - Update appointment status
router.patch('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "accepted" or "rejected"' });
    }

    // Get doctor
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Find appointment and verify it belongs to this doctor
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this appointment' });
    }

    // Update appointment
    appointment.status = status;
    if (notes !== undefined) {
      appointment.notes = notes;
    }
    await appointment.save();

    // Populate for response
    await appointment.populate('patientId', 'fullName age gender bloodGroup phone address');
    await appointment.populate('hospitalId', 'name address');

    res.json({
      id: appointment._id.toString(),
      patientId: appointment.patientId ? appointment.patientId._id.toString() : null,
      patientName: appointment.patientId ? appointment.patientId.fullName : 'Unknown Patient',
      patientAge: appointment.patientId ? appointment.patientId.age : null,
      patientGender: appointment.patientId ? appointment.patientId.gender : null,
      patientBloodGroup: appointment.patientId ? appointment.patientId.bloodGroup : null,
      patientPhone: appointment.patientId ? appointment.patientId.phone : null,
      patientAddress: appointment.patientId ? appointment.patientId.address : null,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      symptoms: appointment.symptoms || appointment.reason || '',
      notes: appointment.notes || '',
      reason: appointment.reason || '',
      hospitalId: appointment.hospitalId ? appointment.hospitalId._id.toString() : null,
      hospitalName: appointment.hospitalId ? appointment.hospitalId.name : null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// d) GET /api/doctor/patients/:patientId - Get patient history
router.get('/patients/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify doctor exists
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get appointments with this doctor
    const appointments = await Appointment.find({
      patientId: patient._id,
      doctorId: doctor._id
    })
      .populate('hospitalId', 'name address')
      .sort({ date: -1, time: -1 }); // Most recent first

    // Get all medical records for this patient
    const medicalRecords = await MedicalRecord.find({ patientId: patient._id })
      .populate('uploadedByDoctor', 'name specialization')
      .sort({ uploadDate: -1 }); // Most recent first

    // Find last visit date
    const lastVisit = appointments.length > 0 
      ? appointments[0].date 
      : null;

    // Format appointments
    const formattedAppointments = appointments.map(apt => ({
      id: apt._id.toString(),
      date: apt.date,
      time: apt.time,
      type: apt.type,
      status: apt.status,
      symptoms: apt.symptoms || apt.reason || '',
      notes: apt.notes || '',
      reason: apt.reason || '',
      hospitalId: apt.hospitalId ? apt.hospitalId._id.toString() : null,
      hospitalName: apt.hospitalId ? apt.hospitalId.name : null,
      createdAt: apt.createdAt
    }));

    // Format medical records
    const formattedRecords = medicalRecords.map(record => ({
      id: record._id.toString(),
      type: record.type,
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      uploadDate: record.uploadDate,
      summary: record.summary,
      extractedData: record.extractedData,
      uploadedByDoctor: record.uploadedByDoctor ? {
        id: record.uploadedByDoctor._id.toString(),
        name: record.uploadedByDoctor.name,
        specialization: record.uploadedByDoctor.specialization
      } : null
    }));

    // Return structured patient history
    res.json({
      id: patient._id.toString(),
      name: patient.fullName || 'Unknown',
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      phone: patient.phone,
      address: patient.address,
      medicalHistory: patient.medicalHistory || [],
      lastVisit: lastVisit,
      appointments: formattedAppointments,
      medicalRecords: formattedRecords
    });
  } catch (error) {
    console.error('Error fetching patient history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// e) GET /api/doctor/alerts - Get health alerts
router.get('/alerts', async (req, res) => {
  try {
    // For now, return sample alerts. In production, these would come from:
    // - EnvironmentReading model (pollution data)
    // - SurgePrediction model (surge alerts)
    // - Weather APIs
    // - Health department APIs
    // - Early Warning System

    // Sample alerts structure matching frontend expectations
    const alerts = [
      {
        id: '1',
        type: 'pollution',
        severity: 'high',
        title: 'High Air Quality Index',
        message: 'AQI levels in Mumbai are currently above 200. Patients with respiratory conditions should take precautions.',
        affectedConditions: ['Asthma', 'COPD', 'Respiratory'],
        recommendations: [
          'Advise patients to limit outdoor activities',
          'Recommend use of N95 masks',
          'Monitor patients with respiratory conditions closely'
        ],
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'seasonal',
        severity: 'medium',
        title: 'Monsoon Season Alert',
        message: 'Increased cases of dengue and malaria reported. Advise patients on preventive measures.',
        affectedConditions: ['Dengue', 'Malaria', 'Vector-borne diseases'],
        recommendations: [
          'Advise patients on mosquito prevention',
          'Monitor for fever symptoms',
          'Recommend mosquito nets and repellents'
        ],
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        type: 'epidemic',
        severity: 'low',
        title: 'Flu Season',
        message: 'Seasonal flu cases on the rise. Recommend flu vaccinations for at-risk patients.',
        affectedConditions: ['Influenza', 'Respiratory infections'],
        recommendations: [
          'Recommend flu vaccinations',
          'Advise hand hygiene',
          'Monitor for flu-like symptoms'
        ],
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      }
    ];

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads/medical-records');
// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDFs and images
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDFs and images are allowed.'));
    }
  }
});

// f) POST /api/doctor/medical-records - Upload and analyze medical document
router.post('/medical-records', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { type, patientId } = req.body;

    // Validate type
    const validTypes = ['prescription', 'report', 'xray', 'ct-scan', 'mri', 'lab-result', 'other'];
    if (!type || !validTypes.includes(type)) {
      // Delete uploaded file if type is invalid
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Get doctor
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      // Delete uploaded file if doctor not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Analyze document with Gemini
    let analysisResult;
    try {
      analysisResult = await analyzeMedicalDocument(
        req.file.path,
        req.file.mimetype,
        req.file.originalname,
        type
      );
    } catch (analysisError) {
      console.error('Error analyzing document:', analysisError);
      // Still save the record with fallback summary
      analysisResult = {
        summary: "AI analysis failed. Original document stored successfully.",
        extractedData: null
      };
    }

    // Create record in database
    const recordData = {
      doctorId: doctor._id,
      type: type,
      fileName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      summary: analysisResult.summary,
      extractedData: analysisResult.extractedData || null
    };

    // Add patientId if provided
    if (patientId) {
      // Validate patient exists
      const patient = await Patient.findById(patientId);
      if (patient) {
        recordData.patientId = patient._id;
      }
    }

    const record = new DoctorMedicalRecord(recordData);
    await record.save();

    // Generate public URL for file (in production, this would be a CDN URL)
    // For now, we'll use a relative path that the frontend can access
    // In production, you'd serve files via a static route or CDN
    const fileUrl = `/api/doctor/medical-records/${record._id}/file`;

    // Return formatted record matching frontend interface
    res.status(201).json({
      id: record._id.toString(),
      type: record.type,
      fileName: record.fileName,
      fileUrl: fileUrl,
      uploadDate: record.uploadDate.toISOString(),
      summary: record.summary,
      extractedData: record.extractedData
    });

  } catch (error) {
    console.error('Error uploading medical record:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// g) GET /api/doctor/medical-records - Get all medical records for logged-in doctor
router.get('/medical-records', async (req, res) => {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Find all records for this doctor, sorted by uploadDate descending
    const records = await DoctorMedicalRecord.find({ doctorId: doctor._id })
      .populate('patientId', 'fullName age gender')
      .sort({ uploadDate: -1 });

    // Format records to match frontend interface
    const formattedRecords = records.map(record => ({
      id: record._id.toString(),
      type: record.type,
      fileName: record.fileName,
      fileUrl: `/api/doctor/medical-records/${record._id}/file`,
      uploadDate: record.uploadDate.toISOString(),
      summary: record.summary || '',
      extractedData: record.extractedData || null
    }));

    res.json(formattedRecords);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// h) GET /api/doctor/medical-records/:id/file - Serve file
router.get('/medical-records/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const record = await DoctorMedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Verify ownership
    if (record.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(record.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers and send file
    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${record.fileName}"`);
    res.sendFile(path.resolve(record.filePath));
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// i) DELETE /api/doctor/medical-records/:id - Delete medical record
router.delete('/medical-records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const record = await DoctorMedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Verify ownership
    if (record.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to delete this record' });
    }

    // Delete file from disk if it exists
    if (record.filePath && fs.existsSync(record.filePath)) {
      try {
        fs.unlinkSync(record.filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await DoctorMedicalRecord.findByIdAndDelete(id);

    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


