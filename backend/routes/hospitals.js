const express = require('express');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const BedBooking = require('../models/BedBooking');
const Appointment = require('../models/Appointment');
const SurgePrediction = require('../models/SurgePrediction');
const EnvironmentReading = require('../models/EnvironmentReading');
const HospitalBed = require('../models/HospitalBed');
const HospitalAppointment = require('../models/HospitalAppointment');
const HospitalAdmission = require('../models/HospitalAdmission');

const router = express.Router();

// Dynamic import for node-fetch (ES module) - helper function
const getFetch = async () => {
  const fetchModule = await import('node-fetch');
  return fetchModule.default;
};

// Get all hospitals (for patient appointment booking)
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({}).select('name address phone');
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST endpoint to get nearby hospitals from OpenStreetMap (Overpass API) - REAL-TIME
router.post('/', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const radius = 5000; // meters - 5km radius

    // Overpass QL query for hospitals around a point (REAL-TIME from OpenStreetMap)
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        way["amenity"="hospital"](around:${radius},${lat},${lng});
        relation["amenity"="hospital"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    // Use node-fetch for Overpass API
    const fetchFunc = await getFetch();
    const response = await fetchFunc(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
      }
    );

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Overpass API response to match your working code structure
    const hospitals = data.elements.map((el) => {
      const coords =
        el.type === "node"
          ? { lat: el.lat, lng: el.lon }
          : { lat: el.center.lat, lng: el.center.lon };

      return {
        id: el.id.toString(),
        name: el.tags?.name || "Unknown Hospital",
        ...coords,
      };
    });

    // Sort by distance and return only the 2 nearest hospitals
    const hospitalsWithDistance = hospitals.map((hospital) => {
      const R = 6371; // Earth radius in km
      const dLat = ((hospital.lat - lat) * Math.PI) / 180;
      const dLon = ((hospital.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((hospital.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...hospital, distance };
    });

    // Sort by distance and take only top 2 nearest
    const nearestHospitals = hospitalsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2)
      .map(({ distance, ...hospital }) => hospital); // Remove distance from response

    console.log(`Found ${hospitals.length} hospitals, returning ${nearestHospitals.length} nearest`);
    res.json(nearestHospitals);
  } catch (error) {
    console.error('Error fetching hospitals from Overpass API:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

// POST endpoint to get nearby hospitals for a specific patient, store location and nearest hospital
router.post('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update patient location
    patient.location = {
      latitude: lat,
      longitude: lng,
      lastUpdated: new Date()
    };
    await patient.save();

    const radius = 5000; // meters - 5km radius

    // Overpass QL query for hospitals around a point
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        way["amenity"="hospital"](around:${radius},${lat},${lng});
        relation["amenity"="hospital"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    // Use node-fetch for Overpass API
    const fetchFunc = await getFetch();
    const response = await fetchFunc(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
      }
    );

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Overpass API response
    const hospitals = data.elements.map((el) => {
      const coords =
        el.type === "node"
          ? { lat: el.lat, lng: el.lon }
          : { lat: el.center.lat, lng: el.center.lon };

      return {
        id: el.id.toString(),
        name: el.tags?.name || "Unknown Hospital",
        ...coords,
      };
    });

    // Calculate distance for each hospital
    const hospitalsWithDistance = hospitals.map((hospital) => {
      const R = 6371; // Earth radius in km
      const dLat = ((hospital.lat - lat) * Math.PI) / 180;
      const dLon = ((hospital.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((hospital.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...hospital, distance };
    });

    // Sort by distance
    const sortedHospitals = hospitalsWithDistance.sort((a, b) => a.distance - b.distance);

    // Store nearest hospital in patient record
    if (sortedHospitals.length > 0) {
      const nearest = sortedHospitals[0];
      patient.nearestHospital = {
        hospitalId: nearest.id,
        name: nearest.name,
        distance: nearest.distance,
        coordinates: {
          latitude: nearest.lat,
          longitude: nearest.lng
        },
        lastUpdated: new Date()
      };
      await patient.save();
    }

    // Return all hospitals with distance (for map display)
    res.json(sortedHospitals);
  } catch (error) {
    console.error('Error fetching hospitals for patient:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals', details: error.message });
  }
});

// Get hospital summary
router.get('/:id/summary', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Get today's appointments
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayAppointments = await Appointment.find({
      hospitalId: req.params.id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Get upcoming surge predictions
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const surgePredictions = await SurgePrediction.find({
      hospitalId: req.params.id,
      date: { $gte: new Date(), $lte: nextWeek }
    }).sort({ date: 1 });

    // Get latest environment reading
    const latestEnvironmentReading = await EnvironmentReading
      .findOne({ city: hospital.location.city })
      .sort({ timestamp: -1 });

    res.json({
      hospital,
      todayAppointments,
      surgePredictions,
      environment: latestEnvironmentReading
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== INTER-HOSPITAL CAPACITY SHARING ====================

/**
 * GET /api/hospitals/capacity
 *
 * Returns anonymized capacity and load information for all hospitals in the system.
 * Intended for optional sharing with a central city health dashboard.
 *
 * Response shape (per hospital):
 * {
 *   id: string;
 *   name: string;
 *   address: string;
 *   bedSummary: {
 *     totalBeds: number;
 *     occupiedBeds: number;
 *     availableBeds: number;
 *     byType: Array<{ type: string; total: number; occupied: number; available: number }>;
 *   };
 *   opdLoad: {
 *     today: { total: number; scheduled: number; completed: number; cancelled: number };
 *     last7Days: { total: number };
 *   };
 * }
 */
router.get('/capacity', async (req, res) => {
  try {
    const hospitals = await Hospital.find({}).select('name address');

    const today = new Date().toISOString().split('T')[0];
    const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7Str = last7.toISOString().split('T')[0];

    const capacityData = await Promise.all(
      hospitals.map(async (hospital) => {
        const hospitalId = hospital._id;

        // Beds
        const beds = await HospitalBed.find({ hospitalId });
        const totalBeds = beds.reduce((sum, b) => sum + (b.total || 0), 0);
        const occupiedBeds = beds.reduce((sum, b) => sum + (b.occupied || 0), 0);
        const availableBeds = beds.reduce((sum, b) => sum + (b.available || 0), 0);

        const bedByType = beds.map((b) => ({
          type: b.type,
          total: b.total,
          occupied: b.occupied,
          available: b.available
        }));

        // OPD Appointments - today (anonymized counts only)
        const todaysAppointments = await HospitalAppointment.find({
          hospitalId,
          date: today
        }).select('status type');

        const todayTotal = todaysAppointments.length;
        const todayScheduled = todaysAppointments.filter((a) => a.status === 'scheduled').length;
        const todayCompleted = todaysAppointments.filter((a) => a.status === 'completed').length;
        const todayCancelled = todaysAppointments.filter((a) => a.status === 'cancelled').length;

        // Last 7 days OPD volume (for city‑level load estimation)
        const last7Appointments = await HospitalAppointment.countDocuments({
          hospitalId,
          date: { $gte: last7Str, $lte: today },
          type: 'OPD'
        });

        // Admissions load (anonymized)
        const admissionsToday = await HospitalAdmission.countDocuments({ hospitalId, createdAt: { $gte: startOfDay, $lte: endOfDay } });
        const admissionsPending = await HospitalAdmission.countDocuments({ hospitalId, status: { $in: ['pending', 'allocated'] } });
        const admissionsAdmitted = await HospitalAdmission.countDocuments({ hospitalId, status: 'admitted' });
        const admissionsLast7 = await HospitalAdmission.countDocuments({ hospitalId, createdAt: { $gte: last7, $lte: new Date() } });

        return {
          id: hospitalId.toString(),
          name: hospital.name || 'Unknown Hospital',
          address: hospital.address || '',
          bedSummary: {
            totalBeds,
            occupiedBeds,
            availableBeds,
            byType: bedByType
          },
          opdLoad: {
            today: {
              total: todayTotal,
              scheduled: todayScheduled,
              completed: todayCompleted,
              cancelled: todayCancelled
            },
            last7Days: {
              total: last7Appointments
            }
          },
          admissionsLoad: {
            today: admissionsToday,
            pending: admissionsPending,
            admitted: admissionsAdmitted,
            last7Days: admissionsLast7
          }
        };
      })
    );

    // Optional city‑level aggregate (sum across all hospitals)
    const cityAggregate = capacityData.reduce(
      (acc, h) => {
        acc.totalBeds += h.bedSummary.totalBeds;
        acc.occupiedBeds += h.bedSummary.occupiedBeds;
        acc.availableBeds += h.bedSummary.availableBeds;
        acc.todayAppointments += h.opdLoad.today.total;
        acc.last7DaysAppointments += h.opdLoad.last7Days.total;
        acc.todayAdmissions += (h.admissionsLoad?.today || 0);
        acc.pendingAdmissions += (h.admissionsLoad?.pending || 0);
        acc.admittedAdmissions += (h.admissionsLoad?.admitted || 0);
        acc.last7DaysAdmissions += (h.admissionsLoad?.last7Days || 0);
        return acc;
      },
      {
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
        todayAppointments: 0,
        last7DaysAppointments: 0,
        todayAdmissions: 0,
        pendingAdmissions: 0,
        admittedAdmissions: 0,
        last7DaysAdmissions: 0
      }
    );

    res.json({
      updatedAt: new Date().toISOString(),
      citySummary: cityAggregate,
      hospitals: capacityData
    });
  } catch (error) {
    console.error('Error fetching inter-hospital capacity data:', error);
    res.status(500).json({ message: 'Failed to fetch capacity data', error: error.message });
  }
});

module.exports = router;