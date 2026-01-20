const express = require('express');
const axios = require('axios');
const Patient = require('../models/Patient');
const Medication = require('../models/Medication');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const Prediction = require('../models/Prediction');
const Order = require('../models/Order');
const Delivery = require('../models/Delivery');
const Expense = require('../models/Expense');

const router = express.Router();

// ML Model API URLs - Update these to match your ML service ports
const ML_API_URLS = {
  diabetes: process.env.DIABETES_ML_URL || 'http://localhost:8000', // Diabetes ML service
  kidney: process.env.KIDNEY_ML_URL || 'http://localhost:8002', // CKD ML service
  heart: process.env.HEART_ML_URL || 'http://localhost:8001', // Heart disease ML service (if available)
  sepsis: process.env.SEPSIS_ML_URL || 'http://localhost:8003' // Sepsis ML service (if available)
};

// Middleware to validate patient ID (in a real app, this would check auth token)
const validatePatient = (req, res, next) => {
  // For now, we'll just pass through
  // In a real implementation, this would verify the JWT and extract patient ID
  req.patientId = req.params.patientId || req.body.patientId || req.query.patientId;
  next();
};

// Middleware to handle demo patient ID
const handleDemoPatient = (req, res, next) => {
  if (req.params.patientId === 'demo-patient-id') {
    // For demo purposes, we'll find the actual patient ID from the database
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
    // Ensure patientId is a string
    req.patientId = req.params.patientId ? req.params.patientId.toString() : req.params.patientId;
    next();
  }
};

// 1. Get full snapshot for PatientDashboard (one big call)
router.get('/:patientId/me', handleDemoPatient, validatePatient, async (req, res) => {
  try {
    const patientId = req.patientId;
    const Doctor = require('../models/Doctor');
    const Hospital = require('../models/Hospital');

    // Verify patient exists
    const patientExists = await Patient.findById(patientId);
    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const [medicines, appointmentsRaw, medicalRecords, predictions, expenses, orders, deliveries] =
      await Promise.all([
        Medication.find({ patientId }),
        Appointment.find({ patientId }).populate('doctorId', 'name specialization').populate('hospitalId', 'name address'),
        MedicalRecord.find({ patientId }),
        Prediction.find({ patientId }).sort({ date: -1 }),
        Expense.find({ patientId }).sort({ date: -1 }),
        Order.find({ patientId }).sort({ date: -1 }),
        Delivery.find({ patientId }).sort({ createdAt: -1 }),
      ]);

    // Transform appointments to include doctor and hospital names
    const appointments = appointmentsRaw.map(apt => {
      const appointment = apt.toObject();
      return {
        ...appointment,
        doctor: appointment.doctorId?.name || 'Unknown Doctor',
        specialty: appointment.doctorId?.specialization || 'General',
        hospital: appointment.hospitalId?.name || 'Unknown Hospital',
      };
    });

    res.json({
      medicines,
      appointments,
      medicalRecords,
      predictions,
      expenses,
      orders,
      deliveries,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. Mark medicine as taken
router.post('/:patientId/medicines/:id/takings', handleDemoPatient, validatePatient, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body; // same as your frontend

    const med = await Medication.findOne({ _id: id, patientId: req.patientId });
    if (!med) return res.status(404).json({ message: "Medicine not found" });

    const existing = med.takings.find(t => t.date === date && t.time === time);
    const now = new Date();

    if (existing) {
      existing.taken = true;
      existing.takenAt = now;
    } else {
      med.takings.push({ date, time, taken: true, takenAt: now });
    }

    await med.save();
    res.json(med);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 3. Toggle reminder
router.post('/:patientId/medicines/:id/toggle-reminder', handleDemoPatient, validatePatient, async (req, res) => {
  try {
    const med = await Medication.findOne({ _id: req.params.id, patientId: req.patientId });
    if (!med) return res.status(404).json({ message: "Not found" });
    med.reminderEnabled = !med.reminderEnabled;
    await med.save();
    res.json({ reminderEnabled: med.reminderEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 4. Get patient profile
router.get('/:patientId/profile', handleDemoPatient, validatePatient, async (req, res) => {
  try {
    const patientId = req.patientId;
    const User = require('../models/User');
    
    let patient = null;
    
    // Try to find by patientId first
    if (patientId && patientId !== 'demo-patient-id') {
      patient = await Patient.findById(patientId).populate('userId', 'name email');
    }
    
    // If not found and we have userId from query, try finding by userId
    if (!patient && req.query.userId) {
      patient = await Patient.findOne({ userId: req.query.userId }).populate('userId', 'name email');
    }
    
    if (!patient) {
      // Try to get user info directly if patient not found but userId is provided
      if (req.query.userId) {
        const user = await User.findById(req.query.userId);
        if (user) {
          return res.json({
            fullName: user.name || 'Unknown',
            dob: '',
            bloodGroup: '',
            gender: '',
            email: user.email || '',
            phone: '',
            address: '',
            age: 0,
            medicalHistory: [],
          });
        }
      }
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const patientObj = patient.toObject();
    // Prioritize fullName from Patient, then userId.name, never use 'Unknown' if we have user data
    const displayName = patientObj.fullName || patientObj.userId?.name || 'Unknown';
    
    console.log('Patient profile response:', {
      patientId: patient._id.toString(),
      fullName: patientObj.fullName,
      userIdName: patientObj.userId?.name,
      displayName: displayName
    });
    
    res.json({
      fullName: displayName,
      dob: patientObj.dob ? new Date(patientObj.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
      bloodGroup: patientObj.bloodGroup || '',
      gender: patientObj.gender ? patientObj.gender.charAt(0).toUpperCase() + patientObj.gender.slice(1) : '',
      email: patientObj.userId?.email || '',
      phone: patientObj.phone || '',
      address: patientObj.address || '',
      age: patientObj.age || 0,
      medicalHistory: patientObj.medicalHistory || [],
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to call ML model API
async function callMLModel(type, inputs) {
  try {
    let apiUrl = '';
    let requestBody = {};
    
    switch (type) {
      case 'diabetes': {
        apiUrl = `${ML_API_URLS.diabetes}/predict`;
        // ML API requires all values > 0, so use minimum valid values for missing/zero inputs
        requestBody = {
          pregnancies: Math.max(0, parseInt(inputs.pregnancies) || 0),
          glucose: Math.max(1, parseFloat(inputs.glucose) || 1),
          bloodpressure: Math.max(1, parseFloat(inputs.bloodPressure) || 1),
          skinthickness: Math.max(1, parseFloat(inputs.skinThickness) || 1),
          insulin: Math.max(1, parseFloat(inputs.insulin) || 1), // API requires > 0
          BMI: Math.max(1, parseFloat(inputs.bmi) || 1),
          diabetespedigree: Math.max(0.001, parseFloat(inputs.diabetesPedigree) || 0.001),
          age: Math.max(1, parseInt(inputs.age) || 1)
        };
        break;
      }
        
      case 'kidney': {
        apiUrl = `${ML_API_URLS.kidney}/predict`;
        // Map frontend inputs to ML model inputs
        // Note: Frontend may not have all fields, so we use defaults for missing ones
        requestBody = {
          age: parseFloat(inputs.age) || 50,
          bp: parseFloat(inputs.bloodPressure) || 80,
          sg: parseFloat(inputs.sg) || 1.020, // Specific gravity - use input if available
          al: inputs.albumin ? (inputs.albumin === 'Abnormal' ? 1.0 : 0.0) : (parseFloat(inputs.al) || 0.0),
          su: inputs.sugar ? (inputs.sugar === 'Abnormal' ? 1.0 : 0.0) : (parseFloat(inputs.su) || 0.0),
          rbc: inputs.redBloodCells ? (inputs.redBloodCells === 'Normal' ? 'normal' : 'abnormal') : (inputs.rbc || 'normal'),
          pc: inputs.pusCells ? (inputs.pusCells === 'Normal' ? 'normal' : 'abnormal') : (inputs.pc || 'normal'),
          pcc: inputs.pcc || 'notpresent',
          ba: inputs.ba || 'notpresent',
          bgr: parseFloat(inputs.bgr) || parseFloat(inputs.bloodGlucose) || 120.0,
          bu: parseFloat(inputs.bu) || parseFloat(inputs.bloodUrea) || 36.0,
          sc: parseFloat(inputs.creatinine) || parseFloat(inputs.sc) || 1.2,
          sod: parseFloat(inputs.sodium) || parseFloat(inputs.sod) || 135.0,
          pot: parseFloat(inputs.potassium) || parseFloat(inputs.pot) || 4.5,
          hemo: parseFloat(inputs.hemoglobin) || parseFloat(inputs.hemo) || 12.5,
          pcv: parseFloat(inputs.pcv) || 44.0,
          wc: parseFloat(inputs.wc) || parseFloat(inputs.whiteBloodCells) || 7800.0,
          rc: parseFloat(inputs.rc) || parseFloat(inputs.redBloodCellCount) || 4.5,
          htn: inputs.hypertension ? (inputs.hypertension === 'Yes' ? 'yes' : 'no') : (inputs.htn || 'no'),
          dm: inputs.diabetesHistory ? (inputs.diabetesHistory === 'Yes' ? 'yes' : 'no') : (inputs.dm || 'no'),
          cad: inputs.cad || 'no',
          appet: inputs.appet || 'good',
          pe: inputs.pe || 'no',
          ane: inputs.ane || 'no'
        };
        break;
      }
        
      case 'heart': {
        // Heart disease prediction - using enhanced logic based on all inputs
        // You can replace this with actual ML API call when available
        const age = parseInt(inputs.age) || 50;
        const sex = inputs.sex === 'Male' ? 1 : 0;
        const cholesterol = parseInt(inputs.cholesterol) || 200;
        const restingBP = parseInt(inputs.restingBP) || 120;
        const maxHeartRate = parseInt(inputs.maxHeartRate) || 150;
        const fastingSugar = inputs.fastingSugar === 'Yes' ? 1 : 0;
        const stDepression = parseFloat(inputs.stDepression) || 0;
        const vessels = parseInt(inputs.vessels) || 0;
        
        // Enhanced risk calculation using all available inputs
        let heartProbability = 0;
        
        // Age factor (risk increases with age)
        if (age > 60) heartProbability += 25;
        else if (age > 50) heartProbability += 15;
        else if (age > 40) heartProbability += 10;
        
        // Cholesterol factor
        if (cholesterol > 240) heartProbability += 25;
        else if (cholesterol > 200) heartProbability += 15;
        
        // Blood pressure factor
        if (restingBP > 140) heartProbability += 20;
        else if (restingBP > 120) heartProbability += 10;
        
        // Heart rate factor (max heart rate should be around 220 - age)
        const expectedMaxHR = 220 - age;
        if (maxHeartRate < expectedMaxHR * 0.7) heartProbability += 15;
        
        // Fasting sugar factor
        if (fastingSugar === 1) heartProbability += 10;
        
        // ST depression factor (indicates heart stress)
        if (stDepression > 2) heartProbability += 20;
        else if (stDepression > 1) heartProbability += 10;
        
        // Major vessels factor (more vessels affected = higher risk)
        if (vessels >= 2) heartProbability += 20;
        else if (vessels === 1) heartProbability += 10;
        
        // Chest pain type factor
        if (inputs.chestPainType === 'Typical Angina') heartProbability += 15;
        else if (inputs.chestPainType === 'Atypical Angina') heartProbability += 10;
        
        // Exercise induced angina
        if (inputs.angina === 'Yes') heartProbability += 15;
        
        // Cap at 95%
        heartProbability = Math.min(95, heartProbability);
        
        const riskLevel = heartProbability > 60 ? 'High' : heartProbability > 30 ? 'Moderate' : 'Low';
        
        return {
          risk: riskLevel === 'High' ? 'high' : riskLevel === 'Moderate' ? 'medium' : 'low',
          probability: Math.round(heartProbability * 10) / 10,
          status: heartProbability > 60 ? 'High risk of heart disease detected' : heartProbability > 30 ? 'Moderate risk of heart disease' : 'Low risk of heart disease',
          recommendations: heartProbability > 60 
            ? ['Consult a cardiologist immediately', 'Start lifestyle modification and medication review', 'Regular ECG, stress tests, and lipid profile', 'Monitor blood pressure daily']
            : heartProbability > 30
            ? ['Regular monitoring recommended', 'Focus on diet, exercise, and stress management', 'Annual cardiac check-up', 'Control cholesterol and blood pressure']
            : ['Maintain healthy lifestyle with regular check-ups', 'Continue balanced diet and exercise', 'Annual health screening'],
          diet_guidelines: heartProbability > 60
            ? ['Low-fat, low-sodium diet', 'Avoid processed foods and red meat', 'Include omega-3 rich foods (fish, nuts)', 'Regular exercise (30-45 min daily)', 'Avoid smoking and limit alcohol']
            : heartProbability > 30
            ? ['Heart-healthy diet with fruits and vegetables', 'Limit saturated fats', 'Regular moderate exercise', 'Maintain healthy weight']
            : ['Balanced diet with whole grains', 'Regular physical activity', 'Maintain optimal weight']
        };
        break;
      }
        
      case 'sepsis': {
        // Sepsis prediction - using enhanced logic based on SIRS criteria and sepsis indicators
        // You can replace this with actual ML API call when available
        const hr = parseInt(inputs.hr) || 70;
        const temp = parseFloat(inputs.temp) || 98.6;
        const wbc = parseFloat(inputs.wbc) || 10.0;
        const lactate = parseFloat(inputs.lactate) || 1.5;
        const map = parseFloat(inputs.map) || 90;
        const o2sat = parseFloat(inputs.o2sat) || 98;
        const respRate = parseFloat(inputs.respRate) || 16;
        const hct = parseFloat(inputs.hct) || 45;
        const creatinine = parseFloat(inputs.creatinine) || 1.0;
        const age = parseInt(inputs.age) || 50;
        
        // Enhanced sepsis risk calculation using SIRS criteria and clinical indicators
        let sepsisProbability = 0;
        
        // SIRS Criteria (Systemic Inflammatory Response Syndrome)
        // 1. Temperature
        if (temp > 100.4 || temp < 96.8) sepsisProbability += 20;
        else if (temp > 99.5 || temp < 97.5) sepsisProbability += 10;
        
        // 2. Heart Rate
        if (hr > 90) sepsisProbability += 15;
        else if (hr > 100) sepsisProbability += 20;
        
        // 3. Respiratory Rate
        if (respRate > 20) sepsisProbability += 15;
        else if (respRate > 22) sepsisProbability += 20;
        
        // 4. White Blood Cell Count
        if (wbc > 12 || wbc < 4) sepsisProbability += 20;
        else if (wbc > 11 || wbc < 4.5) sepsisProbability += 10;
        
        // Additional Sepsis Indicators
        // Lactate (lactic acidosis is a strong indicator)
        if (lactate > 4) sepsisProbability += 30;
        else if (lactate > 2) sepsisProbability += 20;
        else if (lactate > 1.5) sepsisProbability += 10;
        
        // Mean Arterial Pressure (hypotension)
        if (map < 65) sepsisProbability += 25;
        else if (map < 70) sepsisProbability += 15;
        
        // Oxygen Saturation (hypoxia)
        if (o2sat < 90) sepsisProbability += 25;
        else if (o2sat < 95) sepsisProbability += 15;
        
        // Creatinine (kidney dysfunction)
        if (creatinine > 2) sepsisProbability += 15;
        else if (creatinine > 1.5) sepsisProbability += 10;
        
        // Hematocrit (anemia/hemoconcentration)
        if (hct < 30) sepsisProbability += 10;
        
        // Age factor (elderly are more susceptible)
        if (age > 65) sepsisProbability += 10;
        
        // Cap at 95%
        sepsisProbability = Math.min(95, sepsisProbability);
        
        const riskLevel = sepsisProbability > 50 ? 'High' : sepsisProbability > 25 ? 'Moderate' : 'Low';
        
        return {
          risk: riskLevel === 'High' ? 'high' : riskLevel === 'Moderate' ? 'medium' : 'low',
          probability: Math.round(sepsisProbability * 10) / 10,
          status: sepsisProbability > 50 ? 'High sepsis risk - CRITICAL' : sepsisProbability > 25 ? 'Moderate sepsis risk - Monitor closely' : 'Low sepsis risk',
          recommendations: sepsisProbability > 50
            ? ['🚨 SEEK IMMEDIATE EMERGENCY CARE', 'Time-sensitive condition requiring urgent treatment', 'Do not delay - sepsis can progress rapidly', 'Antibiotics and IV fluids may be needed immediately']
            : sepsisProbability > 25
            ? ['Monitor vital signs every 2-4 hours', 'Seek medical attention if symptoms worsen', 'Watch for signs of infection', 'Stay hydrated and rest']
            : ['Continue monitoring vital signs', 'Maintain good hygiene to prevent infection', 'Seek care if new symptoms develop'],
          diet_guidelines: []
        };
        break;
      }
        
      default:
        throw new Error(`Unknown prediction type: ${type}`);
    }
    
    // Call ML API
    if (apiUrl) {
      let response;
      try {
        response = await axios.post(apiUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 // 10 second timeout
        });
      } catch (axiosError) {
        // Handle axios errors (network, 4xx, 5xx)
        if (axiosError.response) {
          // API returned an error response
          const status = axiosError.response.status;
          const errorData = axiosError.response.data;
          console.error(`ML API error (${status}):`, errorData);
          
          if (status === 422) {
            // Validation error - show details
            throw new Error(`ML API validation error: ${JSON.stringify(errorData.detail || errorData)}`);
          } else if (status === 503) {
            throw new Error(`ML service unavailable: Model may not be loaded`);
          } else {
            throw new Error(`ML API error (${status}): ${JSON.stringify(errorData)}`);
          }
        } else if (axiosError.request) {
          // Request made but no response
          throw new Error(`ML service not responding: ${axiosError.message}`);
        } else {
          // Error setting up request
          throw new Error(`ML service error: ${axiosError.message}`);
        }
      }
      
      // Transform ML response to our format
      const mlResponse = response.data;
      
      if (type === 'diabetes') {
        // Handle probability as either string with % or number
        let probability = 0;
        if (typeof mlResponse.probability === 'string') {
          probability = parseFloat(mlResponse.probability.replace('%', '')) || 0;
        } else {
          probability = parseFloat(mlResponse.probability) || 0;
          // If probability is between 0 and 1, convert to percentage
          if (probability <= 1) {
            probability = probability * 100;
          }
        }
        
        return {
          risk: mlResponse.risk === 'High' ? 'high' : mlResponse.risk === 'Moderate' ? 'medium' : 'low',
          probability: Math.round(probability * 10) / 10, // Round to 1 decimal place
          status: mlResponse.status,
          recommendations: mlResponse.recommendations || [],
          diet_guidelines: mlResponse.diet_guidelines || []
        };
      } else if (type === 'kidney') {
        // Handle probability - CKD API returns probability as a decimal (0-1)
        let prob = mlResponse.probability;
        if (prob === undefined || prob === null) {
          prob = mlResponse.prediction === 'CKD' ? 0.7 : 0.2;
        }
        // Convert to percentage if it's a decimal
        if (prob <= 1) {
          prob = prob * 100;
        }
        
        return {
          risk: mlResponse.risk_level === 'High' ? 'high' : mlResponse.risk_level === 'Moderate' ? 'medium' : 'low',
          probability: Math.round(prob * 10) / 10, // Round to 1 decimal place
          status: mlResponse.prediction === 'CKD' ? 'Chronic Kidney Disease detected' : 'No CKD detected',
          recommendations: mlResponse.recommendations || [],
          diet_guidelines: []
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error calling ML model for ${type}:`, error.message);
    // Return fallback prediction if ML service is unavailable
    throw new Error(`ML service unavailable: ${error.message}`);
  }
}

// POST endpoint to create a prediction
router.post('/:patientId/predictions', handleDemoPatient, validatePatient, async (req, res) => {
  try {
    const patientId = req.patientId || req.params.patientId;
    const { type, inputs } = req.body;
    
    console.log('Prediction request - patientId:', patientId, 'type:', type);
    
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }
    
    // Validate prediction type
    if (!['heart', 'diabetes', 'kidney', 'sepsis'].includes(type)) {
      return res.status(400).json({ error: 'Invalid prediction type' });
    }
    
    // Verify patient exists - try both ObjectId and string formats
    let patient;
    try {
      // Try as ObjectId first
      patient = await Patient.findById(patientId);
      // If not found, try finding by _id as string
      if (!patient) {
        patient = await Patient.findOne({ _id: patientId });
      }
    } catch (error) {
      console.error('Error finding patient:', error);
      // If ObjectId conversion fails, try string search
      try {
        patient = await Patient.findOne({ _id: patientId });
      } catch (err) {
        console.error('Error in patient lookup:', err);
      }
    }
    
    if (!patient) {
      console.error('Patient not found for ID:', patientId);
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    console.log('Patient found:', patient._id);
    
    // Call ML model
    let mlResult;
    try {
      mlResult = await callMLModel(type, inputs);
    } catch (mlError) {
      console.error('ML model error:', mlError);
      // Return error but don't fail completely
      return res.status(503).json({ 
        error: 'ML prediction service unavailable', 
        details: mlError.message 
      });
    }
    
    if (!mlResult) {
      return res.status(500).json({ error: 'Failed to get prediction from ML model' });
    }
    
    // Combine recommendations and diet guidelines into single recommendation string
    const allRecommendations = [
      ...(mlResult.recommendations || []),
      ...(mlResult.diet_guidelines || [])
    ];
    const recommendation = allRecommendations.join('. ') || mlResult.status || 'No specific recommendations';
    
    // Create prediction record
    const prediction = new Prediction({
      patientId: patient._id,
      type: type,
      date: new Date(),
      risk: mlResult.risk.toLowerCase(), // 'high', 'medium', 'low'
      probability: mlResult.probability,
      inputs: inputs,
      recommendation: recommendation
    });
    
    await prediction.save();
    
    console.log(`Prediction created: ${type} - ${mlResult.risk} risk (${mlResult.probability}%) for patient ${patientId}`);
    
    // Return formatted response
    res.status(201).json({
      id: prediction._id.toString(),
      _id: prediction._id.toString(),
      type: prediction.type,
      date: prediction.date.toISOString(),
      risk: prediction.risk,
      probability: prediction.probability,
      inputs: prediction.inputs,
      recommendation: prediction.recommendation
    });
    
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({ error: 'Failed to create prediction', details: error.message });
  }
});

module.exports = router;