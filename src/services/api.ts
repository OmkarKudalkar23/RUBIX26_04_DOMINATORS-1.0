// API service functions for patient dashboard

const API_BASE_URL = 'http://localhost:5000/api/patient';

// Types matching backend models
interface MedicineTaking {
  date: string;
  time: string;
  taken: boolean;
  takenAt?: string;
}

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  remainingDays: number;
  reminderEnabled: boolean;
  completed: boolean;
  totalStrips: number;
  purchasedStrips: number;
  times: string[];
  takings: MedicineTaking[];
}

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  hospital: string;
  type: string;
  status?: string;
}

interface MedicalRecord {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  summary?: string;
  extractedData?: any;
}

interface Prediction {
  id: string;
  type: string;
  date: string;
  risk: string;
  probability: number;
  inputs: any;
  recommendation: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
}

interface Order {
  id: string;
  items: any[];
  total: number;
  date: string;
  status: string;
}

interface Delivery {
  orderId: string;
  status: string;
  estimatedDelivery: string;
  driverName: string;
  driverPhone: string;
  driverLocation: {
    lat: number;
    lng: number;
  };
  progress: number;
  statusHistory: {
    status: string;
    timestamp: string;
    location: string;
  }[];
}

// Patient data snapshot from backend
interface PatientSnapshot {
  medicines: Medicine[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  predictions: Prediction[];
  expenses: Expense[];
  orders: Order[];
  deliveries: Delivery[];
}

// Helper function to transform backend data to frontend format
const transformMedicine = (med: any): Medicine => ({
  id: med._id?.toString() || med.id,
  name: med.name || '',
  dosage: med.dosage || '',
  frequency: med.frequency || '',
  duration: med.duration || '',
  remainingDays: med.remainingDays || 0,
  reminderEnabled: med.reminderEnabled !== undefined ? med.reminderEnabled : true,
  completed: med.completed || false,
  totalStrips: med.totalStrips || 0,
  purchasedStrips: med.purchasedStrips || 0,
  times: med.times || [],
  takings: (med.takings || []).map((t: any) => ({
    date: t.date,
    time: t.time,
    taken: t.taken || false,
    takenAt: t.takenAt ? new Date(t.takenAt).toISOString() : undefined,
  })),
});

const transformAppointment = (apt: any): Appointment => ({
  id: apt._id?.toString() || apt.id,
  doctor: apt.doctor || apt.doctorId?.name || 'Unknown Doctor',
  specialty: apt.specialty || apt.doctorId?.specialization || 'General',
  date: apt.date || '',
  time: apt.time || '',
  hospital: apt.hospital || apt.hospitalId?.name || 'Unknown Hospital',
  type: apt.type || 'checkup',
  status: apt.status || 'pending',
});

const transformMedicalRecord = (record: any): MedicalRecord => ({
  id: record._id?.toString() || record.id,
  type: record.type || 'other',
  fileName: record.fileName || '',
  fileUrl: record.fileUrl || '',
  uploadDate: record.uploadDate ? new Date(record.uploadDate).toISOString() : new Date().toISOString(),
  summary: record.summary,
  extractedData: record.extractedData,
});

const transformPrediction = (pred: any): Prediction => ({
  id: pred._id?.toString() || pred.id,
  type: pred.type || 'heart',
  date: pred.date ? new Date(pred.date).toISOString() : new Date().toISOString(),
  risk: pred.risk || 'low',
  probability: pred.probability || 0,
  inputs: pred.inputs || {},
  recommendation: pred.recommendation || '',
});

const transformExpense = (exp: any): Expense => ({
  id: exp._id?.toString() || exp.id,
  name: exp.name || '',
  amount: exp.amountUSD || exp.amount || 0,
  date: exp.date ? new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString(),
  category: exp.category || 'Medicine',
});

const transformOrder = (order: any): Order => ({
  id: order._id?.toString() || order.id,
  items: order.items || [],
  total: order.totalUSD || order.total || 0,
  date: order.date ? new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString(),
  status: order.status || 'Processing',
});

const transformDelivery = (delivery: any): Delivery => ({
  orderId: delivery.orderId?.toString() || delivery.orderId,
  status: delivery.status || 'preparing',
  estimatedDelivery: delivery.estimatedDelivery ? new Date(delivery.estimatedDelivery).toISOString() : new Date().toISOString(),
  driverName: delivery.driverName || '',
  driverPhone: delivery.driverPhone || '',
  driverLocation: delivery.driverLocation || { lat: 0, lng: 0 },
  progress: delivery.progress || 0,
  statusHistory: (delivery.statusHistory || []).map((h: any) => ({
    status: h.status,
    timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
    location: h.location || '',
  })),
});

// Get patient data snapshot
export const getPatientData = async (patientId: string): Promise<PatientSnapshot> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${patientId}/me`);
    if (!response.ok) {
      // Return empty data instead of throwing if API fails
      console.warn(`API returned status ${response.status}, using empty data`);
      return {
        medicines: [],
        appointments: [],
        medicalRecords: [],
        predictions: [],
        expenses: [],
        orders: [],
        deliveries: [],
      };
    }
    const data = await response.json();
    
    // Safely transform all data to frontend format
    try {
      return {
        medicines: (data.medicines || []).map((m: any) => {
          try { return transformMedicine(m); } catch (e) { console.warn('Error transforming medicine:', e); return null; }
        }).filter((m: any) => m !== null),
        appointments: (data.appointments || []).map((a: any) => {
          try { return transformAppointment(a); } catch (e) { console.warn('Error transforming appointment:', e); return null; }
        }).filter((a: any) => a !== null),
        medicalRecords: (data.medicalRecords || []).map((r: any) => {
          try { return transformMedicalRecord(r); } catch (e) { console.warn('Error transforming record:', e); return null; }
        }).filter((r: any) => r !== null),
        predictions: (data.predictions || []).map((p: any) => {
          try { return transformPrediction(p); } catch (e) { console.warn('Error transforming prediction:', e); return null; }
        }).filter((p: any) => p !== null),
        expenses: (data.expenses || []).map((e: any) => {
          try { return transformExpense(e); } catch (err) { console.warn('Error transforming expense:', err); return null; }
        }).filter((e: any) => e !== null),
        orders: (data.orders || []).map((o: any) => {
          try { return transformOrder(o); } catch (e) { console.warn('Error transforming order:', e); return null; }
        }).filter((o: any) => o !== null),
        deliveries: (data.deliveries || []).map((d: any) => {
          try { return transformDelivery(d); } catch (e) { console.warn('Error transforming delivery:', e); return null; }
        }).filter((d: any) => d !== null),
      };
    } catch (transformError) {
      console.error('Error transforming data:', transformError);
      // Return empty data if transformation fails
      return {
        medicines: [],
        appointments: [],
        medicalRecords: [],
        predictions: [],
        expenses: [],
        orders: [],
        deliveries: [],
      };
    }
  } catch (error) {
    console.error('Error fetching patient data:', error);
    // Return empty data instead of throwing
    return {
      medicines: [],
      appointments: [],
      medicalRecords: [],
      predictions: [],
      expenses: [],
      orders: [],
      deliveries: [],
    };
  }
};

// Mark medicine as taken
export const markMedicineAsTaken = async (
  patientId: string,
  medicineId: string,
  date: string,
  time: string
): Promise<Medicine> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${patientId}/medicines/${medicineId}/takings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date, time }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return transformMedicine(data);
  } catch (error) {
    console.error('Error marking medicine as taken:', error);
    throw error;
  }
};

// Toggle medicine reminder
export const toggleMedicineReminder = async (
  patientId: string,
  medicineId: string
): Promise<{ reminderEnabled: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${patientId}/medicines/${medicineId}/toggle-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error toggling medicine reminder:', error);
    throw error;
  }
};

// Get patient profile
export const getPatientProfile = async (patientId: string, userId?: string): Promise<{
  fullName: string;
  dob: string;
  bloodGroup: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  age: number;
  medicalHistory: string[];
}> => {
  try {
    // Get token from localStorage for authentication
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Build URL with userId query param if available (as fallback if patientId doesn't work)
    let url = `${API_BASE_URL}/${patientId}/profile`;
    if (userId) {
      url += `?userId=${userId}`;
    }
    
    console.log('Fetching patient profile:', { patientId, userId, url });
    
    const response = await fetch(url, {
      headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Profile fetch failed:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const profileData = await response.json();
    console.log('Profile data received:', profileData);
    return profileData;
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    throw error;
  }
};

// Get all hospitals
export const getHospitals = async (): Promise<Array<{ id: string; name: string; location: string }>> => {
  try {
    const response = await fetch('http://localhost:5000/api/hospitals');
    if (!response.ok) {
      return []; // Return empty array if API fails
    }
    const hospitals = await response.json();
    return hospitals.map((h: any) => ({
      id: h._id?.toString() || h.id,
      name: h.name || '',
      location: h.address || ''
    }));
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return []; // Return empty array on error
  }
};

// Get all doctors
export const getDoctors = async (): Promise<Array<{ id: string; name: string; specialty: string; hospitalId: string }>> => {
  try {
    const response = await fetch('http://localhost:5000/api/doctors');
    if (!response.ok) {
      return []; // Return empty array if API fails
    }
    const doctors = await response.json();
    return doctors.map((d: any) => ({
      id: d._id?.toString() || d.id,
      name: d.name || '',
      specialty: d.specialization || 'General',
      hospitalId: d.hospitalId?._id?.toString() || d.hospitalId?.toString() || ''
    }));
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return []; // Return empty array on error
  }
};

// Get nearby hospitals for a patient with location (stores location and nearest hospital in backend)
export const getNearbyHospitalsForPatient = async (
  patientId: string,
  lat: number,
  lng: number
): Promise<Array<{
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
}>> => {
  try {
    const response = await fetch(`http://localhost:5000/api/hospitals/patient/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lng }),
    });
    if (!response.ok) {
      console.warn(`Hospitals API returned status ${response.status}`);
      return [];
    }
    const hospitals = await response.json();
    return hospitals.map((h: any) => ({
      id: h.id,
      name: h.name || 'Unknown Hospital',
      lat: h.lat,
      lng: h.lng,
      distance: h.distance || 0,
    }));
  } catch (error) {
    console.error('Error fetching nearby hospitals:', error);
    return [];
  }
};

// Get route between two points using OSRM
export const getRoute = async (
  start: [number, number],
  end: [number, number],
  profile: string = 'driving'
): Promise<{
  coords: Array<[number, number]>;
  distance: number;
  duration: number;
} | null> => {
  try {
    const response = await fetch('http://localhost:5000/api/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ start, end, profile }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Route API error:', response.status, errorText);
      return null;
    }
    const routeData = await response.json();
    
    // Handle OSRM format: { routes: [{ distance, duration, geometry: { coordinates: [[lng, lat], ...] } }] }
    if (routeData.routes && routeData.routes.length > 0) {
      const route = routeData.routes[0];
      // OSRM returns coordinates as [lng, lat] in geometry.coordinates, convert to [lat, lng] for Leaflet
      const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      
      return {
        coords,
        distance: (route.distance || 0) / 1000, // Convert meters to km
        duration: Math.round((route.duration || 0) / 60), // Convert seconds to minutes
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};

// Create a new appointment
export const createAppointment = async (
  patientId: string,
  appointmentData: {
    hospitalId?: string;
    hospitalName?: string;
    hospitalLat?: number;
    hospitalLng?: number;
    doctorId?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    date: string;
    time?: string;
    type: 'checkup' | 'followup' | 'emergency';
    reason?: string;
  }
): Promise<any> => {
  try {
    const response = await fetch(`http://localhost:5000/api/appointments/patient/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Appointment API error:', response.status, errorText);
      throw new Error(`Failed to create appointment: ${response.status}`);
    }
    const appointment = await response.json();
    return appointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

// Create prediction using ML model
export const createPrediction = async (
  patientId: string,
  type: 'heart' | 'diabetes' | 'kidney' | 'sepsis',
  inputs: any
): Promise<Prediction> => {
  try {
    console.log('Creating prediction for patientId:', patientId, 'type:', type);
    console.log('Prediction inputs:', inputs);
    
    const url = `http://localhost:5000/api/patient/${patientId}/predictions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, inputs }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Prediction API error:', response.status, errorText);
      throw new Error(`Failed to create prediction: ${response.status} - ${errorText}`);
    }
    
    const prediction = await response.json();
    console.log('Prediction created successfully:', prediction);
    
    // Transform to frontend format
    return transformPrediction(prediction);
  } catch (error) {
    console.error('Error creating prediction:', error);
    throw error;
  }
};

// ==================== DOCTOR API FUNCTIONS ====================

const DOCTOR_API_BASE_URL = 'http://localhost:5000/api/doctor';

// Helper to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper to make authenticated requests
const doctorApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const response = await fetch(`${DOCTOR_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Doctor API error (${response.status}):`, errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Get doctor profile
export const getDoctorProfile = async () => {
  try {
    return await doctorApiRequest('/me');
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    throw error;
  }
};

// Get doctor appointments
export const getDoctorAppointments = async () => {
  try {
    return await doctorApiRequest('/me/appointments');
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    throw error;
  }
};

// Update appointment status
export const updateAppointmentStatus = async (
  appointmentId: string,
  status: 'accepted' | 'rejected',
  notes?: string
) => {
  try {
    return await doctorApiRequest(`/appointments/${appointmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};

// Get patient history
export const getPatientHistory = async (patientId: string) => {
  try {
    return await doctorApiRequest(`/patients/${patientId}`);
  } catch (error) {
    console.error('Error fetching patient history:', error);
    throw error;
  }
};

// Get health alerts
export const getHealthAlerts = async () => {
  try {
    return await doctorApiRequest('/alerts');
  } catch (error) {
    console.error('Error fetching health alerts:', error);
    // Return empty array on error instead of throwing
    return [];
  }
};

// Medical Records API

// Interface matching backend response
export interface MedicalRecord {
  id: string;
  type: "prescription" | "report" | "xray" | "ct-scan" | "mri" | "lab-result" | "other";
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  summary?: string;
  extractedData?: any;
}

// Get all medical records for logged-in doctor
export const getDoctorMedicalRecords = async (): Promise<MedicalRecord[]> => {
  try {
    const records = await doctorApiRequest('/medical-records');
    // Transform fileUrl to full URL if needed
    return records.map((record: any) => ({
      ...record,
      fileUrl: record.fileUrl.startsWith('http') 
        ? record.fileUrl 
        : `http://localhost:5000${record.fileUrl}`
    }));
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw error;
  }
};

// Upload medical record
export const uploadDoctorMedicalRecord = async (
  file: File,
  type: string,
  patientId?: string
): Promise<MedicalRecord> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (patientId) {
      formData.append('patientId', patientId);
    }

    const response = await fetch(`${DOCTOR_API_BASE_URL}/medical-records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Doctor API error (${response.status}):`, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const record = await response.json();
    // Transform fileUrl to full URL if needed
    return {
      ...record,
      fileUrl: record.fileUrl.startsWith('http') 
        ? record.fileUrl 
        : `http://localhost:5000${record.fileUrl}`
    };
  } catch (error) {
    console.error('Error uploading medical record:', error);
    throw error;
  }
};

// Delete medical record
export const deleteDoctorMedicalRecord = async (id: string): Promise<void> => {
  try {
    await doctorApiRequest(`/medical-records/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    throw error;
  }
};

// ==================== HOSPITAL API FUNCTIONS ====================

const HOSPITAL_API_BASE_URL = 'http://localhost:5000/api/hospital';

// Helper to make authenticated hospital requests
const hospitalApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const response = await fetch(`${HOSPITAL_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Hospital API error (${response.status}):`, errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Beds
export interface BedData {
  id: string;
  type: "ICU" | "General" | "Private" | "Emergency";
  total: number;
  occupied: number;
  available: number;
}

export const getHospitalBeds = async (): Promise<BedData[]> => {
  try {
    return await hospitalApiRequest('/beds');
  } catch (error) {
    console.error('Error fetching hospital beds:', error);
    throw error;
  }
};

export const updateHospitalBed = async (
  id: string,
  payload: Partial<Pick<BedData, "total" | "occupied" | "available">> & { action?: "occupy" | "release" }
): Promise<BedData> => {
  try {
    return await hospitalApiRequest(`/beds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error updating hospital bed:', error);
    throw error;
  }
};

// Doctor Slots
export interface DoctorSlot {
  id: string;
  doctorName: string;
  specialization: string;
  department: string;
  date: string;
  slots: {
    time: string;
    status: "available" | "booked" | "blocked";
    patientName?: string;
  }[];
}

export const getHospitalDoctorSlots = async (): Promise<DoctorSlot[]> => {
  try {
    return await hospitalApiRequest('/doctor-slots');
  } catch (error) {
    console.error('Error fetching doctor slots:', error);
    throw error;
  }
};

export const toggleHospitalDoctorSlot = async (
  doctorSlotId: string,
  slotIndex: number
): Promise<DoctorSlot> => {
  try {
    return await hospitalApiRequest(`/doctor-slots/${doctorSlotId}/slots/${slotIndex}`, {
      method: 'PATCH',
    });
  } catch (error) {
    console.error('Error toggling doctor slot:', error);
    throw error;
  }
};

// Staff
export interface StaffMember {
  id: string;
  name: string;
  role: "Nurse" | "Technician" | "Support" | "Admin";
  department: string;
  shift: "Morning" | "Evening" | "Night";
  status: "active" | "on-leave" | "off-duty";
}

export const getHospitalStaff = async (): Promise<StaffMember[]> => {
  try {
    return await hospitalApiRequest('/staff');
  } catch (error) {
    console.error('Error fetching hospital staff:', error);
    throw error;
  }
};

export const updateHospitalStaffStatus = async (
  id: string,
  status: StaffMember["status"]
): Promise<StaffMember> => {
  try {
    return await hospitalApiRequest(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    console.error('Error updating staff status:', error);
    throw error;
  }
};

export const deleteHospitalStaff = async (id: string): Promise<void> => {
  try {
    await hospitalApiRequest(`/staff/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
};

export const createHospitalStaff = async (
  staff: Omit<StaffMember, 'id'>
): Promise<StaffMember> => {
  try {
    return await hospitalApiRequest('/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    throw error;
  }
};

// Surge Alerts
export interface SurgeAlert {
  id: string;
  type: "pollution" | "seasonal" | "epidemic" | "weather";
  severity: "low" | "medium" | "high";
  title: string;
  message: string;
  prediction: string;
  date: string;
  department: string;
  expectedIncrease: number;
  recommendations: string[];
}

export const getHospitalSurgeAlerts = async (): Promise<SurgeAlert[]> => {
  try {
    return await hospitalApiRequest('/surge-alerts');
  } catch (error) {
    console.error('Error fetching surge alerts:', error);
    throw error;
  }
};

// Environment
export interface EnvironmentalData {
  aqi: number;
  temperature: number;
  humidity: number;
  pollutionLevel: "Good" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  festivalFlag: boolean;
}

export const getHospitalEnvironment = async (): Promise<EnvironmentalData> => {
  try {
    return await hospitalApiRequest('/environment');
  } catch (error) {
    console.error('Error fetching environment:', error);
    throw error;
  }
};

// Appointments
export interface HospitalAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
  type: "OPD" | "Emergency" | "Follow-up";
}

export const getHospitalAppointments = async (date?: string): Promise<HospitalAppointment[]> => {
  try {
    const endpoint = date ? `/appointments?date=${date}` : '/appointments';
    return await hospitalApiRequest(endpoint);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

// ============================================
// OPD Queue (Check-ins) + Inventory APIs
// ============================================

export interface OpdCheckIn {
  id: string;
  patientName: string;
  department: string;
  doctorName: string;
  visitType: "OPD" | "Follow-up";
  status: "checked-in" | "in-triage" | "in-consult" | "completed" | "no-show";
  priority: "low" | "normal" | "high" | "critical";
  queueNumber: number;
  checkInTime: string;
  notes?: string;
}

export const createOpdCheckIn = async (payload: {
  patientName: string;
  department: string;
  doctorName?: string;
  priority?: OpdCheckIn["priority"];
  appointmentId?: string;
  visitType?: OpdCheckIn["visitType"];
}): Promise<OpdCheckIn> => {
  return await hospitalApiRequest('/opd/check-in', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getOpdQueue = async (date?: string): Promise<OpdCheckIn[]> => {
  const endpoint = date ? `/opd/queue?date=${encodeURIComponent(date)}` : '/opd/queue';
  return await hospitalApiRequest(endpoint);
};

export const updateOpdCheckIn = async (
  id: string,
  payload: Partial<Pick<OpdCheckIn, "status" | "priority" | "doctorName" | "notes">>
): Promise<OpdCheckIn> => {
  return await hospitalApiRequest(`/opd/queue/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  reorderQty: number;
}

export const getHospitalInventory = async (): Promise<InventoryItem[]> => {
  return await hospitalApiRequest('/inventory');
};

export const consumeInventoryItem = async (itemId: string, payload: {
  qty: number;
  reason?: string;
  linkedAdmissionId?: string;
}) => {
  return await hospitalApiRequest(`/inventory/${itemId}/consume`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getInventoryAlerts = async (): Promise<{ lowStock: InventoryItem[] }> => {
  return await hospitalApiRequest('/inventory/alerts');
};

export const getInventoryTrends = async (days: number = 7) => {
  return await hospitalApiRequest(`/inventory/trends?days=${encodeURIComponent(days)}`);
};

// Admissions
export interface Admission {
  id: string;
  patientName: string;
  age?: number;
  department: string;
  bedType: "ICU" | "General" | "Private" | "Emergency";
  severity: "low" | "medium" | "high" | "critical";
  oxygenRequired: boolean;
  isolationRequired: boolean;
  status: "pending" | "allocated" | "admitted" | "discharged" | "cancelled";
  allocatedBedTypeId: string | null;
  allocationNote: string;
  admittedAt?: string;
  dischargedAt?: string;
  createdAt?: string;
}

export const getAdmissions = async (): Promise<Admission[]> => {
  return await hospitalApiRequest('/admissions');
};

export const createAdmission = async (payload: {
  patientName: string;
  age?: number;
  department: string;
  bedType: Admission["bedType"];
  severity?: Admission["severity"];
  oxygenRequired?: boolean;
  isolationRequired?: boolean;
}) => {
  return await hospitalApiRequest('/admissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const admitPatient = async (admissionId: string) => {
  return await hospitalApiRequest(`/admissions/${admissionId}/admit`, { method: 'POST' });
};

export const dischargePatient = async (admissionId: string) => {
  return await hospitalApiRequest(`/admissions/${admissionId}/discharge`, { method: 'POST' });
};

// Profile & Settings
export const updateHospitalProfile = async (profile: {
  hospitalName: string;
  email: string;
  phone: string;
  address: string;
}): Promise<any> => {
  try {
    return await hospitalApiRequest('/profile', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  } catch (error) {
    console.error('Error updating hospital profile:', error);
    throw error;
  }
};

export const changeHospitalPassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<any> => {
  try {
    return await hospitalApiRequest('/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// ============================================
// Early Warning System API
// ============================================

const EARLY_WARNING_API_BASE = 'http://localhost:5000/api/early-warning';

export interface EarlyWarningAlert {
  alert_level: 'NORMAL' | 'INFO' | 'WATCH' | 'WARNING' | 'CRITICAL';
  message: string;
  recommendations: string[];
  metrics?: {
    total_anomalies: number;
    max_spike_percentage: number;
    forecast_increase_percentage: number;
  };
}

export interface EarlyWarningResponse {
  status: string;
  city: string;
  timestamp: string;
  alert: EarlyWarningAlert;
  current_signals?: any;
  anomaly_detection?: any;
  forecasts?: any;
  hospital_load?: any;
}

export interface QuickCheckResponse {
  status: string;
  city: string;
  timestamp: string;
  alert_level: string;
  message: string;
  total_anomalies: number;
  max_spike_percentage: number;
  forecast_increase_percentage: number;
  recommendations: string[];
}

/**
 * Get quick early warning check for a city
 */
export const getEarlyWarning = async (city: string, date?: string): Promise<QuickCheckResponse> => {
  try {
    const url = `${EARLY_WARNING_API_BASE}/early-warning/${city}`;
    const params = date ? `?date=${encodeURIComponent(date)}` : '';
    
    // Increase timeout to 45 seconds for early warning processing (it can be slow)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds
    
    const response = await fetch(url + params, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Early warning API error (${response.status}):`, errorText);
      // If it's a timeout or service unavailable, return NORMAL status instead of throwing
      if (response.status === 504 || response.status === 503) {
        console.warn('Early warning service timeout or unavailable - returning NORMAL status');
        return {
          status: 'timeout',
          city: city,
          timestamp: new Date().toISOString(),
          alert_level: 'NORMAL',
          message: 'Early warning system is processing. Please refresh in a moment.',
          total_anomalies: 0,
          max_spike_percentage: 0,
          forecast_increase_percentage: 0,
          recommendations: []
        };
      }
      throw new Error(`Failed to get early warning: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Early warning response received:', data);
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('Early warning request timed out after 45 seconds');
      // Return a default response instead of throwing to prevent UI errors
      return {
        status: 'timeout',
        city: city,
        timestamp: new Date().toISOString(),
        alert_level: 'NORMAL',
        message: 'Early warning system is processing. Please refresh in a moment.',
        total_anomalies: 0,
        max_spike_percentage: 0,
        forecast_increase_percentage: 0,
        recommendations: []
      };
    }
    console.error('Error getting early warning:', error);
    // Don't throw - return NORMAL status to prevent UI errors
    return {
      status: 'error',
      city: city,
      timestamp: new Date().toISOString(),
      alert_level: 'NORMAL',
      message: 'Early warning system temporarily unavailable.',
      total_anomalies: 0,
      max_spike_percentage: 0,
      forecast_increase_percentage: 0,
      recommendations: []
    };
  }
};

/**
 * Get complete early warning analysis for a city
 */
export const getFullEarlyWarning = async (city: string, date?: string): Promise<EarlyWarningResponse> => {
  try {
    const response = await fetch(`${EARLY_WARNING_API_BASE}/early-warning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city, date }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get full early warning: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting full early warning:', error);
    throw error;
  }
};

/**
 * Get hospital load forecast for a city
 */
export const getHospitalLoad = async (city: string, diseaseType?: string): Promise<any> => {
  try {
    // Prefer authenticated hospital endpoint that uses Weather/Pollution Agent (port 8000)
    // This avoids the old early-warning ML dependency on port 8001.
    try {
      // hospitalApiRequest is defined above in this module (requires token)
      const endpoint = `/load-forecast?city=${encodeURIComponent(city)}`;
      return await hospitalApiRequest(endpoint);
    } catch (hospitalErr) {
      // Fallback to early-warning proxy (may be unavailable)
      const url = `${EARLY_WARNING_API_BASE}/hospital-load/${city}`;
      const params = diseaseType ? `?disease_type=${encodeURIComponent(diseaseType)}` : '';

      const response = await fetch(url + params, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Return a safe payload instead of throwing to avoid Promise.allSettled noise
        return {
          status: 'unavailable',
          city,
          hospital_load: null,
          message: `Hospital load forecast unavailable: ${response.status} - ${errorText}`
        };
      }

      return await response.json();
    }
  } catch (error) {
    console.error('Error getting hospital load:', error);
    // Do not throw; keep UI stable
    return {
      status: 'unavailable',
      city,
      hospital_load: null,
      message: 'Hospital load forecast unavailable.'
    };
  }
};

/**
 * Get forecast data for a city
 */
export const getForecast = async (city: string, days: number = 7): Promise<any> => {
  try {
    const response = await fetch(`${EARLY_WARNING_API_BASE}/forecast/${city}?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get forecast: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting forecast:', error);
    throw error;
  }
};

/**
 * Get current signals for a city
 */
export const getCurrentSignals = async (city: string, date?: string): Promise<any> => {
  try {
    const url = `${EARLY_WARNING_API_BASE}/signals/${city}`;
    const params = date ? `?date=${encodeURIComponent(date)}` : '';
    
    const response = await fetch(url + params, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get signals: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting signals:', error);
    throw error;
  }
};