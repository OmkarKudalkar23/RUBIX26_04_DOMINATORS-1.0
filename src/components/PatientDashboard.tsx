import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CustomSelect } from "./CustomSelect";
import { CustomDatePicker } from "./CustomDatePicker";
import { toast } from "sonner";
import { DeliveryTrackingModal } from "./DeliveryTrackingModal";
import { MedicineAdherenceCalendar } from "./MedicineAdherenceCalendar";
import { PrescriptionConfirmModal } from "./PrescriptionConfirmModal";
import { Chatbot } from "./Chatbot";
import {
  Upload,
  Pill,
  Bell,
  BellOff,
  User,
  Users,
  Calendar,
  MapPin,
  Phone,
  DollarSign,
  Activity,
  ShoppingCart,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wind,
  Heart,
  Thermometer,
  Weight,
  Droplet,
  X,
  Plus,
  Edit,
  LogOut,
  Menu,
  Home,
  Settings,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  PhoneCall,
  Mic,
  History,
  Search,
  Filter,
  Star,
  Truck,
  Package,
  ChevronRight,
  Minus,
  MapPinned,
  Navigation,
  Folder,
  ScanLine,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

// Import API service
import { getPatientData, markMedicineAsTaken, toggleMedicineReminder, getPatientProfile, getHospitals, getDoctors, getNearbyHospitalsForPatient, getRoute, createAppointment, createPrediction, getEarlyWarning } from "../services/api";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Hospital icon
const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/296/296214.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// Haversine distance calculation
function haversineDistance([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Component to center map to route
function RouteHandler({ routeCoords, selectedHospital }: { routeCoords: Array<[number, number]>, selectedHospital: any }) {
  const map = useMap();
  useEffect(() => {
    if (!routeCoords || routeCoords.length === 0) return;
    const bounds = L.latLngBounds(routeCoords);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [routeCoords, selectedHospital, map]);
  return null;
}

// Component to invalidate map size when modal opens
function MapSizeHandler() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size after a small delay to ensure modal is fully rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

interface MedicineTaking {
  date: string; // YYYY-MM-DD
  time: string; // e.g., "Morning", "Afternoon", "Evening", "Night"
  taken: boolean;
  takenAt?: string; // Timestamp when medicine was taken
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
  times: string[]; // e.g., ["Morning", "Evening"]
  takings: MedicineTaking[]; // Track when medicine was taken
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  bloodGroup: string;
}

interface ShopMedicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  price: number;
  manufacturer: string;
  prescriptionRequired: boolean;
  inStock: boolean;
  rating: number;
  description: string;
  dosageForm: string;
  strength: string;
  packSize: string;
}

interface CartItem {
  medicine: ShopMedicine;
  quantity: number;
  prescriptionUploaded?: boolean;
}

interface Alert {
  id: string;
  type: string;
  title?: string;
  message: string;
  icon: any;
  medicineId?: string;
  date?: string;
  time?: string;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  status: string;
}

interface DeliveryTracking {
  orderId: string;
  status: "preparing" | "dispatched" | "in_transit" | "delivered";
  estimatedDelivery: string;
  driverName: string;
  driverPhone: string;
  driverLocation: {
    lat: number;
    lng: number;
  };
  progress: number; // 0-100
  statusHistory: {
    status: string;
    timestamp: string;
    location: string;
  }[];
}

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  hospital: string;
  type: "checkup" | "followup" | "emergency";
  status?: "pending" | "accepted" | "rejected";
}

interface PredictionResult {
  id: string;
  type: "heart" | "diabetes" | "kidney" | "sepsis";
  date: string;
  risk: "low" | "medium" | "high";
  probability: number;
  inputs: any;
  recommendation: string;
}

interface Vital {
  type: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  icon: any;
}

interface MedicalRecord {
  id: string;
  type: "prescription" | "report" | "xray" | "ct-scan" | "mri" | "lab-result" | "other";
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  summary?: string;
  extractedData?: any; // For prescriptions
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospitalId: string;
}

interface Hospital {
  id: string;
  name: string;
  location: string;
}

// Available time slots for appointments
const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
  "04:30 PM", "05:00 PM", "05:30 PM"
];

// Medicine categories (static list for filtering)
const MEDICINE_CATEGORIES = ["all", "Antibiotics", "Pain Relief", "Diabetes", "Cholesterol", "Vitamins", "Digestive Health", "Allergy", "Blood Pressure", "Blood Thinner", "Thyroid", "Nerve Pain"];

// Helper function to generate historical takings for a full year
const generateHistoricalTakings = (daysBack: number, times: string[], startDate?: Date): MedicineTaking[] => {
  const takings: MedicineTaking[] = [];
  const today = new Date();
  const referenceDate = startDate || today;
  
  for (let i = daysBack; i >= 0; i--) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    times.forEach(time => {
      // Random adherence for past days (80% adherence rate)
      const adherenceChance = 0.80;
      const taken = Math.random() < adherenceChance;
      takings.push({
        date: dateStr,
        time: time,
        taken: taken,
        takenAt: taken ? `${dateStr}T${time === 'Morning' ? '08' : time === 'Afternoon' ? '14' : time === 'Evening' ? '18' : '21'}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00` : undefined
      });
    });
  }
  
  return takings;
};

// Helper function to check if a medicine time has passed
const hasMedicineTimePassed = (medicineTime: string): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const timeMap: { [key: string]: { hour: number; minute: number } } = {
    'Morning': { hour: 8, minute: 0 },
    'Afternoon': { hour: 14, minute: 0 },
    'Evening': { hour: 18, minute: 0 },
    'Night': { hour: 21, minute: 0 }
  };
  
  const scheduledTime = timeMap[medicineTime];
  if (!scheduledTime) return false;
  
  // Check if current time is past the scheduled time
  if (currentHour > scheduledTime.hour) return true;
  if (currentHour === scheduledTime.hour && currentMinute >= scheduledTime.minute) return true;
  
  return false;
};

// CURRENCY CONVERSION SYSTEM
// All prices in the database are stored in USD
// This system converts USD to the selected currency dynamically
const CURRENCY_RATES: { [key: string]: { rate: number; symbol: string; name: string } } = {
  USD: { rate: 1.00, symbol: '$', name: 'US Dollar' },
  EUR: { rate: 0.92, symbol: '€', name: 'Euro' },
  GBP: { rate: 0.79, symbol: '£', name: 'British Pound' },
  INR: { rate: 83.12, symbol: '₹', name: 'Indian Rupee' },
  CAD: { rate: 1.36, symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { rate: 1.52, symbol: 'A$', name: 'Australian Dollar' },
  JPY: { rate: 149.50, symbol: '¥', name: 'Japanese Yen' },
};

// Helper function to convert and format currency
const convertCurrency = (amountUSD: number, targetCurrency: string): string => {
  const currencyInfo = CURRENCY_RATES[targetCurrency] || CURRENCY_RATES.USD;
  const convertedAmount = amountUSD * currencyInfo.rate;
  
  // Format with 2 decimal places for most currencies, 0 for JPY
  const decimals = targetCurrency === 'JPY' ? 0 : 2;
  return `${currencyInfo.symbol}${convertedAmount.toFixed(decimals)}`;
};

export function PatientDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "prescriptions" | "notifications" | "vitals" | "appointments" | "hospitals" | "profile" | "family" | "documents" | "expenses" | "buyMedicines" | "settings" | "predictions" | "medicalRecords">("dashboard");
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<Array<{
    id: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    icon: any;
  }>>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start as false so UI renders immediately
  const [error, setError] = useState<string | null>(null);

  // Initialize with empty arrays instead of hardcoded data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [expenses, setExpenses] = useState<{name: string; amount: number; date: string; category: string}[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryTracking[]>([]);
  const [pastDeliveries, setPastDeliveries] = useState<DeliveryTracking[]>([]);
  
  // Hospitals and doctors from backend
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [shopMedicines, setShopMedicines] = useState<ShopMedicine[]>([]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [uploadType, setUploadType] = useState<"prescription" | "report" | "xray" | "ct-scan" | "mri" | "lab-result" | "other">("prescription");
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showBookAppointmentModal, setShowBookAppointmentModal] = useState(false);
  const [showDayMedicinesModal, setShowDayMedicinesModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallingAI, setIsCallingAI] = useState(false);
  
  // Buy Medicines State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedShopMedicine, setSelectedShopMedicine] = useState<ShopMedicine | null>(null);
  const [showMedicineDetail, setShowMedicineDetail] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [prescriptionRequiredFilter, setPrescriptionRequiredFilter] = useState("all");
  const [showPrescriptionUploadForCart, setShowPrescriptionUploadForCart] = useState(false);
  
  // Disease Prediction State
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [selectedPredictionType, setSelectedPredictionType] = useState<"heart" | "diabetes" | "kidney" | "sepsis" | null>(null);
  const [predictionInputs, setPredictionInputs] = useState<any>({});
  const [pendingCartItem, setPendingCartItem] = useState<ShopMedicine | null>(null);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const prescriptionUploadRef = useRef<HTMLInputElement>(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    lat: 0,
    lng: 0,
  });
  const [showDeliveryTracking, setShowDeliveryTracking] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryTracking | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPrescriptionConfirm, setShowPrescriptionConfirm] = useState(false);
  const [extractedMedicines, setExtractedMedicines] = useState<Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    times: string[];
  }>>([]);
  const [settings, setSettings] = useState({
    location: "",
    currency: "USD",
    address: "",
    language: "English",
    notifications: true,
    emailNotifications: true
  });
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showAddFamilyMember, setShowAddFamilyMember] = useState(false);
  const [showFamilyMemberDetails, setShowFamilyMemberDetails] = useState(false);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null);
  const [showPrescriptionMedicineDetail, setShowPrescriptionMedicineDetail] = useState(false);
  const [selectedPrescriptionMedicine, setSelectedPrescriptionMedicine] = useState<Medicine | null>(null);
  const [showMedicalHistoryModal, setShowMedicalHistoryModal] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({ relation: "", bloodGroup: "" });
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  // Initialize profileData with user's name from localStorage if available
  const getInitialProfileData = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          fullName: user.name || "",
          dob: "",
          bloodGroup: "",
          gender: "",
          email: user.email || "",
          phone: "",
          address: ""
        };
      }
    } catch (e) {
      console.log('Error reading user from localStorage:', e);
    }
    return {
      fullName: "",
      dob: "",
      bloodGroup: "",
      gender: "",
      email: "",
      phone: "",
      address: ""
    };
  };

  const [profileData, setProfileData] = useState(getInitialProfileData());
  
  // Update profileData immediately with user name from localStorage on mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.name && (!profileData.fullName || profileData.fullName === 'Patient')) {
          setProfileData(prev => ({
            ...prev,
            fullName: user.name,
            email: prev.email || user.email || ''
          }));
        }
      }
    } catch (e) {
      console.log('Error reading user from localStorage:', e);
    }
  }, []); // Run once on mount
  
  // Expenses are stored in USD (numbers), converted for display dynamically - already declared above
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedAppointmentType, setSelectedAppointmentType] = useState("checkup");
  // Currency state - defaults to USD, persists in localStorage
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('healthsync_currency') || 'USD';
    }
    return 'USD';
  });
  
  // Save currency preference to localStorage
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('healthsync_currency', currency);
    }
  };
  
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Helper function to sort appointments by nearest date first
  const sortAppointmentsByDate = (appts: Appointment[]) => {
    return [...appts].sort((a, b) => {
      // Parse date and time for proper comparison
      const dateTimeA = new Date(`${a.date} ${a.time === "Immediate" ? "00:00" : a.time}`);
      const dateTimeB = new Date(`${b.date} ${b.time === "Immediate" ? "00:00" : b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  };

  // Vitals - empty by default, can be populated from backend if available
  const [vitals, setVitals] = useState<Vital[]>([]);
  
  // Historical vitals data for charts - empty by default
  const [heartRateHistory, setHeartRateHistory] = useState<Array<{date: string; value: number; time?: string}>>([]);
  const [bloodPressureHistory, setBloodPressureHistory] = useState<Array<{date: string; systolic: number; diastolic: number}>>([]);
  const [temperatureHistory, setTemperatureHistory] = useState<Array<{date: string; value: number}>>([]);
  const [weightHistory, setWeightHistory] = useState<Array<{date: string; value: number}>>([]);
  const [bloodSugarHistory, setBloodSugarHistory] = useState<Array<{date: string; value: number; time?: string}>>([]);
  
  // Nearest hospitals - will be fetched from backend
  // Nearest hospitals - real-time from OpenStreetMap
  const [nearestHospitals, setNearestHospitals] = useState<Array<{
    id: string;
    name: string; 
    distance: number;
    distanceFormatted: string;
    estimatedTime: number;
    estimatedTimeFormatted: string;
    coordinates?: { latitude: number; longitude: number };
    lat?: number;
    lng?: number;
    emergency: boolean;
  }>>([]);
  
  // User location state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedHospitalForMap, setSelectedHospitalForMap] = useState<any>(null);
  const [hospitalRoutes, setHospitalRoutes] = useState<Record<string, any>>({});
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [selectedHospitalForBooking, setSelectedHospitalForBooking] = useState<any>(null);
  const [showRouteAfterBooking, setShowRouteAfterBooking] = useState(false);
  const [bookedHospital, setBookedHospital] = useState<any>(null);

  // Fetch patient data from backend on mount
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get patient ID from URL first, then localStorage, then use demo
        let patientId = 'demo-patient-id';
        
        // First, try to get from URL query parameter
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const urlPatientId = urlParams.get('id');
          if (urlPatientId) {
            patientId = urlPatientId;
            console.log('Using patient ID from URL:', patientId);
          }
        } catch (e) {
          console.log('Could not read URL params:', e);
        }
        
        // If not in URL, try localStorage (stored after login)
        if (patientId === 'demo-patient-id') {
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              // For patients, use patientId; for others, this won't be used
              if (user.role === 'patient') {
                patientId = user.patientId || 'demo-patient-id';
                console.log('Fetching data for patient ID from localStorage:', patientId);
                
                // Update URL if we have patientId from localStorage but not in URL
                if (patientId !== 'demo-patient-id') {
                  const newUrl = `${window.location.origin}${window.location.pathname}?id=${patientId}`;
                  window.history.pushState({}, '', newUrl);
                  console.log('Updated URL with patient ID from localStorage:', patientId);
                }
              } else {
                console.log('User is not a patient, using demo ID');
              }
            }
          } catch (e) {
            // If no user in localStorage, use demo-patient-id
            console.log('No user found, using demo patient ID');
          }
        }
        
        // Get userId from localStorage for profile fetch fallback
        let userId = null;
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            userId = user.id;
            console.log('Using userId for profile fetch:', userId);
          }
        } catch (e) {
          console.log('Error reading userId from localStorage:', e);
        }
        
        // Fetch all patient data in parallel - don't fail if API is down
        try {
          const [data, profile, hospitalsData, doctorsData] = await Promise.all([
            getPatientData(patientId).catch(() => ({ medicines: [], appointments: [], medicalRecords: [], predictions: [], expenses: [], orders: [], deliveries: [] })),
            getPatientProfile(patientId, userId || undefined).catch((err) => {
              console.error('Failed to fetch profile:', err);
              return null;
            }), // Profile is optional
            getHospitals().catch(() => []), // Hospitals for appointment booking
            getDoctors().catch(() => []) // Doctors for appointment booking
          ]);
          
          console.log('Profile fetch result:', profile);
          
          // Set hospitals and doctors
          setHospitals(hospitalsData);
          setDoctors(doctorsData);
          
          // Don't set mock hospitals - will be fetched from real-time location based on user's GPS location
          
          // Set the fetched data to state
          if (data) {
            setMedicines(data.medicines || []);
            setAppointments(data.appointments || []);
            setMedicalRecords(data.medicalRecords || []);
            setPredictions(data.predictions || []);
            setExpenses(data.expenses || []);
            setOrders(data.orders || []);
            
            // Update deliveries - convert to DeliveryTracking format
            const activeDeliveriesData = (data.deliveries || []).map(delivery => ({
              orderId: delivery.orderId,
              status: delivery.status as "preparing" | "dispatched" | "in_transit" | "delivered",
              estimatedDelivery: delivery.estimatedDelivery,
              driverName: delivery.driverName,
              driverPhone: delivery.driverPhone,
              driverLocation: delivery.driverLocation,
              progress: delivery.progress,
              statusHistory: delivery.statusHistory
            }));
            setActiveDeliveries(activeDeliveriesData);
          }
          
          // Get user data from localStorage for fallback
          let userFromStorage = null;
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              userFromStorage = JSON.parse(userStr);
            }
          } catch (e) {
            console.log('Error reading user from localStorage:', e);
          }
          
          // Set profile data - prioritize profile data, fallback to localStorage user data
          if (profile) {
            // Use profile fullName, but make sure it's not empty or 'Unknown' if we have user name
            let displayName = profile.fullName || '';
            
            // If profile fullName is empty, 'Unknown', or 'John Doe', use user name from localStorage
            if (!displayName || displayName === 'Unknown' || displayName === 'John Doe') {
              displayName = userFromStorage?.name || '';
            }
            
            // Final fallback: if still empty, use what came from profile
            if (!displayName) {
              displayName = profile.fullName || userFromStorage?.name || '';
            }
            
            console.log('Setting profile data:', {
              profileFullName: profile.fullName,
              userFromStorageName: userFromStorage?.name,
              displayName: displayName
            });
            
            setProfileData({
              fullName: displayName,
              dob: profile.dob || '',
              bloodGroup: profile.bloodGroup || '',
              gender: profile.gender || '',
              email: profile.email || userFromStorage?.email || '',
              phone: profile.phone || '',
              address: profile.address || ''
            });
            setMedicalHistory(profile.medicalHistory || []);
            
            // Update settings with patient's address
            if (profile.address) {
              setSettings(prev => ({
                ...prev,
                address: profile.address || '',
                location: profile.address || ''
              }));
              
              // Set delivery address from profile
              setDeliveryAddress({
                street: profile.address.split(',')[0] || profile.address,
                city: profile.address.split(',')[1]?.trim() || '',
                state: profile.address.split(',')[2]?.trim() || '',
                zip: profile.address.split(',')[3]?.trim() || '',
                lat: 0, // Would need geocoding service for real implementation
                lng: 0
              });
            }
          } else {
            // If profile doesn't exist, use user data from localStorage as fallback
            if (userFromStorage) {
              setProfileData({
                fullName: userFromStorage.name || '',
                dob: '',
                bloodGroup: '',
                gender: '',
                email: userFromStorage.email || '',
                phone: '',
                address: ''
              });
            }
          }
        } catch (apiError) {
          console.warn('API call failed, using empty data:', apiError);
          // Continue with empty arrays - UI will still render
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error in fetchPatientData:', err);
        // Don't block UI - just log the error
        setIsLoading(false);
      }
    };
    
    fetchPatientData();
  }, []); // Run once on mount

  // Fetch early warning alerts and AQI data
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Default to Mumbai, but could be based on user location
        const city = 'Mumbai';
        
        // Fetch early warning alerts
        try {
          const earlyWarning = await getEarlyWarning(city);
          
          // Show alert if alert_level exists and is not NORMAL
          if (earlyWarning && earlyWarning.alert_level) {
            if (earlyWarning.alert_level !== 'NORMAL') {
              // Map alert level to alert type
              const alertTypeMap: Record<string, string> = {
                'INFO': 'info',
                'WATCH': 'warning',
                'WARNING': 'warning',
                'CRITICAL': 'critical'
              };
              
              const alertType = alertTypeMap[earlyWarning.alert_level] || 'info';
              
              // Create early warning alert
              const earlyWarningAlert: Alert = {
                id: `early-warning-${Date.now()}`,
                type: alertType,
                title: `Early Warning: ${earlyWarning.alert_level}`,
                message: earlyWarning.message || `Early warning: ${earlyWarning.alert_level} level alert for ${city}`,
                icon: AlertCircle,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0].substring(0, 5)
              };
              
              // Add to alerts, avoiding duplicates
              setAlerts(prevAlerts => {
                const existingEarlyWarning = prevAlerts.find(a => a.id.startsWith('early-warning-'));
                if (existingEarlyWarning) {
                  return prevAlerts.map(a => 
                    a.id.startsWith('early-warning-') ? earlyWarningAlert : a
                  );
                }
                return [earlyWarningAlert, ...prevAlerts];
              });
            } else {
              // Log that system is working but no alerts
              console.log('Early Warning System: All systems normal - no alerts to display');
            }
          }
        } catch (ewError: any) {
          console.error('Early warning service error:', ewError);
          // Log more details for debugging
          if (ewError.message) {
            console.error('Early warning error details:', ewError.message);
          }
          // Show user-friendly error message
          if (ewError.message && !ewError.message.includes('timeout')) {
            console.warn('Early warning service may be unavailable or slow to respond');
          }
        }
        
        // Fetch AQI/pollution data from weather/pollution API (port 8003) or early warning signals
        try {
          // Try weather/pollution API first (direct AQI service)
          try {
            const weatherResponse = await fetch(`http://localhost:8003/predict/${city}`);
            if (weatherResponse.ok) {
              const weatherData = await weatherResponse.json();
              const aqi = weatherData.aqi || 0;
              
              if (aqi > 100) {
                const aqiAlert: Alert = {
                  id: `aqi-${Date.now()}`,
                  type: aqi > 200 ? 'critical' : aqi > 150 ? 'warning' : 'info',
                  title: `Air Quality Alert: AQI ${Math.round(aqi)}`,
                  message: aqi > 200 
                    ? `Very poor air quality (AQI: ${Math.round(aqi)}). Avoid outdoor activities, especially if you have respiratory conditions.`
                    : aqi > 150
                    ? `Poor air quality (AQI: ${Math.round(aqi)}). Limit outdoor activities and use masks if necessary.`
                    : `Moderate air quality (AQI: ${Math.round(aqi)}). Sensitive individuals should take precautions.`,
                  icon: AlertTriangle,
                  date: new Date().toISOString().split('T')[0],
                  time: new Date().toTimeString().split(' ')[0].substring(0, 5)
                };
                
                setAlerts(prevAlerts => {
                  const existingAqi = prevAlerts.find(a => a.id.startsWith('aqi-'));
                  if (existingAqi) {
                    return prevAlerts.map(a => 
                      a.id.startsWith('aqi-') ? aqiAlert : a
                    );
                  }
                  return [aqiAlert, ...prevAlerts];
                });
              }
            }
          } catch (weatherError) {
            // Fallback to early warning signals if weather API unavailable
            console.warn('Weather/Pollution API unavailable, trying early warning signals:', weatherError);
            const signalsResponse = await fetch(`http://localhost:5000/api/early-warning/signals/${city}`);
            if (signalsResponse.ok) {
              const signalsData = await signalsResponse.json();
              
              // Check if there's pollution/AQI data in signals
              if (signalsData.signals && signalsData.signals.pollution) {
                const pollution = signalsData.signals.pollution;
                const aqi = pollution.aqi || pollution.pm25 || 0;
                
                if (aqi > 100) {
                  const aqiAlert: Alert = {
                    id: `aqi-${Date.now()}`,
                    type: aqi > 200 ? 'critical' : aqi > 150 ? 'warning' : 'info',
                    title: `Air Quality Alert: AQI ${Math.round(aqi)}`,
                    message: aqi > 200 
                      ? `Very poor air quality (AQI: ${Math.round(aqi)}). Avoid outdoor activities, especially if you have respiratory conditions.`
                      : aqi > 150
                      ? `Poor air quality (AQI: ${Math.round(aqi)}). Limit outdoor activities and use masks if necessary.`
                      : `Moderate air quality (AQI: ${Math.round(aqi)}). Sensitive individuals should take precautions.`,
                    icon: AlertTriangle,
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().split(' ')[0].substring(0, 5)
                  };
                  
                  setAlerts(prevAlerts => {
                    const existingAqi = prevAlerts.find(a => a.id.startsWith('aqi-'));
                    if (existingAqi) {
                      return prevAlerts.map(a => 
                        a.id.startsWith('aqi-') ? aqiAlert : a
                      );
                    }
                    return [aqiAlert, ...prevAlerts];
                  });
                }
              }
            }
          }
        } catch (aqiError) {
          console.warn('AQI data unavailable:', aqiError);
        }
        
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };
    
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Update alerts when medicines change - generate reminders for pending doses
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Keep non-medicine alerts (including early warning alerts)
    const nonMedicineAlerts = alerts.filter((alert: Alert) => alert.type !== 'reminder' || !alert.medicineId);
    
    // Generate medicine reminder alerts for today's pending doses
    const medicineAlerts: Alert[] = [];
    medicines
      .filter((m: Medicine) => !m.completed && m.reminderEnabled)
      .forEach((med: Medicine) => {
        med.times.forEach((time: string) => {
          const taking = med.takings.find((t: MedicineTaking) => t.date === today && t.time === time);
          if (hasMedicineTimePassed(time) && !taking?.taken) {
            medicineAlerts.push({
              id: `med-${med.id}-${time}`,
              type: 'reminder',
              message: `Time to take your ${med.name} ${med.dosage} medication (${time} dose).`,
              icon: Pill,
              medicineId: med.id,
              date: today,
              time: time
            });
          }
        });
      });
    
    // Update alerts with both non-medicine and new medicine alerts
    setAlerts([...nonMedicineAlerts, ...medicineAlerts]);
  }, [medicines]); // Re-run when medicines change

  // Predictions are loaded from backend in fetchPatientData
  // This effect only handles localStorage as backup if backend data is not available
  useEffect(() => {
    // Only load from localStorage if predictions are empty (backend didn't provide any)
    if (predictions.length === 0) {
      const allPredictions = JSON.parse(localStorage.getItem('allPatientPredictions') || '{}');
      const currentPatientPredictions = allPredictions['currentPatient'];
      
      if (currentPatientPredictions && currentPatientPredictions.length > 0) {
        setPredictions(currentPatientPredictions);
      } else {
        // Migration: Check for old format and migrate it
        const oldPredictions = localStorage.getItem('patientPredictions');
        if (oldPredictions) {
          const parsedOldPredictions = JSON.parse(oldPredictions);
          if (parsedOldPredictions.length > 0) {
            setPredictions(parsedOldPredictions);
            // Migrate to new format
            allPredictions['currentPatient'] = parsedOldPredictions;
            localStorage.setItem('allPatientPredictions', JSON.stringify(allPredictions));
          }
        }
      }
    }
  }, []); // Only run once on mount

  // Save predictions to localStorage whenever they change
  useEffect(() => {
    if (predictions.length > 0) {
      // Store predictions with patient ID structure
      const allPredictions = JSON.parse(localStorage.getItem('allPatientPredictions') || '{}');
      allPredictions['currentPatient'] = predictions; // Use 'currentPatient' as the logged-in patient ID
      localStorage.setItem('allPatientPredictions', JSON.stringify(allPredictions));
    }
  }, [predictions]);

  // Load medical records from localStorage on mount - only if they exist
  useEffect(() => {
    const allRecords = JSON.parse(localStorage.getItem('allPatientMedicalRecords') || '{}');
    const currentPatientRecords = allRecords['currentPatient'];
    
    // Only load from localStorage if records exist
    // Otherwise, medical records will be loaded from backend in fetchPatientData
    if (currentPatientRecords && currentPatientRecords.length > 0) {
      setMedicalRecords(currentPatientRecords);
    }
    
    // Show welcome notification with medical records count
    const hasSeenWelcome = sessionStorage.getItem('hasSeenMedicalRecordsWelcome');
    if (!hasSeenWelcome) {
      setTimeout(() => {
        const recordCount = currentPatientRecords?.length || medicalRecords.length;
        if (recordCount > 0) {
          toast.success(`Welcome back! You have ${recordCount} medical document${recordCount > 1 ? 's' : ''} on file.`, {
            duration: 4000,
          });
        }
        sessionStorage.setItem('hasSeenMedicalRecordsWelcome', 'true');
      }, 1500);
    }
  }, []);

  // Save medical records to localStorage whenever they change
  useEffect(() => {
    const allRecords = JSON.parse(localStorage.getItem('allPatientMedicalRecords') || '{}');
    allRecords['currentPatient'] = medicalRecords;
    localStorage.setItem('allPatientMedicalRecords', JSON.stringify(allRecords));
  }, [medicalRecords]);

  // Function to add toast notification
  const addToastNotification = (message: string, type: "info" | "success" | "warning" | "error", icon: any) => {
    const id = Date.now().toString();
    setToastNotifications((prev: any[]) => [...prev, { id, message, type, icon }]);
    setTimeout(() => {
      setToastNotifications((prev: any[]) => prev.filter((notif: any) => notif.id !== id));
    }, 5000);
  };

  // Show notification popup on login if there are new notifications
  useEffect(() => {
    const hasSeenNotificationPopup = sessionStorage.getItem('hasSeenNotificationPopup');
    if (!hasSeenNotificationPopup && alerts.length > 0) {
      setTimeout(() => {
        setShowNotificationPopup(true);
        sessionStorage.setItem('hasSeenNotificationPopup', 'true');
      }, 2000);
    }
  }, []);

  // Show missed notifications on login - based on actual patient data
  useEffect(() => {
    const hasSeenMissedNotifications = sessionStorage.getItem('hasSeenMissedNotifications');
    if (!hasSeenMissedNotifications && (appointments.length > 0 || medicines.length > 0 || medicalRecords.length > 0)) {
      const notifications: Array<{message: string; type: "info" | "success" | "warning" | "error"; icon: any; delay: number}> = [];
      
      // Check for upcoming appointments
      const upcomingAppts = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        const today = new Date();
        return aptDate >= today;
      });
      if (upcomingAppts.length > 0) {
        const firstAppt = upcomingAppts[0];
        notifications.push({
          message: `Upcoming appointment with ${firstAppt.doctor} on ${formatAppointmentDate(firstAppt.date)}`,
          type: "info",
          icon: Calendar,
          delay: 1000
        });
      }
      
      // Check for pending medicines
      const pendingMeds = medicines.filter(m => !m.completed && m.reminderEnabled);
      if (pendingMeds.length > 0) {
        notifications.push({
          message: `You have ${pendingMeds.length} active medication${pendingMeds.length > 1 ? 's' : ''} to track`,
          type: "info",
          icon: Pill,
          delay: 2000
        });
      }
      
      // Check for medical records
      if (medicalRecords.length > 0) {
        notifications.push({
          message: `You have ${medicalRecords.length} medical document${medicalRecords.length > 1 ? 's' : ''} on file`,
          type: "success",
          icon: FileText,
          delay: 3000
        });
      }

      notifications.forEach((notif) => {
        setTimeout(() => {
          addToastNotification(notif.message, notif.type, notif.icon);
        }, notif.delay);
      });

      sessionStorage.setItem('hasSeenMissedNotifications', 'true');
    }
  }, [appointments, medicines, medicalRecords]);

  // Simulate real-time notifications
  useEffect(() => {
    const notificationIntervals: NodeJS.Timeout[] = [];
    
    // Check for appointment confirmations (based on actual appointments)
    const appointmentInterval = setInterval(() => {
      const confirmedAppts = appointments.filter(apt => apt.status === 'accepted');
      if (confirmedAppts.length > 0 && Math.random() > 0.9) {
        const appt = confirmedAppts[0];
        addToastNotification(
          `Your appointment with ${appt.doctor} has been confirmed`,
          "success",
          CheckCircle
        );
      }
    }, 30000); // Every 30 seconds
    
    // Medicine reminders based on actual medicines
    const medicineInterval = setInterval(() => {
      if (medicines.length > 0 && Math.random() > 0.8) {
        const activeMeds = medicines.filter(m => !m.completed && m.reminderEnabled);
        if (activeMeds.length > 0) {
          const randomMed = activeMeds[Math.floor(Math.random() * activeMeds.length)];
          addToastNotification(
            `Time to take your ${randomMed.name} medication`,
            "warning",
            Pill
          );
        }
      }
    }, 45000); // Every 45 seconds
    
    // Simulate general alerts
    const alertInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        addToastNotification(
          "Your lab results are now available",
          "info",
          FileText
        );
      }
    }, 60000); // Every 60 seconds
    
    notificationIntervals.push(appointmentInterval, medicineInterval, alertInterval);
    
    return () => {
      notificationIntervals.forEach(interval => clearInterval(interval));
    };
  }, []);

  // Get user location when hospitals tab is active
  useEffect(() => {
    if (activeTab !== "hospitals") return;

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLocation(location);
            setLocationError(null);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Unable to get your location. Please enable location services.');
            // Fallback to Mumbai coordinates
            setUserLocation({ latitude: 19.0760, longitude: 72.8777 });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocationError('Geolocation is not supported by your browser.');
        // Fallback to Mumbai coordinates
        setUserLocation({ latitude: 19.0760, longitude: 72.8777 });
      }
    };

    getLocation();
  }, [activeTab]);

  // Fetch nearby hospitals when user location is available
  useEffect(() => {
    if (!userLocation || activeTab !== "hospitals") return;

    const fetchHospitals = async () => {
      try {
        setIsLoadingHospitals(true);
        
        // Get patient ID
        let patientId = 'demo-patient-id';
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const urlPatientId = urlParams.get('id');
          if (urlPatientId) {
            patientId = urlPatientId;
          } else {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              if (user.role === 'patient') {
                patientId = user.patientId || 'demo-patient-id';
              }
            }
          }
        } catch (e) {
          console.error('Error getting patient ID:', e);
        }

        const hospitals = await getNearbyHospitalsForPatient(
          patientId,
          userLocation.latitude,
          userLocation.longitude
        );

        // Transform hospitals to match the expected format
        const formattedHospitals = hospitals.map((h) => ({
          id: h.id,
          name: h.name,
          distance: `${h.distance.toFixed(1)} km`,
          distanceFormatted: `${h.distance.toFixed(1)} km`,
          estimatedTime: Math.round(h.distance * 2), // Rough estimate: 2 min per km
          estimatedTimeFormatted: `${Math.round(h.distance * 2)} min`,
          coordinates: { latitude: h.lat, longitude: h.lng },
          lat: h.lat,
          lng: h.lng,
          emergency: true, // Assume all hospitals have 24/7 emergency
        }));

        setNearestHospitals(formattedHospitals);
        
        // Auto-select the first (nearest) hospital
        if (formattedHospitals.length > 0) {
          setSelectedHospitalForMap(formattedHospitals[0]);
        }
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        toast.error('Failed to fetch nearby hospitals');
      } finally {
        setIsLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, [userLocation, activeTab]);

  // Fetch routes when a hospital is selected
  useEffect(() => {
    if (!userLocation || !selectedHospitalForMap || activeTab !== "hospitals") return;

    const fetchRoutes = async () => {
      try {
        const start: [number, number] = [userLocation.latitude, userLocation.longitude];
        const end: [number, number] = [selectedHospitalForMap.lat, selectedHospitalForMap.lng];

        const route = await getRoute(start, end, 'driving');
        
        if (route) {
          setHospitalRoutes({
            'driving-car': route,
          });
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    fetchRoutes();
  }, [userLocation, selectedHospitalForMap, activeTab]);

  // Fetch route when route modal opens after booking
  useEffect(() => {
    if (showRouteAfterBooking && bookedHospital && userLocation && bookedHospital.lat && bookedHospital.lng) {
      // Check if we need to fetch the route
      const currentRoute = hospitalRoutes['driving-car'];
      const needsRoute = !currentRoute || !currentRoute.coords || currentRoute.coords.length === 0;
      
      if (needsRoute) {
        const fetchRouteForBooking = async () => {
          try {
            const start: [number, number] = [userLocation.latitude, userLocation.longitude];
            const end: [number, number] = [bookedHospital.lat, bookedHospital.lng];
            console.log('Fetching route for booking modal:', { start, end });
            const route = await getRoute(start, end, 'driving');
            if (route && route.coords && route.coords.length > 0) {
              console.log('Route fetched successfully for booking modal:', route);
              setHospitalRoutes({
                'driving-car': route,
              });
            } else {
              console.warn('Route data is empty or invalid:', route);
            }
          } catch (error) {
            console.error('Error fetching route for booking modal:', error);
          }
        };
        fetchRouteForBooking();
      } else {
        console.log('Route already exists, using cached route');
      }
    }
  }, [showRouteAfterBooking, bookedHospital, userLocation]);

  // Pre-select hospital when booking modal opens with a selected hospital
  useEffect(() => {
    if (showBookAppointmentModal && selectedHospitalForBooking) {
      // Set the selected hospital to match the pre-selected one
      setSelectedHospital(selectedHospitalForBooking.id || selectedHospitalForBooking.name || "");
    }
  }, [showBookAppointmentModal, selectedHospitalForBooking]);

  const toggleReminder = async (id: string) => {
    try {
      // Get patient ID from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error("Please login again");
        return;
      }
      const user = JSON.parse(userStr);
      const patientId = user.patientId || 'demo-patient-id';
      
      const response = await toggleMedicineReminder(patientId, id);
      
      // Update local state with the response from backend
      setMedicines(
        medicines.map((med: Medicine) =>
          med.id === id ? { ...med, reminderEnabled: response.reminderEnabled } : med
        )
      );
      
      toast.success("Reminder status updated");
    } catch (error) {
      console.error('Error toggling reminder:', error);
      toast.error("Failed to update reminder status");
    }
  };

  const handleMarkMedicineAsTaken = async (medicineId: string, date: string, time: string) => {
    try {
      // Get patient ID from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error("Please login again");
        return;
      }
      const user = JSON.parse(userStr);
      const patientId = user.patientId || 'demo-patient-id';
      
      const updatedMedicine = await markMedicineAsTaken(patientId, medicineId, date, time);
      
      // Update local state with the response from backend
      setMedicines(medicines.map((med: Medicine) => 
        med.id === medicineId ? updatedMedicine : med
      ));
      
      toast.success("Medicine marked as taken");
    } catch (error) {
      console.error('Error marking medicine as taken:', error);
      toast.error("Failed to mark medicine as taken");
    }
  };

  // Generate AI summary based on upload type
  const generateAISummary = (type: string, fileName: string): string => {
    const summaries: Record<string, string[]> = {
      report: [
        "Blood Report Analysis: All parameters within normal range. Hemoglobin: 14.2 g/dL (Normal), WBC: 7,800/μL (Normal), Platelets: 250,000/μL (Normal). Liver and kidney function tests show healthy values. No immediate concerns detected. Recommend maintaining current lifestyle and routine checkups.",
        "Lipid Profile: Total cholesterol slightly elevated at 210 mg/dL. LDL: 135 mg/dL (borderline high), HDL: 45 mg/dL (acceptable), Triglycerides: 150 mg/dL (normal). Recommend dietary modifications - reduce saturated fats, increase omega-3 intake. Consider aerobic exercise 30 min/day. Recheck in 3 months.",
        "Thyroid Function: TSH levels at 2.5 mIU/L (normal range). T3 and T4 within acceptable limits. No signs of hypothyroidism or hyperthyroidism. Patient's fatigue likely unrelated to thyroid function. Suggest investigating other causes such as vitamin deficiencies or sleep quality."
      ],
      xray: [
        "Chest X-Ray: Clear lung fields bilaterally. No signs of pneumonia, pleural effusion, or masses. Heart size normal. No acute cardiopulmonary abnormalities detected. Recommend continuing preventive care and annual screening for high-risk patients.",
        "Knee X-Ray: Mild degenerative changes noted in medial compartment. Joint space narrowing with small osteophytes present. Consistent with early-stage osteoarthritis. Recommend weight management, low-impact exercises, and physical therapy. Consider NSAIDs for pain management as needed.",
        "Spine X-Ray: Mild lumbar spondylosis with disc space narrowing at L4-L5. No acute fractures or dislocations. Vertebral alignment maintained. Recommend core strengthening exercises, proper posture, and ergonomic workspace adjustments. Physical therapy may be beneficial."
      ],
      "ct-scan": [
        "Brain CT Scan: No acute intracranial hemorrhage, mass effect, or midline shift. Ventricular system normal in size and configuration. No significant abnormalities detected. Age-appropriate cerebral atrophy. Patient's symptoms may require further neurological evaluation.",
        "Abdominal CT: Liver, spleen, pancreas, and kidneys appear normal in size and attenuation. No masses, stones, or collections identified. Bowel loops normal. Small hiatal hernia noted. No acute abdominal pathology. Recommend lifestyle modifications for GERD management if symptomatic."
      ],
      mri: [
        "Brain MRI: No evidence of acute infarction or hemorrhage. No mass lesions identified. White matter changes consistent with age. Ventricular system normal. Cranial nerves intact. Findings do not explain current symptoms. Consider alternative diagnoses or functional assessment.",
        "Knee MRI: Small tear in medial meniscus posterior horn. ACL and PCL intact. Mild joint effusion present. Grade 2 chondromalacia patella. Recommend conservative management with RICE protocol, physical therapy focusing on quadriceps strengthening. Arthroscopy may be considered if symptoms persist."
      ],
      "lab-result": [
        "Complete Blood Count: All cell lines within normal limits. No anemia, thrombocytopenia, or leukocytosis. Differential count shows normal lymphocyte and neutrophil percentages. No urgent concerns. Results consistent with healthy immune system function.",
        "Metabolic Panel: Glucose: 102 mg/dL (slightly elevated, pre-diabetic range). Electrolytes balanced. Creatinine: 0.9 mg/dL (normal kidney function). Liver enzymes within normal range. Recommend lifestyle modifications to prevent progression to diabetes - dietary changes, regular exercise, weight management."
      ]
    };

    const typeSummaries = summaries[type] || [
      "Document analyzed successfully. The uploaded file has been processed and stored in your medical records. Please consult with your healthcare provider for detailed interpretation and recommendations based on these findings."
    ];

    return typeSummaries[Math.floor(Math.random() * typeSummaries.length)];
  };

  const handlePrescriptionUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const loadingMessage = uploadType === "prescription" 
        ? "Analyzing prescription..." 
        : `Analyzing ${uploadType}...`;
      
      toast.loading(loadingMessage);
      
      // Mock AI analysis
      setTimeout(() => {
        toast.dismiss();
        
        if (uploadType === "prescription") {
          // Extracted medicines from prescription (would come from backend OCR/AI)
          const mockExtractedMedicines = [
            {
              name: "Paracetamol",
              dosage: "650mg",
              frequency: "Twice daily after meals",
              duration: "5 days",
              times: ["Morning", "Evening"]
            },
            {
              name: "Amoxicillin",
              dosage: "500mg",
              frequency: "Three times daily",
              duration: "7 days",
              times: ["Morning", "Afternoon", "Night"]
            },
            {
              name: "Vitamin D3",
              dosage: "1000 IU",
              frequency: "Once daily",
              duration: "30 days",
              times: ["Morning"]
            }
          ];
          
          setExtractedMedicines(mockExtractedMedicines);
          setShowUploadModal(false);
          setShowPrescriptionConfirm(true);
          toast.success("Prescription analyzed successfully!");
        } else {
          // For reports, xrays, and other medical documents
          const fileUrl = URL.createObjectURL(file);
          const summary = generateAISummary(uploadType, file.name);
          
          const newRecord: MedicalRecord = {
            id: `record-${Date.now()}`,
            type: uploadType,
            fileName: file.name,
            fileUrl: fileUrl,
            uploadDate: new Date().toISOString(),
            summary: summary
          };
          
          setMedicalRecords([...medicalRecords, newRecord]);
          setShowUploadModal(false);
          toast.success(`${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} analyzed successfully!`);
        }
      }, 2000);
    }
  };

  const handleConfirmExtractedMedicines = (confirmedMedicines: typeof extractedMedicines) => {
    const today = new Date();
    const updatedMedicines = [...medicines];
    
    confirmedMedicines.forEach((extracted: any) => {
      // Check if medicine already exists
      const existingIndex = updatedMedicines.findIndex(
        (m: Medicine) => m.name.toLowerCase() === extracted.name.toLowerCase()
      );
      
      const durationDays = parseInt(extracted.duration);
      
      if (existingIndex !== -1) {
        // Update existing medicine - extend duration
        const existing = updatedMedicines[existingIndex];
        updatedMedicines[existingIndex] = {
          ...existing,
          dosage: extracted.dosage,
          frequency: extracted.frequency,
          duration: extracted.duration,
          remainingDays: existing.remainingDays + durationDays,
          times: extracted.times,
          completed: false,
          // Generate new takings for extended period
          takings: [
            ...existing.takings,
            ...generateHistoricalTakings(durationDays, extracted.times, today)
          ]
        };
      } else {
        // Add new medicine
        const newMedicine: Medicine = {
          id: Date.now().toString() + Math.random(),
          name: extracted.name,
          dosage: extracted.dosage,
          frequency: extracted.frequency,
          duration: extracted.duration,
          remainingDays: durationDays,
          reminderEnabled: true,
          completed: false,
          totalStrips: Math.ceil(durationDays / 10),
          purchasedStrips: 0,
          times: extracted.times,
          takings: generateHistoricalTakings(Math.min(365, durationDays), extracted.times, today)
        };
        updatedMedicines.push(newMedicine);
      }
    });
    
    setMedicines(updatedMedicines);
    setShowPrescriptionConfirm(false);
    setExtractedMedicines([]);
    toast.success(`${confirmedMedicines.length} medicine(s) added successfully!`);
  };

  const handleBookAppointment = async (e: any) => {
    e.preventDefault();
    
    // Get available doctors (could be from backend or generated)
    const availableDoctors = getAvailableDoctors();
    const doctor = availableDoctors.find(d => d.id === selectedDoctor);
    
    // Find hospital from nearestHospitals first, then fallback to hospitals
    const hospital = nearestHospitals.find(h => h.id === selectedHospital) || 
                     hospitals.find(h => h.id === selectedHospital) ||
                     selectedHospitalForBooking;
    
    if (!doctor || !hospital) return;
    
    // For emergency, skip date/time validation
    if (selectedAppointmentType !== "emergency" && !selectedSlot) return;
    
    try {
      // Get patient ID
      const patientId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).patientId : 'demo-patient-id';
      
      // Prepare appointment data for backend
      const appointmentDate = selectedAppointmentType === "emergency" 
        ? new Date().toISOString().split('T')[0] 
        : selectedDate;
      const appointmentTime = selectedAppointmentType === "emergency" 
        ? "Immediate" 
        : selectedSlot;
      
      // Save appointment to database
      const savedAppointment = await createAppointment(patientId, {
        hospitalId: hospital.id?.match(/^[0-9a-fA-F]{24}$/) ? hospital.id : undefined, // Only if it's a MongoDB ObjectId
        hospitalName: hospital.name || (hospital as any).name || "Hospital",
        hospitalLat: hospital.lat,
        hospitalLng: hospital.lng,
        doctorId: doctor.id?.match(/^[0-9a-fA-F]{24}$/) ? doctor.id : undefined, // Only if it's a MongoDB ObjectId
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        date: appointmentDate,
        time: appointmentTime,
        type: selectedAppointmentType as "checkup" | "followup" | "emergency",
        reason: `${doctor.name} - ${doctor.specialty}`
      });
      
      console.log('Appointment saved to database:', savedAppointment);
      
      // Create frontend appointment object for local state
      const newAppointment: Appointment = {
        id: savedAppointment._id?.toString() || savedAppointment.id || String(appointments.length + 1),
        doctor: savedAppointment.doctor || doctor.name,
        specialty: savedAppointment.specialty || doctor.specialty,
        date: appointmentDate,
        time: appointmentTime,
        hospital: savedAppointment.hospital || hospital.name || (hospital as any).name || "Hospital",
        type: selectedAppointmentType as "checkup" | "followup" | "emergency",
        status: savedAppointment.status || "pending",
      };
      
      // Add new appointment and sort by nearest date first
      const updatedAppointments = sortAppointmentsByDate([...appointments, newAppointment]);
      setAppointments(updatedAppointments);
      
      toast.success("Appointment booked successfully and saved to hospital database!");
    } catch (error) {
      console.error('Error saving appointment to database:', error);
      // Still add to local state even if database save fails
      const newAppointment: Appointment = {
        id: String(appointments.length + 1),
        doctor: doctor.name,
        specialty: doctor.specialty,
        date: selectedAppointmentType === "emergency" ? new Date().toISOString().split('T')[0] : selectedDate,
        time: selectedAppointmentType === "emergency" ? "Immediate" : selectedSlot,
        hospital: hospital.name || (hospital as any).name || "Hospital",
        type: selectedAppointmentType as "checkup" | "followup" | "emergency",
        status: "pending",
      };
      const updatedAppointments = sortAppointmentsByDate([...appointments, newAppointment]);
      setAppointments(updatedAppointments);
      toast.error("Appointment added locally, but failed to save to database. Please try again.");
    }
    
    // Get the appointment date for expenses (same logic as above)
    const appointmentDate = selectedAppointmentType === "emergency" 
      ? new Date().toISOString().split('T')[0] 
      : selectedDate;
    
    // Add to expenses (store as USD number for dynamic conversion)
    const consultationFee = selectedAppointmentType === "emergency" ? 150 : 80;
    const newExpense = {
      name: `${doctor.name} - ${selectedAppointmentType === "emergency" ? "Emergency" : "Consultation"}`,
      amount: consultationFee, // Store as number
      date: formatAppointmentDate(appointmentDate),
      category: "Consultation"
    };
    setExpenses([newExpense, ...expenses]);
    
    // Set the booked hospital for route display
    // Priority: nearestHospitals -> selectedHospitalForBooking -> hospitals
    const hospitalForRoute = nearestHospitals.find(h => h.id === selectedHospital) || 
                             selectedHospitalForBooking || 
                             hospitals.find(h => h.id === selectedHospital);
    
    if (hospitalForRoute && userLocation) {
      setBookedHospital(hospitalForRoute);
      setSelectedHospitalForMap(hospitalForRoute);
      
      // Always show the route modal after booking first
      setShowRouteAfterBooking(true);
      
      // Check if hospital has coordinates (from nearestHospitals)
      if (hospitalForRoute.lat && hospitalForRoute.lng) {
        // Fetch route to the booked hospital
        try {
          const start: [number, number] = [userLocation.latitude, userLocation.longitude];
          const end: [number, number] = [hospitalForRoute.lat, hospitalForRoute.lng];
          console.log('Fetching route after booking:', { start, end });
          const route = await getRoute(start, end, 'driving');
          if (route && route.coords && route.coords.length > 0) {
            console.log('Route fetched successfully after booking:', {
              coordsCount: route.coords.length,
              distance: route.distance,
              duration: route.duration,
              firstCoord: route.coords[0],
              lastCoord: route.coords[route.coords.length - 1]
            });
            setHospitalRoutes({
              'driving-car': route,
            });
          } else {
            console.warn('Route data is invalid or empty:', route);
          }
        } catch (error) {
          console.error('Error fetching route after booking:', error);
        }
      } else {
        console.warn('Hospital coordinates not available:', hospitalForRoute);
      }
    }
    
    setShowBookAppointmentModal(false);
    // Reset form
    setSelectedHospital("");
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedSlot("");
    setSelectedAppointmentType("checkup");
    setSelectedHospitalForBooking(null);
  };

  // Handle Retell AI call
  const handleCallAI = async () => {
    try {
      setIsCallingAI(true);
      
      // Use your phone number directly
      const patientPhone = "+918433550728";
      
      // Format phone number - ensure it starts with + for E.164 format
      let formattedPhone = patientPhone.trim();
      if (!formattedPhone.startsWith('+')) {
        // If phone doesn't start with +, assume it's an Indian number and add +91
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+91' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('91')) {
          formattedPhone = '+91' + formattedPhone;
        } else {
          formattedPhone = '+' + formattedPhone;
        }
      }

      // Remove any spaces, dashes, or parentheses
      formattedPhone = formattedPhone.replace(/[\s\-\(\)]/g, '');

      console.log('Making Retell AI call to:', formattedPhone);

      // Call the Retell AI backend endpoint
      const response = await fetch("http://localhost:5000/api/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_number: "+14632508357", // Your verified Retell number
          to_number: formattedPhone, // Patient's phone number
        }),
      });

      const data = await response.json();
      
      if (data.success && data.call) {
        toast.success(`📞 Call initiated! Our AI assistant will call you at ${formattedPhone} shortly.`);
        console.log('Call created successfully:', data.call.call_id);
      } else {
        toast.error(data.error || "Failed to initiate call. Please try again.");
        console.error('Call failed:', data);
      }
    } catch (error: any) {
      console.error("Error making Retell AI call:", error);
      toast.error("Failed to connect to call service. Please try again later.");
    } finally {
      setIsCallingAI(false);
    }
  };

  // Generate 4 random doctors for a hospital
  const generateRandomDoctors = (hospitalId: string) => {
    const firstNames = ["Dr. Priya", "Dr. Rajesh", "Dr. Anjali", "Dr. Vikram", "Dr. Meera", "Dr. Arjun", "Dr. Kavita", "Dr. Rohan", "Dr. Sneha", "Dr. Aditya"];
    const lastNames = ["Sharma", "Patel", "Kumar", "Singh", "Desai", "Reddy", "Malhotra", "Agarwal", "Mehta", "Gupta"];
    const specializations = [
      "Cardiologist", "General Physician", "Pediatrician", "Dermatologist", 
      "Orthopedic", "Neurologist", "Gynecologist", "ENT Specialist", 
      "Ophthalmologist", "Psychiatrist", "Pulmonologist", "Gastroenterologist"
    ];

    // Use hospital ID as seed for consistent randomization per hospital
    const seed = hospitalId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomDoctors = [];
    
    for (let i = 0; i < 4; i++) {
      const nameIndex = (seed + i * 13) % firstNames.length;
      const lastNameIndex = (seed + i * 17) % lastNames.length;
      const specializationIndex = (seed + i * 7) % specializations.length;
      
      const doctor = {
        id: `doctor-${hospitalId}-${i}`,
        name: `${firstNames[nameIndex]} ${lastNames[lastNameIndex]}`,
        specialty: specializations[specializationIndex],
        hospitalId: hospitalId,
      };
      randomDoctors.push(doctor);
    }
    
    return randomDoctors;
  };

  const getAvailableDoctors = () => {
    if (!selectedHospital) return [];
    
    // Get hospital ID (could be from nearestHospitals or hospitals list)
    const hospitalId = selectedHospital;
    
    // First, try to use real doctors from the API
    if (doctors && doctors.length > 0) {
      // Filter doctors that match the selected hospital (if hospitalId is a MongoDB ObjectId)
      // Or include all doctors if hospitalId is not a MongoDB ObjectId (external hospitals)
      const hospitalIdStr = typeof hospitalId === 'string' ? hospitalId : hospitalId.toString();
      const isMongoObjectId = /^[0-9a-fA-F]{24}$/.test(hospitalIdStr);
      
      let availableDoctors = [];
      
      if (isMongoObjectId) {
        // For registered hospitals, filter doctors by hospitalId
        availableDoctors = doctors.filter((d: any) => 
          d.hospitalId === hospitalIdStr || !d.hospitalId
        );
      } else {
        // For external hospitals (from Overpass API), show all doctors
        // This allows patients to book with any doctor regardless of hospital
        availableDoctors = doctors;
      }
      
      // Always include Dr. Sarah Mitchell if she exists in the doctors list
      const sarahMitchell = doctors.find((d: any) => 
        d.name && d.name.toLowerCase().includes('sarah mitchell')
      );
      
      if (sarahMitchell && !availableDoctors.find((d: any) => d.id === sarahMitchell.id)) {
        availableDoctors.push(sarahMitchell);
      }
      
      // If we have real doctors, use them (at least 1, up to 4)
      if (availableDoctors.length > 0) {
        // Return up to 4 doctors, prioritizing Dr. Sarah Mitchell
        const sortedDoctors = availableDoctors.sort((a: any, b: any) => {
          const aIsSarah = a.name && a.name.toLowerCase().includes('sarah mitchell');
          const bIsSarah = b.name && b.name.toLowerCase().includes('sarah mitchell');
          if (aIsSarah && !bIsSarah) return -1;
          if (!aIsSarah && bIsSarah) return 1;
          return 0;
        });
        
        return sortedDoctors.slice(0, 4).map((d: any) => ({
          id: d.id,
          name: d.name,
          specialty: d.specialty || d.specialization || 'General',
          hospitalId: d.hospitalId || hospitalIdStr
        }));
      }
    }
    
    // Fallback: generate random doctors if no real doctors found
    // But try to include Dr. Sarah Mitchell in the random list if she exists
    const randomDoctors = generateRandomDoctors(hospitalId);
    
    // Check if Dr. Sarah Mitchell exists in the doctors list and add her
    if (doctors && doctors.length > 0) {
      const sarahMitchell = doctors.find((d: any) => 
        d.name && d.name.toLowerCase().includes('sarah mitchell')
      );
      
      if (sarahMitchell) {
        // Replace first random doctor with Dr. Sarah Mitchell
        randomDoctors[0] = {
          id: sarahMitchell.id,
          name: sarahMitchell.name,
          specialty: sarahMitchell.specialty || sarahMitchell.specialization || 'Cardiologist',
          hospitalId: sarahMitchell.hospitalId || hospitalIdStr
        };
      }
    }
    
    return randomDoctors;
  };

  const getAvailableSlots = () => {
    if (!selectedDate || !selectedDoctor) return [];
    // Check which slots are already taken based on existing appointments
    const availableDoctors = getAvailableDoctors();
    const selectedDoctorObj = availableDoctors.find((d: any) => d.id === selectedDoctor);
    const bookedSlots = appointments
      .filter((apt: any) => apt.date === selectedDate && apt.doctor === selectedDoctorObj?.name)
      .map((apt: any) => apt.time);
    return TIME_SLOTS.filter(slot => !bookedSlots.includes(slot));
  };

  const formatAppointmentDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return "Today";
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Disease Prediction Functions
  const handlePredictionSubmit = async () => {
    if (!selectedPredictionType) return;
    
    try {
      // Get patient ID
      const patientId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).patientId : 'demo-patient-id';
      
      // Show loading state
      toast.info('Running ML prediction...');
      
      // Call backend API to get ML prediction
      const newPrediction = await createPrediction(patientId, selectedPredictionType, predictionInputs);
      
      // Add prediction to state
      setPredictions([newPrediction, ...predictions]);
      
      // Save to localStorage
      const allPredictions = JSON.parse(localStorage.getItem('allPatientPredictions') || '{}');
      const currentPatientPredictions = allPredictions['currentPatient'] || [];
      allPredictions['currentPatient'] = [newPrediction, ...currentPatientPredictions];
      localStorage.setItem('allPatientPredictions', JSON.stringify(allPredictions));
      
      // Close modal and reset
      setShowPredictionModal(false);
      setSelectedPredictionType(null);
      setPredictionInputs({});
      
      // Show success message with risk level
      const riskEmoji = newPrediction.risk === 'high' ? '🔴' : newPrediction.risk === 'medium' ? '🟡' : '🟢';
      toast.success(`${riskEmoji} ${selectedPredictionType.charAt(0).toUpperCase() + selectedPredictionType.slice(1)} prediction: ${newPrediction.risk.toUpperCase()} risk (${newPrediction.probability}%)`);
      
      // Refresh patient data to get updated predictions from backend
      const patientIdForRefresh = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).patientId : 'demo-patient-id';
      const updatedData = await getPatientData(patientIdForRefresh);
      if (updatedData.predictions) {
        setPredictions(updatedData.predictions);
      }
    } catch (error: any) {
      console.error('Error creating prediction:', error);
      toast.error(`Failed to create prediction: ${error.message || 'Unknown error'}`);
    }
  };

  const getPredictionFields = (type: "heart" | "diabetes" | "kidney" | "sepsis") => {
    switch (type) {
      case "heart":
        return [
          { name: "age", label: "Age", type: "number", placeholder: "Enter age" },
          { name: "sex", label: "Sex", type: "select", options: ["Male", "Female"] },
          { name: "chestPainType", label: "Chest Pain Type", type: "select", options: ["Typical Angina", "Atypical Angina", "Non-anginal Pain", "Asymptomatic"] },
          { name: "restingBP", label: "Resting Blood Pressure (mm Hg)", type: "number", placeholder: "120" },
          { name: "cholesterol", label: "Cholesterol (mg/dl)", type: "number", placeholder: "200" },
          { name: "fastingSugar", label: "Fasting Blood Sugar > 120 mg/dl", type: "select", options: ["Yes", "No"] },
          { name: "ecg", label: "Resting ECG", type: "select", options: ["Normal", "ST-T Wave Abnormality", "Left Ventricular Hypertrophy"] },
          { name: "maxHeartRate", label: "Max Heart Rate", type: "number", placeholder: "150" },
          { name: "angina", label: "Exercise Induced Angina", type: "select", options: ["Yes", "No"] },
          { name: "stDepression", label: "ST Depression", type: "number", placeholder: "0.0", step: "0.1" },
          { name: "slope", label: "ST Slope", type: "select", options: ["Upsloping", "Flat", "Downsloping"] },
          { name: "vessels", label: "Number of Major Vessels (0-3)", type: "number", placeholder: "0" },
          { name: "thalassemia", label: "Thalassemia", type: "select", options: ["Normal", "Fixed Defect", "Reversible Defect"] }
        ];
      case "diabetes":
        return [
          { name: "pregnancies", label: "Number of Pregnancies", type: "number", placeholder: "0" },
          { name: "glucose", label: "Glucose Level (mg/dl)", type: "number", placeholder: "100" },
          { name: "bloodPressure", label: "Blood Pressure (mm Hg)", type: "number", placeholder: "80" },
          { name: "skinThickness", label: "Skin Thickness (mm)", type: "number", placeholder: "20" },
          { name: "insulin", label: "Insulin (mu U/ml)", type: "number", placeholder: "80" },
          { name: "bmi", label: "BMI", type: "number", placeholder: "25.0", step: "0.1" },
          { name: "diabetesPedigree", label: "Diabetes Pedigree Function", type: "number", placeholder: "0.5", step: "0.001" },
          { name: "age", label: "Age", type: "number", placeholder: "Enter age" }
        ];
      case "kidney":
        return [
          { name: "age", label: "Age", type: "number", placeholder: "50", required: true },
          { name: "bloodPressure", label: "Blood Pressure (mm Hg)", type: "number", placeholder: "80", required: true },
          { name: "albumin", label: "Albumin", type: "select", options: ["Normal", "Abnormal"], required: true },
          { name: "sugar", label: "Sugar", type: "select", options: ["Normal", "Abnormal"], required: true },
          { name: "redBloodCells", label: "Red Blood Cells", type: "select", options: ["Normal", "Abnormal"], required: true },
          { name: "pusCells", label: "Pus Cells", type: "select", options: ["Normal", "Abnormal"], required: true },
          { name: "hemoglobin", label: "Hemoglobin (g/dl)", type: "number", placeholder: "12.5", step: "0.1", required: true },
          { name: "creatinine", label: "Creatinine (mg/dl)", type: "number", placeholder: "1.2", step: "0.1", required: true },
          { name: "sodium", label: "Sodium (mEq/L)", type: "number", placeholder: "135", step: "0.1", required: true },
          { name: "potassium", label: "Potassium (mEq/L)", type: "number", placeholder: "4.5", step: "0.1", required: true },
          { name: "hypertension", label: "Hypertension", type: "select", options: ["Yes", "No"], required: true },
          { name: "diabetesHistory", label: "Diabetes History", type: "select", options: ["Yes", "No"], required: true }
        ];
      case "sepsis":
        return [
          { name: "hr", label: "Heart Rate (bpm)", type: "number", placeholder: "70" },
          { name: "map", label: "Mean Arterial Pressure (mm Hg)", type: "number", placeholder: "90" },
          { name: "o2sat", label: "O2 Saturation (%)", type: "number", placeholder: "98" },
          { name: "respRate", label: "Respiratory Rate (breaths/min)", type: "number", placeholder: "16" },
          { name: "temp", label: "Temperature (°F)", type: "number", placeholder: "98.6", step: "0.1" },
          { name: "wbc", label: "White Blood Cell Count (K/uL)", type: "number", placeholder: "10.0", step: "0.1" },
          { name: "hct", label: "Hematocrit (%)", type: "number", placeholder: "45", step: "0.1" },
          { name: "creatinine", label: "Creatinine (mg/dL)", type: "number", placeholder: "1.0", step: "0.1" },
          { name: "lactate", label: "Lactate (mmol/L)", type: "number", placeholder: "1.5", step: "0.1" },
          { name: "age", label: "Age", type: "number", placeholder: "Enter age" }
        ];
      default:
        return [];
    }
  };

  // Cart management functions
  const addToCart = (medicine: ShopMedicine) => {
    if (medicine.prescriptionRequired) {
      setPendingCartItem(medicine);
      setShowPrescriptionUploadForCart(true);
      return;
    }
    
    const existingItem = cart.find((item: any) => item.medicine.id === medicine.id);
    if (existingItem) {
      setCart(cart.map((item: any) => 
        item.medicine.id === medicine.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`${medicine.name} quantity increased in cart`);
    } else {
      setCart([...cart, { medicine, quantity: 1 }]);
      toast.success(`${medicine.name} added to cart`);
    }
    setShowMedicineDetail(false);
  };

  const handlePrescriptionUploadForCart = (e: any) => {
    const file = e.target.files?.[0];
    if (file && pendingCartItem) {
      // Simulate prescription verification
      toast.loading("Verifying prescription...");
      setTimeout(() => {
        if (isBuyNow) {
          // For Buy Now, replace cart with this single item
          setCart([{ medicine: pendingCartItem, quantity: 1, prescriptionUploaded: true }]);
          toast.dismiss();
          toast.success(`Prescription verified for ${pendingCartItem.name}`);
          setShowPrescriptionUploadForCart(false);
          setPendingCartItem(null);
          setIsBuyNow(false);
          setShowMedicineDetail(false);
          setShowCheckout(true);
        } else {
          // For regular Add to Cart
          const existingItem = cart.find((item: any) => item.medicine.id === pendingCartItem.id);
          if (existingItem) {
            setCart(cart.map((item: any) => 
              item.medicine.id === pendingCartItem.id 
                ? { ...item, quantity: item.quantity + 1, prescriptionUploaded: true }
                : item
            ));
          } else {
            setCart([...cart, { medicine: pendingCartItem, quantity: 1, prescriptionUploaded: true }]);
          }
          toast.dismiss();
          toast.success(`${pendingCartItem.name} added to cart with prescription`);
          setShowPrescriptionUploadForCart(false);
          setPendingCartItem(null);
          setShowMedicineDetail(false);
        }
      }, 1000);
    }
  };

  const updateCartQuantity = (medicineId: string, delta: number) => {
    setCart(cart.map((item: any) => {
      if (item.medicine.id === medicineId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter((item: any) => item.quantity > 0));
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter((item: any) => item.medicine.id !== medicineId));
  };

  const getCartTotal = () => {
    return cart.reduce((total: number, item: any) => total + (item.medicine.price * item.quantity), 0);
  };

  // Calculate expense totals dynamically by category
  const getExpensesByCategory = () => {
    const medicineTotal = expenses.filter((e: any) => e.category === 'Medicine').reduce((sum: number, e: any) => sum + e.amount, 0);
    const consultationTotal = expenses.filter((e: any) => e.category === 'Consultation').reduce((sum: number, e: any) => sum + e.amount, 0);
    const testTotal = expenses.filter((e: any) => e.category === 'Test').reduce((sum: number, e: any) => sum + e.amount, 0);
    const total = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    
    return { medicineTotal, consultationTotal, testTotal, total };
  };

  const handleCheckout = () => {
    const orderId = `ORD${Date.now()}`;
    const newOrder: Order = {
      id: orderId,
      items: [...cart],
      total: getCartTotal(),
      date: new Date().toISOString().split('T')[0],
      status: "Processing"
    };
    
    setOrders([newOrder, ...orders]);
    
    // Create delivery tracking
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 2);
    const newDelivery: DeliveryTracking = {
      orderId: orderId,
      status: "preparing",
      estimatedDelivery: estimatedDate.toISOString().split('T')[0],
      driverName: "",
      driverPhone: "",
      driverLocation: {
        lat: 40.7228,
        lng: -73.9960
      },
      progress: 25,
      statusHistory: [
        {
          status: "Order Placed",
          timestamp: new Date().toLocaleString(),
          location: "Health Sync Pharmacy"
        },
        {
          status: "Preparing Package",
          timestamp: new Date().toLocaleString(),
          location: "Health Sync Pharmacy"
        }
      ]
    };
    setActiveDeliveries([newDelivery, ...activeDeliveries]);
    
    // Update expenses (store as USD number for dynamic conversion)
    const newExpense = {
      name: `Medicine Purchase (${cart.length} items)`,
      amount: getCartTotal(), // Store as number
      date: formatAppointmentDate(new Date().toISOString().split('T')[0]),
      category: "Medicine"
    };
    setExpenses([newExpense, ...expenses]);
    
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
    toast.success("Order placed successfully! Track your delivery in Buy Medicines.");
    setActiveTab("buyMedicines");
  };

  // Filter medicines based on search and filters
  const filteredMedicines = shopMedicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || medicine.category === selectedCategory;
    const matchesPrescription = prescriptionRequiredFilter === "all" || 
                               (prescriptionRequiredFilter === "prescription" && medicine.prescriptionRequired) ||
                               (prescriptionRequiredFilter === "otc" && !medicine.prescriptionRequired);
    return matchesSearch && matchesCategory && matchesPrescription;
  });

  const buyActiveMedicine = (medicineName: string) => {
    const shopMedicine = shopMedicines.find(m => 
      m.name.toLowerCase() === medicineName.toLowerCase() ||
      m.genericName.toLowerCase() === medicineName.toLowerCase()
    );
    
    if (shopMedicine) {
      setSelectedShopMedicine(shopMedicine);
      setShowMedicineDetail(true);
      setActiveTab("buyMedicines");
    } else {
      setActiveTab("buyMedicines");
      setSearchQuery(medicineName);
    }
  };

  // Dark mode utility classes
  const bgPrimary = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const bgSecondary = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textTertiary = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const border = '';
  const borderHover = '';
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
  const inputBg = isDarkMode ? 'bg-gray-700' : 'bg-white';
  const menuHover = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50';

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1
            className={`text-2xl uppercase tracking-wide ${textPrimary}`}
            style={{
              fontFamily: "'Doto', sans-serif",
              fontWeight: "785",
              letterSpacing: "0.05em",
            }}
          >
            HEALTH SYNC
          </h1>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`text-sm uppercase tracking-wide transition-all px-3 py-1.5 rounded-lg ${
                activeTab === "dashboard" 
                  ? isDarkMode 
                    ? 'text-white' 
                    : 'text-black'
                  : `${textTertiary} ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`
              }`}
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600", fontSize: "0.875rem" }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("prescriptions")}
              className={`text-sm uppercase tracking-wide transition-all px-3 py-1.5 rounded-lg ${
                activeTab === "prescriptions" 
                  ? isDarkMode 
                    ? 'text-white' 
                    : 'text-black'
                  : `${textTertiary} ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`
              }`}
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600", fontSize: "0.875rem" }}
            >
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`text-sm uppercase tracking-wide transition-all px-3 py-1.5 rounded-lg ${
                activeTab === "profile" 
                  ? isDarkMode 
                    ? 'text-white' 
                    : 'text-black'
                  : `${textTertiary} ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`
              }`}
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600", fontSize: "0.875rem" }}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("buyMedicines")}
              className={`text-sm uppercase tracking-wide transition-all px-3 py-1.5 rounded-lg ${
                activeTab === "buyMedicines" 
                  ? isDarkMode 
                    ? 'text-white' 
                    : 'text-black'
                  : `${textTertiary} ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`
              }`}
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600", fontSize: "0.875rem" }}
            >
              Buy Medicines
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className={`relative p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <ShoppingCart className={`w-5 h-5 ${textPrimary}`} />
              {cart.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  {cart.length}
                </span>
              )}
            </button>

            {/* Bell/Notification Button */}
            <button
              onClick={() => setShowNotificationPopup(true)}
              className={`relative p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              aria-label="Notifications"
            >
              <Bell className={`w-5 h-5 ${textPrimary}`} />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center bg-yellow-500 text-white" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Menu Dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <Menu className={`w-5 h-5 ${textPrimary}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-xl py-2 z-50 ${bgPrimary}`}
                  >
                    <button
                      onClick={() => {
                        setActiveTab("vitals");
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <Activity className="w-4 h-4" />
                      <span>Vitals Tracking</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("appointments");
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Appointments</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("hospitals");
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Nearby Hospitals</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("documents");
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Documents</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("family");
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <Users className="w-4 h-4" />
                      <span>Family Members</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("expenses");
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Expenses</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("predictions");
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <Activity className="w-4 h-4" />
                      <span>Health Predictions</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("medicalRecords");
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <Folder className="w-4 h-4" />
                      <span>Medical Records</span>
                      {medicalRecords.length > 0 && (
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                          {medicalRecords.length}
                        </span>
                      )}
                    </button>
                    {pastDeliveries.length > 0 && (
                      <button
                        onClick={() => {
                          setActiveTab("buyMedicines");
                          setShowMenu(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        <Package className="w-4 h-4" />
                        <span>Past Deliveries ({pastDeliveries.length})</span>
                      </button>
                    )}
                    <div className={`h-px my-2 ${border}`}></div>
                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textPrimary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setShowMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${menuHover} transition-colors flex items-center gap-3 ${textSecondary}`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu Sidebar */}
        <AnimatePresence>
          {showMobileMenu && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileMenu(false)}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
              />
              {/* Sidebar */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-1/3 min-w-[280px] max-w-[400px] bg-white shadow-2xl z-50 md:hidden overflow-y-auto"
              >
              <div className="p-4 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors ${
                    activeTab === "dashboard" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveTab("prescriptions");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors ${
                    activeTab === "prescriptions" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Prescriptions
                </button>
                <button
                  onClick={() => {
                    setActiveTab("notifications");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors relative ${
                    activeTab === "notifications" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Notifications
                  {alerts.length > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      {alerts.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors ${
                    activeTab === "profile" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    setActiveTab("buyMedicines");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "buyMedicines" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Buy Medicines</span>
                  {cart.length > 0 && (
                    <span className="ml-auto bg-black text-white px-2 py-0.5 rounded-full text-xs">
                      {cart.length}
                    </span>
                  )}
                </button>
                <div className="h-px bg-gray-200 my-2"></div>
                <button
                  onClick={() => {
                    setActiveTab("vitals");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "vitals" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <Activity className="w-4 h-4" />
                  <span>Vitals Tracking</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("appointments");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "appointments" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Appointments</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("hospitals");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "hospitals" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Nearby Hospitals</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("documents");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "documents" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <FileText className="w-4 h-4" />
                  <span>Documents</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("family");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "family" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <Users className="w-4 h-4" />
                  <span>Family Members</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("expenses");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "expenses" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Expenses</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("predictions");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "predictions" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <Activity className="w-4 h-4" />
                  <span>Health Predictions</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("medicalRecords");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "medicalRecords" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <Folder className="w-4 h-4" />
                  <span>Medical Records</span>
                  {medicalRecords.length > 0 && (
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
                      activeTab === "medicalRecords" ? "bg-white text-black" : "bg-black text-white"
                    }`}>
                      {medicalRecords.length}
                    </span>
                  )}
                </button>
                <div className="h-px bg-gray-200 my-2"></div>
                <button
                  className="w-full px-4 py-3 text-left text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <div className="h-px bg-gray-200 my-2"></div>
                
                <button
                  onClick={() => {
                    onLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Welcome Section */}
              <div>
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Welcome Back, {(() => {
                    // Always prioritize the actual logged-in user's name from localStorage
                    // to avoid showing seed/test data like "John Doe"
                    try {
                      const userStr = localStorage.getItem('user');
                      if (userStr) {
                        const user = JSON.parse(userStr);
                        if (user && user.name && user.name.trim() && user.name !== 'John Doe') {
                          return user.name;
                        }
                      }
                    } catch (e) {
                      console.log('Error reading user from localStorage:', e);
                    }
                    
                    // Fallback to profileData.fullName if it's not "John Doe"
                    if (profileData && profileData.fullName && profileData.fullName.trim() && profileData.fullName !== 'John Doe') {
                      return profileData.fullName;
                    }
                    
                    // If profileData has "John Doe", try localStorage again as it's more reliable
                    try {
                      const userStr = localStorage.getItem('user');
                      if (userStr) {
                        const user = JSON.parse(userStr);
                        if (user && user.name && user.name.trim()) {
                          return user.name;
                        }
                      }
                    } catch (e) {
                      console.log('Error reading user from localStorage:', e);
                    }
                    
                    return 'Patient';
                  })()}
                </h2>
                <p className="text-gray-500 text-sm">Here's your health overview for today</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUploadModal(true)}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 flex flex-col items-center gap-3 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Upload
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowManualEntry(true)}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 flex flex-col items-center gap-3 hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20"
                >
                  <FileText className="w-8 h-8" />
                  <span className="text-sm uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Manual Entry
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowBookAppointmentModal(true)}
                  className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 flex flex-col items-center gap-3 hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/20"
                >
                  <Calendar className="w-8 h-8" />
                  <span className="text-sm uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Book Appointment
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("buyMedicines")}
                  className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-2xl p-6 flex flex-col items-center gap-3 hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg shadow-yellow-500/20"
                >
                  <ShoppingCart className="w-8 h-8" />
                  <span className="text-sm uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Buy Medicines
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPredictionModal(true)}
                  className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 flex flex-col items-center gap-3 hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20"
                >
                  <Activity className="w-8 h-8" />
                  <span className="text-sm uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Predict Disease
                  </span>
                </motion.button>
              </div>

              {/* Active Medicines */}
              <div>
                <button
                  onClick={() => setActiveTab("prescriptions")}
                  className="flex items-center justify-between mb-4 w-full group"
                >
                  <h3 className="text-xl group-hover:text-gray-600 transition-colors" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Active Medications
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {medicines.filter((m) => !m.completed).length} active
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                  </div>
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {medicines
                    .filter((m) => !m.completed)
                    .slice(0, 2)
                    .map((medicine) => (
                      <motion.div
                        key={medicine.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`${cardBg} rounded-2xl p-6 transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                              <Pill className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                            </div>
                            <div>
                              <h4 className={`font-semibold ${textPrimary}`}>{medicine.name}</h4>
                              <p className={`text-sm ${textTertiary}`}>{medicine.dosage}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleReminder(medicine.id)}
                            className={`px-1 py-1.5 rounded-lg transition-colors ${
                              medicine.reminderEnabled
                                ? isDarkMode ? "bg-white text-black" : "bg-black text-white"
                                : isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {medicine.reminderEnabled ? (
                              <Bell className="w-3.5 h-3.5" />
                            ) : (
                              <BellOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className={textSecondary}>Frequency:</span>
                            <span className={`font-medium ${textPrimary}`}>{medicine.frequency}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={textSecondary}>Duration:</span>
                            <span className={`font-medium ${textPrimary}`}>{medicine.duration}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Days Remaining:</span>
                            <span className={`font-medium px-2 py-1 rounded-lg ${
                              medicine.remainingDays <= 3 
                                ? 'bg-red-100 text-red-700' 
                                : medicine.remainingDays <= 7 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>{medicine.remainingDays} days</span>
                          </div>
                        </div>

                        <button
                          onClick={() => buyActiveMedicine(medicine.name)}
                          className="w-full mt-4 bg-blue-400 text-white py-2 rounded-lg text-sm uppercase tracking-wide hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Buy Now
                        </button>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Vitals */}
              <div>
                <button
                  onClick={() => setActiveTab("vitals")}
                  className="flex items-center gap-2 mb-4 group"
                >
                  <h3 className="text-xl group-hover:text-gray-600 transition-colors" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Current Vitals
                  </h3>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                </button>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {vitals.map((vital, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${cardBg} rounded-2xl p-4 text-center`}
                    >
                      <vital.icon className={`w-8 h-8 mx-auto mb-2 ${
                        vital.type === "Heart Rate" ? "text-red-500" :
                        vital.type === "Temperature" ? "text-yellow-500" :
                        vital.type === "Weight" ? "text-purple-500" :
                        vital.type === "Blood Sugar" ? "text-green-500" :
                        vital.type === "Blood Pressure" ? "text-blue-500" :
                        textPrimary
                      }`} />
                      <p className={`text-xs mb-1 ${textTertiary}`}>{vital.type}</p>
                      <p className={`text-lg font-semibold ${textPrimary}`}>
                        {vital.value}
                        <span className={`text-xs ml-1 ${textTertiary}`}>{vital.unit}</span>
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                          vital.status === "normal"
                            ? "bg-green-100 text-green-700"
                            : vital.status === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {vital.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Appointments */}
                <div>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className="flex items-center gap-2 mb-4 group"
                  >
                    <h3 className="text-xl group-hover:text-gray-600 transition-colors" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Upcoming Appointments
                    </h3>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                  </button>
                  <div className="space-y-3">
                    {appointments.slice(0, 2).map((apt) => (
                      <motion.div
                        key={apt.id}
                        whileHover={{ scale: 1.01 }}
                        className={`${cardBg} rounded-2xl p-4 transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className={`font-semibold ${textPrimary}`}>{apt.doctor}</h4>
                            <p className={`text-sm ${textTertiary}`}>{apt.specialty}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs uppercase ${
                                apt.type === "emergency"
                                  ? "bg-red-100 text-red-700"
                                  : apt.type === "followup"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {apt.type}
                            </span>
                            {apt.status && (
                              <span
                                className={`px-2 py-1 rounded-lg text-xs uppercase ${
                                  apt.status === "accepted"
                                    ? "bg-green-100 text-green-700"
                                    : apt.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                              >
                                {apt.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 text-sm mb-1 ${textSecondary}`}>
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatAppointmentDate(apt.date)}
                            {apt.time !== "Immediate" && ` at ${apt.time}`}
                            {apt.time === "Immediate" && (
                              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs uppercase" style={{ fontWeight: "600" }}>
                                Immediate
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{apt.hospital}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Nearest Hospitals */}
                <div>
                  <button
                    onClick={() => setActiveTab("hospitals")}
                    className="flex items-center gap-2 mb-4 group"
                  >
                    <h3 className="text-xl group-hover:text-gray-600 transition-colors" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Nearest Hospitals
                    </h3>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                  </button>
                  <div className="space-y-3">
                    {nearestHospitals.slice(0, 3).map((hospital, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        className={`${cardBg} rounded-2xl p-4 flex items-center justify-between transition-colors`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                            <MapPin className={`w-5 h-5 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                          </div>
                          <div>
                            <h4 className={`font-semibold text-sm ${textPrimary}`}>{hospital.name}</h4>
                            <p className={`text-xs ${textTertiary}`}>{hospital.distance} away</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hospital.emergency && (
                            <span className="px-2 py-1 rounded-lg text-xs uppercase bg-yellow-500 text-black">
                              24/7
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setSelectedHospital(hospital.name);
                              setShowBookAppointmentModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium whitespace-nowrap bg-red-400 text-white hover:bg-red-500"
                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                          >
                            Book
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Emergency Numbers */}
                  <div className="mt-6 bg-red-50 rounded-2xl p-4">
                    <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      <Phone className="w-4 h-4 text-red-600" />
                      Emergency Numbers
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-red-700" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "400" }}>Ambulance:</span>
                        <a href="tel:911" className="font-semibold text-red-600 hover:underline" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                          911
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "400" }}>Hospital Direct:</span>
                        <a href="tel:+1234567890" className="font-semibold text-red-600 hover:underline" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                          +1 234-567-890
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expenses Overview */}
              <div className="bg-purple-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setActiveTab("expenses")}
                    className="flex items-center gap-2 group"
                  >
                    <h3 className="text-xl text-purple-600 group-hover:text-purple-700 transition-colors" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      This Month's Expenses
                    </h3>
                    <ArrowUpRight className="w-5 h-5 text-purple-500 group-hover:text-purple-600 transition-colors" />
                  </button>
                  <DollarSign className="w-6 h-6 text-purple-500" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-purple-600 mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Medicines</p>
                    <p className="text-2xl text-purple-600" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      {convertCurrency(getExpensesByCategory().medicineTotal, selectedCurrency).split('.')[0]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Consultations</p>
                    <p className="text-2xl text-purple-600" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      {convertCurrency(getExpensesByCategory().consultationTotal, selectedCurrency).split('.')[0]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Tests</p>
                    <p className="text-2xl text-purple-600" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      {convertCurrency(getExpensesByCategory().testTotal, selectedCurrency).split('.')[0]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Total</p>
                    <p className="text-2xl text-purple-600" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      {convertCurrency(getExpensesByCategory().total, selectedCurrency).split('.')[0]}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "prescriptions" && (
            <motion.div
              key="prescriptions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Prescriptions & Medications
                </h2>
                <p className="text-gray-500 text-sm">Manage your prescriptions and treatment history</p>
              </div>

              {/* Today's Doses */}
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                
                const todaysDoses = medicines
                  .filter(m => !m.completed)
                  .flatMap(med => 
                    med.times.map(time => ({
                      medicine: med,
                      time: time,
                      taking: med.takings.find(t => t.date === today && t.time === time)
                    }))
                  )
                  .filter(dose => hasMedicineTimePassed(dose.time) && !dose.taking?.taken);

                if (todaysDoses.length === 0) return null;

                return (
                  <div className={`${cardBg} rounded-2xl p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>
                      Today's Pending Doses
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {todaysDoses.map((dose, idx) => (
                        <div key={idx} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                              <Pill className={`w-5 h-5 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold ${textPrimary}`}>{dose.medicine.name}</h4>
                              <p className={`text-sm ${textSecondary}`}>{dose.medicine.dosage} • {dose.time}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMarkMedicineAsTaken(dose.medicine.id, today, dose.time)}
                              className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                            >
                              ✓ Mark Taken
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* All Medicines */}
              <div className="space-y-4">
                {medicines
                  .filter(m => !m.completed)
                  .sort((a, b) => {
                    // Sort by remaining days (upcoming medicines first)
                    return a.remainingDays - b.remainingDays;
                  })
                  .concat(medicines.filter(m => m.completed))
                  .map((medicine) => (
                  <motion.div
                    key={medicine.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`rounded-2xl p-6 ${
                      medicine.completed
                        ? isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        : bgPrimary
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          medicine.completed ? isDarkMode ? "bg-gray-600" : "bg-gray-700" : isDarkMode ? "bg-white" : "bg-black"
                        }`}>
                          {medicine.completed ? (
                            <CheckCircle className={`w-7 h-7 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                          ) : (
                            <Pill className={`w-7 h-7 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`text-xl font-semibold ${textPrimary}`}>{medicine.name}</h3>
                            {medicine.completed && (
                              <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-700 text-white'}`}>
                                Completed
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className={textTertiary}>Dosage</p>
                              <p className={`font-medium ${textPrimary}`}>{medicine.dosage}</p>
                            </div>
                            <div>
                              <p className={textTertiary}>Frequency</p>
                              <p className={`font-medium ${textPrimary}`}>{medicine.frequency}</p>
                            </div>
                            <div>
                              <p className={textTertiary}>Duration</p>
                              <p className={`font-medium ${textPrimary}`}>{medicine.duration}</p>
                            </div>
                            <div>
                              <p className={textTertiary}>Days Left</p>
                              <p className={`font-medium px-2 py-1 rounded-lg inline-block ${
                                medicine.remainingDays <= 3 
                                  ? 'bg-red-100 text-red-700' 
                                  : medicine.remainingDays <= 7 
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>{medicine.remainingDays}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!medicine.completed && (
                          <button
                            onClick={() => toggleReminder(medicine.id)}
                            className={`px-1.5 py-2 rounded-lg transition-colors ${
                              medicine.reminderEnabled
                                ? isDarkMode ? "bg-white text-black" : "bg-black text-white"
                                : isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {medicine.reminderEnabled ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const shopMedicine = shopMedicines.find(m => 
                              m.name.toLowerCase() === medicine.name.toLowerCase() ||
                              m.genericName.toLowerCase() === medicine.name.toLowerCase()
                            );
                            if (shopMedicine) {
                              if (shopMedicine.requiresPrescription) {
                                setIsBuyNow(true);
                                setPendingCartItem(shopMedicine);
                                setShowPrescriptionUploadForCart(true);
                              } else {
                                setCart([{ medicine: shopMedicine, quantity: 1 }]);
                                setShowCheckout(true);
                              }
                            } else {
                              setActiveTab("buyMedicines");
                            }
                          }}
                          className="px-4 py-2 rounded-lg transition-colors text-xs font-medium whitespace-nowrap bg-blue-400 text-white hover:bg-blue-500"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Last Month History */}
              <div>
                <h3 className="text-xl mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Last Month History
                </h3>
                <div className="bg-white rounded-3xl p-6 space-y-4">
                  {medicines && medicines.length > 0 ? medicines
                    .filter(m => !m.completed)
                    .map(medicine => {
                      // DYNAMIC CALCULATION: Works with any database data structure
                      // Calculates last 30 days dynamically from current date
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Normalize to midnight for consistent date comparison
                      
                      const last30Days: { date: string; taken: boolean; count: number; takenCount: number }[] = [];
                      
                      // Loop through last 30 days dynamically
                      for (let i = 29; i >= 0; i--) {
                        const date = new Date(today);
                        date.setDate(date.getDate() - i);
                        const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                        
                        // Filter takings for this specific date - works with any database structure
                        // Ensure medicine.takings exists and is an array (database safety)
                        const dayTakings = (medicine.takings || []).filter(t => t && t.date === dateStr);
                        const takenCount = dayTakings.filter(t => t.taken === true).length;
                        const totalCount = dayTakings.length;
                        
                        last30Days.push({
                          date: dateStr,
                          taken: takenCount === totalCount && totalCount > 0,
                          count: totalCount, // Total scheduled doses for this day (from database)
                          takenCount: takenCount // How many were actually taken (from database)
                        });
                      }
                      
                      // DYNAMIC ADHERENCE CALCULATION
                      // Only counts days where doses were actually scheduled (not all 30 days)
                      // This ensures weekly meds (Vitamin D3) get 100% if taken correctly
                      const scheduledDays = last30Days.filter(d => d.count > 0);
                      const fullyTakenDays = scheduledDays.filter(d => d.taken).length;
                      const adherenceRate = scheduledDays.length > 0 ? (fullyTakenDays / scheduledDays.length * 100) : 0;
                      
                      return (
                        <div key={medicine.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                                {medicine.name}
                              </h4>
                              <p className="text-sm text-gray-500">{medicine.dosage} • {medicine.frequency}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700", color: adherenceRate >= 80 ? '#10b981' : adherenceRate >= 60 ? '#f59e0b' : '#ef4444' }}>
                                {adherenceRate.toFixed(0)}%
                              </div>
                              <p className="text-xs text-gray-500">Adherence</p>
                            </div>
                          </div>
                          
                          {/* 30 day grid - DYNAMIC RENDERING */}
                          <div className="flex gap-1 flex-wrap">
                            {last30Days.map((day, idx) => {
                              // Dynamic status calculation based on database values
                              const isPartial = day.count > 0 && day.takenCount > 0 && !day.taken;
                              const isMissed = day.count > 0 && day.takenCount === 0;
                              const isNotScheduled = day.count === 0;
                              
                              // Dynamic color based on actual status from database
                              const backgroundColor = day.taken ? '#3B82F6' : // Blue: All doses taken
                                                     isPartial ? '#FCD34D' : // Yellow: Some doses taken
                                                     isMissed ? '#EF4444' :  // Red: No doses taken (but scheduled)
                                                     '#E5E7EB';              // Grey: Not scheduled
                              
                              return (
                                <motion.div
                                  key={`${medicine.id}-${day.date}`} // Unique key for database compatibility
                                  whileHover={{ scale: 1.2 }}
                                  className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer"
                                  style={{ backgroundColor }}
                                  title={`${day.date}: ${day.taken ? `Taken (${day.takenCount}/${day.count})` : isPartial ? `Partial (${day.takenCount}/${day.count})` : isMissed ? `Missed (0/${day.count})` : 'Not Scheduled'}`}
                                >
                                  <span className="text-xs font-medium" style={{ color: day.count > 0 ? 'white' : '#9CA3AF' }}>
                                    {new Date(day.date).getDate()}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No active medications to track</p>
                      <p className="text-sm mt-2">Upload a prescription to get started</p>
                    </div>
                  )}
                  
                  {/* Legend - Only show if there are medicines */}
                  {medicines && medicines.filter(m => !m.completed).length > 0 && (
                    <div className="flex items-center gap-4 pt-4 border-t text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#3B82F6' }}></div>
                        <span>Taken</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#FCD34D' }}></div>
                        <span>Partial</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#EF4444' }}></div>
                        <span>Missed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#E5E7EB' }}></div>
                        <span>Not Scheduled</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Notifications
                </h2>
                <p className="text-gray-500 text-sm">Manage your alerts and reminders</p>
              </div>

              {/* Alerts */}
              {alerts.length > 0 && (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-2xl p-4 ${
                        alert.icon === Pill 
                          ? "bg-red-100" 
                          : (alert.type === "warning" || alert.type === "info")
                          ? "bg-yellow-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <alert.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          alert.icon === Pill ? "text-red-700" : (alert.type === "warning" || alert.type === "info") ? "text-yellow-700" : "text-gray-700"
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm ${
                            alert.icon === Pill ? "text-red-900" : (alert.type === "warning" || alert.type === "info") ? "text-yellow-900" : "text-gray-900"
                          }`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>{alert.message}</p>
                          
                          {alert.type === "reminder" && alert.medicineId && alert.date && alert.time && (
                            <div className="mt-3">
                              <button
                                onClick={() => {
                                  handleMarkMedicineAsTaken(alert.medicineId!, alert.date!, alert.time!);
                                  setAlerts(alerts.filter(a => a.id !== alert.id));
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                              >
                                ✓ Mark Taken
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "vitals" && (
            <motion.div
              key="vitals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="pb-4">
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Vitals Tracking
                </h2>
                <p className="text-gray-500 text-sm">Monitor your health metrics and trends</p>
              </div>

              {/* Current Vitals Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {vitals.map((vital, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-2xl p-4 text-center hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <vital.icon className={`w-8 h-8 mx-auto mb-2 ${
                      vital.type === "Heart Rate" ? "text-red-500" :
                      vital.type === "Temperature" ? "text-yellow-500" :
                      vital.type === "Weight" ? "text-purple-500" :
                      vital.type === "Blood Sugar" ? "text-green-500" :
                      vital.type === "Blood Pressure" ? "text-blue-500" :
                      "text-black"
                    }`} />
                    <p className="text-xs text-gray-500 mb-1">{vital.type}</p>
                    <p className="text-lg font-semibold">
                      {vital.value}
                      <span className="text-xs text-gray-400 ml-1">{vital.unit}</span>
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                        vital.status === "normal"
                          ? "bg-gray-200 text-gray-700"
                          : vital.status === "warning"
                          ? "bg-gray-300 text-gray-800"
                          : "bg-black text-white"
                      }`}
                    >
                      {vital.status}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Heart Rate Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl p-6 ${bgPrimary}`}
              >
                <div className="flex items-center justify-between mb-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                        Heart Rate
                      </h3>
                      <p className="text-sm text-gray-500">Last 7 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-semibold">Optimal</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={heartRateHistory}>
                    <defs>
                      <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} domain={[60, 80]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fill="url(#heartRateGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Blood Pressure Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-2xl p-6 ${bgPrimary}`}
              >
                <div className="flex items-center justify-between mb-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                        Blood Pressure
                      </h3>
                      <p className="text-sm text-gray-500">Systolic / Diastolic - Last 7 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-semibold">Normal</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={bloodPressureHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} domain={[70, 130]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="systolic" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      name="Systolic"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke="#60a5fa" 
                      strokeWidth={2}
                      dot={{ fill: '#60a5fa', r: 4 }}
                      name="Diastolic"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Temperature & Blood Sugar - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Temperature Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`rounded-2xl p-6 ${bgPrimary}`}
                >
                  <div className="flex items-center justify-between mb-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                        <Thermometer className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                          Temperature
                        </h3>
                        <p className="text-sm text-gray-500">Last 7 days</p>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={temperatureHistory}>
                      <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} domain={[98, 99]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#eab308" 
                        strokeWidth={2}
                        fill="url(#tempGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Blood Sugar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`rounded-2xl p-6 ${bgPrimary}`}
                >
                  <div className="flex items-center justify-between mb-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                        <Droplet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                          Blood Sugar
                        </h3>
                        <p className="text-sm text-gray-500">Fasting - Last 7 days</p>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={bloodSugarHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} domain={[85, 100]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Weight Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`rounded-2xl p-6 ${bgPrimary}`}
              >
                <div className="flex items-center justify-between mb-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                      <Weight className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                        Weight Trend
                      </h3>
                      <p className="text-sm text-gray-500">Last 6 weeks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-sm font-semibold">-1.2 kg</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weightHistory}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} domain={[74, 77]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      fill="url(#weightGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* History Records */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6 pb-4">
                  <History className="w-6 h-6" />
                  <h3 className="text-xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Recent History
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    { date: "Today, 8:00 AM", type: "Heart Rate", value: "72 bpm", status: "Normal" },
                    { date: "Today, 8:00 AM", type: "Blood Pressure", value: "120/80 mmHg", status: "Normal" },
                    { date: "Yesterday, 8:00 AM", type: "Weight", value: "75.0 kg", status: "On Track" },
                    { date: "Yesterday, 8:00 AM", type: "Blood Sugar", value: "95 mg/dL", status: "Normal" },
                    { date: "2 days ago, 8:00 AM", type: "Temperature", value: "98.6 °F", status: "Normal" },
                  ].map((record, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm">{record.type}</p>
                        <p className="text-xs text-gray-500">{record.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{record.value}</p>
                        <p className="text-xs text-gray-500">{record.status}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "appointments" && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Appointments
                </h2>
                <p className="text-gray-500 text-sm">Manage your upcoming appointments</p>
              </div>

              {/* Upcoming Appointments */}
              <div>
                <h3 className="text-xl mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Upcoming Appointments
                </h3>
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <motion.div
                      key={apt.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gray-50 rounded-2xl p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{apt.doctor}</h4>
                          <p className="text-sm text-gray-500">{apt.specialty}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs uppercase ${
                              apt.type === "emergency"
                                ? "bg-red-100 text-red-700"
                                : apt.type === "followup"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {apt.type}
                          </span>
                          {apt.status && (
                            <span
                              className={`px-2 py-1 rounded-lg text-xs uppercase ${
                                apt.status === "accepted"
                                  ? "bg-green-100 text-green-700"
                                  : apt.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                            >
                              {apt.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatAppointmentDate(apt.date)}
                          {apt.time !== "Immediate" && ` at ${apt.time}`}
                          {apt.time === "Immediate" && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs uppercase" style={{ fontWeight: "600" }}>
                              Immediate
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{apt.hospital}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "hospitals" && (
            <motion.div
              key="hospitals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Hospitals
                </h2>
                <p className="text-gray-500 text-sm">Find nearby hospitals</p>
              </div>

              {/* Loading State */}
              {isLoadingHospitals && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Finding nearby hospitals...</span>
                  </div>
                </div>
              )}

              {/* Location Error */}
              {locationError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <p className="text-yellow-800 text-sm">{locationError}</p>
                </div>
              )}

              {/* Nearest Hospitals List */}
              {!isLoadingHospitals && nearestHospitals.length > 0 && (
                <div>
                  <h3 className="text-xl mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Nearest Hospitals
                  </h3>
                  <div className="space-y-3">
                    {nearestHospitals.map((hospital, index) => (
                      <motion.div
                        key={hospital.id || index}
                        whileHover={{ scale: 1.01 }}
                        className={`bg-gray-50 rounded-2xl p-4 transition-colors cursor-pointer ${
                          selectedHospitalForMap?.id === hospital.id ? "ring-2 ring-red-400" : ""
                        }`}
                        onClick={() => setSelectedHospitalForMap(hospital)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm">{hospital.name}</h4>
                              <p className="text-xs text-gray-500">{hospital.distanceFormatted || hospital.distance} away</p>
                              {hospitalRoutes['driving-car'] && selectedHospitalForMap?.id === hospital.id && (
                                <p className="text-xs text-blue-600 mt-1">
                                  🚗 {hospitalRoutes['driving-car'].duration} min • {hospitalRoutes['driving-car'].distance.toFixed(1)} km
                                </p>
                              )}
                            </div>
                          </div>
                          {hospital.emergency && (
                            <span className="bg-yellow-500 text-black px-2 py-1 rounded-lg text-xs uppercase">
                              24/7
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHospitalForBooking(hospital);
                            setActiveTab("appointments");
                            setShowBookAppointmentModal(true);
                          }}
                          className="w-auto px-6 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors text-sm font-medium"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          Book Appointment
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map Section */}
              {!isLoadingHospitals && userLocation && nearestHospitals.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Route to Hospital
                  </h3>
                  <div className="relative h-[500px] w-full rounded-2xl overflow-hidden border border-gray-200">
                    <MapContainer
                      center={[userLocation.latitude, userLocation.longitude]}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />

                      {/* User Location Marker */}
                      <Marker position={[userLocation.latitude, userLocation.longitude]}>
                        <Popup>Your Location</Popup>
                      </Marker>

                      {/* Hospital Markers */}
                      {nearestHospitals.map((hospital) => (
                        <Marker
                          key={hospital.id}
                          position={[hospital.lat, hospital.lng]}
                          icon={hospitalIcon}
                          eventHandlers={{
                            click: () => setSelectedHospitalForMap(hospital),
                          }}
                        >
                          <Popup>{hospital.name}</Popup>
                        </Marker>
                      ))}

                      {/* Route Polyline */}
                      {selectedHospitalForMap && hospitalRoutes['driving-car']?.coords && (
                        <>
                          <Polyline
                            positions={hospitalRoutes['driving-car'].coords}
                            color="blue"
                            weight={4}
                            opacity={0.7}
                          />
                          <RouteHandler
                            routeCoords={hospitalRoutes['driving-car'].coords}
                            selectedHospital={selectedHospitalForMap}
                          />
                        </>
                      )}
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Emergency Numbers */}
              <div className="mt-6 bg-red-50 rounded-2xl p-4">
                <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                  <Phone className="w-4 h-4 text-red-600" />
                  Emergency Numbers
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "400" }}>Ambulance:</span>
                    <a href="tel:102" className="font-semibold text-red-600 hover:underline" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      102
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "400" }}>Emergency:</span>
                    <a href="tel:108" className="font-semibold text-red-600 hover:underline" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      108
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    My Profile
                  </h2>
                  <p className="text-gray-500 text-sm">Manage your personal information</p>
                </div>
                <button
                  onClick={() => setShowProfileEdit(!showProfileEdit)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Edit
                  </span>
                </button>
              </div>

              {/* Personal Info */}
              <div className={`${cardBg} rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Personal Information</h3>
                {!showProfileEdit ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Full Name</p>
                      <p className="font-medium">{profileData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
                      <p className="font-medium">{profileData.dob}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Blood Group</p>
                      <p className="font-medium">{profileData.bloodGroup}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Gender</p>
                      <p className="font-medium">{profileData.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium">{profileData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="font-medium">{profileData.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Address</p>
                      <p className="font-medium">{profileData.address}</p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      setProfileData({
                        fullName: formData.get('fullName') as string,
                        dob: formData.get('dob') as string,
                        bloodGroup: formData.get('bloodGroup') as string,
                        gender: formData.get('gender') as string,
                        email: formData.get('email') as string,
                        phone: formData.get('phone') as string,
                        address: formData.get('address') as string
                      });
                      setShowProfileEdit(false);
                      toast.success("Profile updated successfully");
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        defaultValue={profileData.fullName}
                        required
                        className="w-full px-4 py-2 rounded-lg outline-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Date of Birth</label>
                      <input
                        type="text"
                        name="dob"
                        defaultValue={profileData.dob}
                        required
                        className="w-full px-4 py-2 rounded-lg outline-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Blood Group</label>
                      <input
                        type="text"
                        name="bloodGroup"
                        defaultValue={profileData.bloodGroup}
                        required
                        className="w-full px-4 py-2 rounded-lg outline-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Gender</label>
                      <input
                        type="text"
                        name="gender"
                        defaultValue={profileData.gender}
                        required
                        className="w-full px-4 py-2 rounded-lg outline-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={profileData.email}
                        required
                        className="w-full px-4 py-2 rounded-lg outline-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={profileData.phone}
                        required
                        className="w-full px-4 py-2 rounded-lg outline-none bg-gray-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-gray-700">Address</label>
                      <textarea
                        name="address"
                        defaultValue={profileData.address}
                        required
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg outline-none resize-none bg-gray-50"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowProfileEdit(false)}
                        className="flex-1 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Family Members */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setActiveTab("family")}
                    className="flex items-center gap-2 group"
                  >
                    <h3 className="text-lg font-semibold group-hover:text-gray-600 transition-colors">Family Members</h3>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                  </button>
                  <button 
                    onClick={() => setShowAddFamilyModal(true)}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-600 transition-colors"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Member
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{member.name}</h4>
                        <p className="text-sm text-gray-500">
                          {member.relation}, {member.age} years • {member.bloodGroup}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medical History */}
              <div className={`${cardBg} rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Medical History</h3>
                  <button 
                    onClick={() => setShowMedicalHistoryModal(true)}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-600 transition-colors"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Condition
                  </button>
                </div>
                <div className="space-y-3">
                  {medicalHistory.map((condition, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">{condition}</p>
                      </div>
                      <button
                        onClick={() => {
                          setMedicalHistory(medicalHistory.filter((_, i) => i !== index));
                          toast.success("Condition removed");
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Gastric Reflux (GERD)</p>
                      <p className="text-sm text-gray-500">Diagnosed in 2022</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Vitamin D Deficiency</p>
                      <p className="text-sm text-gray-500">Diagnosed in 2023</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Appendectomy</p>
                      <p className="text-sm text-gray-500">Surgery performed in 2015</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Uploaded Documents
                </h2>
                <p className="text-gray-500 text-sm">View and manage all your medical documents</p>
              </div>

              {/* All Documents */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="bg-gray-100 rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors p-4"
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">Document {i}</p>
                  </motion.div>
                ))}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowUploadModal(true)}
                  className="bg-black rounded-2xl aspect-square flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-12 h-12 text-white" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === "family" && (
            <motion.div
              key="family"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-3xl mb-2 ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Family Members
                  </h2>
                  <p className={`text-sm ${textSecondary}`}>Manage your family member profiles</p>
                </div>
                <button 
                  onClick={() => setShowAddFamilyModal(true)}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors bg-green-500 text-white hover:bg-green-600"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Add Member
                  </span>
                </button>
              </div>

              {/* All Family Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    whileHover={{ scale: 1.02 }}
                    className={`${cardBg} rounded-2xl p-6 transition-colors`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                        <Users className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-lg font-semibold ${textPrimary}`}>{member.name}</h4>
                        <p className={`text-sm ${textSecondary}`}>{member.relation}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={textSecondary}>Age:</span>
                        <span className={`font-medium ${textPrimary}`}>{member.age} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={textSecondary}>Blood Group:</span>
                        <span className={`font-medium ${textPrimary}`}>{member.bloodGroup}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedFamilyMember(member);
                        setShowFamilyMemberDetails(true);
                      }}
                      className="w-full mt-4 py-2 rounded-lg text-sm transition-colors bg-green-500 text-white hover:bg-green-600"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      View Details
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "expenses" && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Medical Expenses
                </h2>
                <p className="text-gray-500 text-sm">Track your healthcare spending</p>
              </div>

              {/* Total Overview */}
              <div className="bg-purple-600 text-white rounded-2xl p-8">
                <p className="text-purple-200 text-sm mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Total This Month</p>
                <p className="text-5xl mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>{convertCurrency(getExpensesByCategory().total, selectedCurrency)}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Track your spending</span>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h3 className="text-xl mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Category Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Pill className="w-8 h-8 text-gray-700" />
                      <span className="text-xs text-gray-500">
                        {getExpensesByCategory().total > 0 ? Math.round((getExpensesByCategory().medicineTotal / getExpensesByCategory().total) * 100) : 0}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Medicines</p>
                    <p className="text-2xl font-semibold">{convertCurrency(getExpensesByCategory().medicineTotal, selectedCurrency)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <User className="w-8 h-8 text-gray-700" />
                      <span className="text-xs text-gray-500">
                        {getExpensesByCategory().total > 0 ? Math.round((getExpensesByCategory().consultationTotal / getExpensesByCategory().total) * 100) : 0}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Consultations</p>
                    <p className="text-2xl font-semibold">{convertCurrency(getExpensesByCategory().consultationTotal, selectedCurrency)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-8 h-8 text-gray-700" />
                      <span className="text-xs text-gray-500">
                        {getExpensesByCategory().total > 0 ? Math.round((getExpensesByCategory().testTotal / getExpensesByCategory().total) * 100) : 0}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Tests</p>
                    <p className="text-2xl font-semibold">{convertCurrency(getExpensesByCategory().testTotal, selectedCurrency)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-8 h-8 text-purple-600" />
                      <span className="text-xs text-purple-600" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>100%</span>
                    </div>
                    <p className="text-sm text-purple-600 mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Total</p>
                    <p className="text-2xl text-purple-600" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>{convertCurrency(getExpensesByCategory().total, selectedCurrency)}</p>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="text-xl mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Recent Transactions
                </h3>
                <div className="space-y-3">
                  {expenses.map((transaction, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{transaction.name}</h4>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{convertCurrency(transaction.amount, selectedCurrency)}</p>
                        <p className="text-xs text-gray-500">{transaction.category}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "predictions" && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Health Predictions
                  </h2>
                  <p className="text-gray-500 text-sm">View your disease risk predictions and history</p>
                </div>
                <button
                  onClick={() => setShowPredictionModal(true)}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <Plus className="w-4 h-4" />
                  New Prediction
                </button>
              </div>

              {predictions.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    No Predictions Yet
                  </h3>
                  <p className="text-gray-500 mb-6">Start by creating your first health prediction</p>
                  <button
                    onClick={() => setShowPredictionModal(true)}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Create Prediction
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {predictions.map((prediction) => (
                    <motion.div
                      key={prediction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl p-6 border-2 ${
                        prediction.risk === "high"
                          ? "bg-red-50 border-red-200"
                          : prediction.risk === "medium"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {prediction.type === "heart" && <Heart className={`w-8 h-8 ${prediction.risk === "high" ? "text-red-600" : prediction.risk === "medium" ? "text-yellow-600" : "text-green-600"}`} />}
                          {prediction.type === "diabetes" && <Droplet className={`w-8 h-8 ${prediction.risk === "high" ? "text-red-600" : prediction.risk === "medium" ? "text-yellow-600" : "text-green-600"}`} />}
                          {prediction.type === "kidney" && <Activity className={`w-8 h-8 ${prediction.risk === "high" ? "text-red-600" : prediction.risk === "medium" ? "text-yellow-600" : "text-green-600"}`} />}
                          {prediction.type === "sepsis" && <AlertCircle className={`w-8 h-8 ${prediction.risk === "high" ? "text-red-600" : prediction.risk === "medium" ? "text-yellow-600" : "text-green-600"}`} />}
                          <div>
                            <h3 className="text-xl capitalize" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                              {prediction.type === "heart" ? "Heart Disease" : prediction.type === "kidney" ? "Chronic Kidney Disease" : prediction.type}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(prediction.date).toLocaleDateString("en-US", { 
                                month: "short", 
                                day: "numeric", 
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-lg text-sm uppercase ${
                            prediction.risk === "high"
                              ? "bg-red-600 text-white"
                              : prediction.risk === "medium"
                              ? "bg-yellow-600 text-white"
                              : "bg-green-600 text-white"
                          }`}
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                        >
                          {prediction.risk} Risk
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Risk Probability</span>
                          <span className="text-lg font-semibold">{prediction.probability}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              prediction.risk === "high"
                                ? "bg-red-600"
                                : prediction.risk === "medium"
                                ? "bg-yellow-600"
                                : "bg-green-600"
                            }`}
                            style={{ width: `${prediction.probability}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 mb-4">
                        <h4 className="font-semibold mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                          Recommendation
                        </h4>
                        <p className="text-sm text-gray-700">{prediction.recommendation}</p>
                      </div>

                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-black transition-colors list-none flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                          View Input Parameters
                        </summary>
                        <div className="mt-3 bg-white rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(prediction.inputs).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-gray-500 capitalize block">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "buyMedicines" && (
            <motion.div
              key="buyMedicines"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Buy Medicines
                </h2>
                <p className="text-gray-500 text-sm">Order medicines and supplements online</p>
              </div>

              {/* Active Deliveries */}
              {activeDeliveries.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Active Deliveries
                  </h3>
                  {activeDeliveries.map((delivery) => {
                    const order = orders.find(o => o.id === delivery.orderId);
                    return (
                      <motion.div
                        key={delivery.orderId}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white rounded-2xl p-6 cursor-pointer"
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowDeliveryTracking(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-semibold mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                              Order #{delivery.orderId.slice(-8)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order?.items.length} items • {convertCurrency(order?.total || 0, selectedCurrency)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                            <Package className="w-3 h-3" />
                            {delivery.status === "preparing" && "Preparing"}
                            {delivery.status === "dispatched" && "Dispatched"}
                            {delivery.status === "in_transit" && "In Transit"}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{delivery.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-black rounded-full h-2 transition-all duration-500"
                              style={{ width: `${delivery.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-600">
                              Estimated delivery: {formatAppointmentDate(delivery.estimatedDelivery)}
                            </span>
                          </div>
                          <button className="text-black font-medium text-sm hover:underline flex items-center gap-1">
                            Track
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Search and Filters */}
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search medicines by name, generic name, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl transition-colors outline-none bg-gray-50"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "500" }}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      Filters:
                    </span>
                  </div>
                  
                  {/* Category Filter */}
                  <CustomSelect
                    value={selectedCategory}
                    onChange={(value) => setSelectedCategory(value)}
                    options={MEDICINE_CATEGORIES.map(cat => ({
                      value: cat,
                      label: cat === "all" ? "All Categories" : cat
                    }))}
                    placeholder="Select Category"
                    isDarkMode={isDarkMode}
                  />

                  {/* Prescription Filter */}
                  <CustomSelect
                    value={prescriptionRequiredFilter}
                    onChange={(value) => setPrescriptionRequiredFilter(value)}
                    options={[
                      { value: "all", label: "All Medicines" },
                      { value: "prescription", label: "Prescription Required" },
                      { value: "otc", label: "Over-the-Counter" }
                    ]}
                    placeholder="Filter by Type"
                    isDarkMode={isDarkMode}
                  />

                  {/* Results Count */}
                  <div className={`ml-auto rounded-full px-4 py-1 text-sm font-medium ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    {filteredMedicines.length} medicines
                  </div>
                </div>
              </div>

              {/* Medicines Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMedicines.map((medicine) => (
                  <motion.div
                    key={medicine.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedShopMedicine(medicine);
                      setShowMedicineDetail(true);
                    }}
                    className="bg-gray-50 rounded-2xl p-5 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                        <Pill className="w-6 h-6 text-white" />
                      </div>
                      {medicine.prescriptionRequired && (
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                          Rx
                        </span>
                      )}
                      {!medicine.inStock && (
                        <span className="bg-gray-300 text-gray-600 px-2 py-1 rounded-full text-xs uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      {medicine.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{medicine.genericName}</p>
                    <p className="text-xs text-gray-400 mb-3">{medicine.strength} • {medicine.packSize}</p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {medicine.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{medicine.rating}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                          {convertCurrency(medicine.price, selectedCurrency)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (medicine.inStock) {
                              addToCart(medicine);
                            }
                          }}
                          disabled={!medicine.inStock}
                          className={`p-2 rounded-lg transition-colors ${
                            medicine.inStock 
                              ? "bg-green-500 text-white hover:bg-green-600" 
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (medicine.inStock) {
                            // Buy Now: Add to cart and go to checkout
                            if (medicine.prescriptionRequired) {
                              setIsBuyNow(true);
                              setPendingCartItem(medicine);
                              setShowPrescriptionUploadForCart(true);
                            } else {
                              setCart([{ medicine, quantity: 1 }]);
                              setShowCheckout(true);
                            }
                          }
                        }}
                        disabled={!medicine.inStock}
                        className={`w-full py-2 rounded-lg transition-colors text-sm font-medium ${
                          medicine.inStock 
                            ? "bg-blue-400 text-white hover:bg-blue-500" 
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        {medicine.inStock ? "Buy Now" : "Out of Stock"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredMedicines.length === 0 && (
                <div className="text-center py-20">
                  <Pill className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    No medicines found
                  </p>
                  <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                </div>
              )}

              {/* Past Deliveries */}
              {pastDeliveries.length > 0 && (
                <div className="mt-12 pt-8">
                  <h3 className="font-semibold mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Past Deliveries
                  </h3>
                  <div className="space-y-3">
                    {pastDeliveries.map((delivery) => {
                      const order = orders.find(o => o.id === delivery.orderId);
                      return (
                        <motion.div
                          key={delivery.orderId}
                          whileHover={{ scale: 1.01 }}
                          className="bg-gray-50 rounded-2xl p-4 cursor-pointer"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowDeliveryTracking(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                                Order #{delivery.orderId.slice(-8)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {order?.items.length} items • {convertCurrency(order?.total || 0, selectedCurrency)} • Delivered {formatAppointmentDate(delivery.estimatedDelivery)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              View Details
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className={`text-3xl mb-2 ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Settings
                </h2>
                <p className={`text-sm ${textTertiary}`}>Manage your preferences</p>
              </div>

              {/* Theme Settings */}
              <div className={`${cardBg} rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Appearance</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${textPrimary}`}>Dark Mode</p>
                    <p className={`text-sm ${textTertiary}`}>Toggle dark mode for dashboard</p>
                  </div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      isDarkMode ? 'bg-black' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        isDarkMode ? 'transform translate-x-7' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Location Settings */}
              <div className={`${cardBg} rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Location & Currency</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Location</label>
                    <input
                      type="text"
                      value={settings.location}
                      onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg outline-none transition-colors ${inputBg} ${textPrimary}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Preferred Currency</label>
                    <CustomSelect
                      value={selectedCurrency}
                      onChange={handleCurrencyChange}
                      options={Object.keys(CURRENCY_RATES).map(code => ({
                        value: code,
                        label: `${CURRENCY_RATES[code].symbol} ${code} - ${code === 'USD' ? 'US Dollar' : code === 'EUR' ? 'Euro' : code === 'GBP' ? 'British Pound' : code === 'INR' ? 'Indian Rupee' : code === 'CAD' ? 'Canadian Dollar' : code === 'AUD' ? 'Australian Dollar' : 'Japanese Yen'}`
                      }))}
                      placeholder="Select Currency"
                      isDarkMode={isDarkMode}
                    />
                    <p className={`text-xs mt-2 ${textTertiary}`}>All prices will be displayed in your preferred currency</p>
                  </div>
                </div>
              </div>

              {/* Address Settings */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Default Address</h3>
                <div>
                  <textarea
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg outline-none resize-none bg-gray-50"
                    rows={3}
                  />
                </div>
              </div>

              {/* Language Settings */}
              <div className={`${cardBg} rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Language</h3>
                <CustomSelect
                  value={settings.language}
                  onChange={(value) => setSettings({ ...settings, language: value })}
                  options={[
                    { value: "English", label: "English" },
                    { value: "Spanish", label: "Español" },
                    { value: "French", label: "Français" },
                    { value: "German", label: "Deutsch" },
                    { value: "Hindi", label: "हिन्दी" }
                  ]}
                  placeholder="Select Language"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Notification Settings */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive push notifications</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        settings.notifications ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.notifications ? 'transform translate-x-7' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email updates</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        settings.emailNotifications ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.emailNotifications ? 'transform translate-x-7' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "medicalRecords" && (
            <motion.div
              key="medicalRecords"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Medical Records
                </h2>
                <p className="text-gray-600">View all your uploaded medical documents and AI-generated summaries</p>
                {medicalRecords.length > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Latest upload: {new Date(Math.max(...medicalRecords.map(r => new Date(r.uploadDate).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              {medicalRecords.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
                    <FileText className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                      {medicalRecords.length}
                    </p>
                    <p className="text-xs text-blue-700 uppercase tracking-wide">Total Documents</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4">
                    <ScanLine className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                      {medicalRecords.filter(r => ['xray', 'ct-scan', 'mri'].includes(r.type)).length}
                    </p>
                    <p className="text-xs text-purple-700 uppercase tracking-wide">Imaging Reports</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
                    <Activity className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                      {medicalRecords.filter(r => r.type === 'lab-result' || r.type === 'report').length}
                    </p>
                    <p className="text-xs text-green-700 uppercase tracking-wide">Lab Reports</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-4">
                    <Pill className="w-6 h-6 text-rose-600 mb-2" />
                    <p className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                      {medicalRecords.filter(r => r.type === 'prescription').length}
                    </p>
                    <p className="text-xs text-rose-700 uppercase tracking-wide">Prescriptions</p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {medicalRecords.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload New Document
                  </button>
                </div>
              )}

              {/* Records Grid */}
              {medicalRecords.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-12 text-center">
                  <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    No Medical Records Yet
                  </h3>
                  <p className="text-gray-500 mb-6">Upload your first medical document to get started</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalRecords.map((record) => {
                    const typeIcons: Record<string, any> = {
                      prescription: Pill,
                      report: FileText,
                      xray: ScanLine,
                      "ct-scan": ScanLine,
                      mri: ScanLine,
                      "lab-result": Activity,
                      other: FileText
                    };
                    const TypeIcon = typeIcons[record.type] || FileText;

                    const typeColors: Record<string, string> = {
                      prescription: "bg-blue-50 text-blue-600",
                      report: "bg-green-50 text-green-600",
                      xray: "bg-purple-50 text-purple-600",
                      "ct-scan": "bg-purple-50 text-purple-600",
                      mri: "bg-indigo-50 text-indigo-600",
                      "lab-result": "bg-rose-50 text-rose-600",
                      other: "bg-gray-50 text-gray-600"
                    };

                    return (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-xl ${typeColors[record.type]} flex items-center justify-center flex-shrink-0`}>
                            <TypeIcon className="w-6 h-6" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold text-lg" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                                  {record.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </h3>
                                <p className="text-sm text-gray-500">{record.fileName}</p>
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {new Date(record.uploadDate).toLocaleDateString()}
                              </span>
                            </div>

                            {/* AI Summary */}
                            {record.summary && (
                              <div className="bg-gray-50 rounded-xl p-4 mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">AI Analysis</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{record.summary}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => window.open(record.fileUrl, '_blank')}
                                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                              >
                                View Document
                              </button>
                              <button
                                onClick={() => {
                                  setMedicalRecords(medicalRecords.filter(r => r.id !== record.id));
                                  toast.success("Record deleted successfully");
                                }}
                                className="px-4 py-2 text-sm bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Upload Medical Document
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Document Type Dropdown */}
              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">Document Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none transition-all"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  <option value="prescription">Prescription</option>
                  <option value="report">Blood Report / Lab Report</option>
                  <option value="xray">X-Ray</option>
                  <option value="ct-scan">CT Scan</option>
                  <option value="mri">MRI</option>
                  <option value="lab-result">Lab Result</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl p-12 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">PNG, JPG or PDF (Max 10MB)</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handlePrescriptionUpload}
                className="hidden"
              />

              <p className="text-xs text-gray-500 mt-4 text-center">
                {uploadType === "prescription" 
                  ? "Our AI will automatically extract medicine details from your prescription"
                  : "Our AI will analyze and generate a comprehensive summary of your medical document"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {showManualEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowManualEntry(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Add Medicine Manually
                </h3>
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Medicine Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                    placeholder="e.g., Aspirin"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Dosage</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Frequency</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                    placeholder="e.g., 2 times daily"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Duration (days)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                    placeholder="e.g., 7"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Total Strips/Bottles</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                    placeholder="e.g., 2"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Add Medicine
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prescription Confirmation Modal */}
      <PrescriptionConfirmModal
        isOpen={showPrescriptionConfirm}
        onClose={() => {
          setShowPrescriptionConfirm(false);
          setExtractedMedicines([]);
        }}
        extractedMedicines={extractedMedicines}
        onConfirm={handleConfirmExtractedMedicines}
        isDarkMode={isDarkMode}
      />

      {/* Book Appointment Modal */}
      <AnimatePresence>
        {showBookAppointmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowBookAppointmentModal(false);
              setSelectedHospitalForBooking(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Book New Appointment
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Or call our AI assistant for instant booking</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCallAI}
                    disabled={isCallingAI}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span className="hidden sm:inline">{isCallingAI ? 'Calling...' : 'Call AI'}</span>
                  </button>
                  <button
                    onClick={() => {
              setShowBookAppointmentModal(false);
              setSelectedHospitalForBooking(null);
            }}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleBookAppointment} className="space-y-4">
                {/* Step 1: Select Hospital */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Select Hospital</label>
                  <CustomSelect
                    options={nearestHospitals.length > 0 
                      ? nearestHospitals.map(hospital => ({
                          value: hospital.id,
                          label: hospital.name,
                          subtitle: `${hospital.distanceFormatted || hospital.distance} away`
                        }))
                      : hospitals.map(hospital => ({
                          value: hospital.id,
                          label: hospital.name,
                          subtitle: hospital.location
                        }))}
                    value={selectedHospitalForBooking ? selectedHospitalForBooking.id : selectedHospital}
                    onChange={(value) => {
                      setSelectedHospital(value);
                      setSelectedHospitalForBooking(null); // Clear pre-selected hospital when user manually changes
                      setSelectedDoctor("");
                      setSelectedDate("");
                      setSelectedSlot("");
                    }}
                    placeholder="Choose a hospital..."
                    required
                    isDarkMode={false}
                  />
                  {selectedHospitalForBooking && (
                    <p className="text-xs text-blue-600 mt-1">
                      Pre-selected: {selectedHospitalForBooking.name} ({selectedHospitalForBooking.distanceFormatted || selectedHospitalForBooking.distance} away)
                    </p>
                  )}
                </div>

                {/* Step 2: Select Doctor */}
                {selectedHospital && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Select Doctor</label>
                    <CustomSelect
                      options={getAvailableDoctors().map(doctor => ({
                        value: doctor.id,
                        label: doctor.name,
                        subtitle: doctor.specialty
                      }))}
                      value={selectedDoctor}
                      onChange={(value) => {
                        setSelectedDoctor(value);
                        setSelectedDate("");
                        setSelectedSlot("");
                      }}
                      placeholder="Choose a doctor..."
                      required
                      isDarkMode={false}
                    />
                  </div>
                )}

                {/* Appointment Type - Moved up before date/time */}
                {selectedDoctor && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Appointment Type</label>
                    <CustomSelect
                      options={[
                        { value: "checkup", label: "Check-up" },
                        { value: "followup", label: "Follow-up" },
                        { value: "emergency", label: "Emergency" }
                      ]}
                      value={selectedAppointmentType}
                      onChange={setSelectedAppointmentType}
                      placeholder="Select appointment type..."
                      required
                      isDarkMode={false}
                    />
                  </div>
                )}

                {/* Emergency Warning */}
                {selectedAppointmentType === "emergency" && (
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-900" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                          Emergency appointments are immediate
                        </p>
                        <p className="text-xs text-red-700 mt-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "400" }}>
                          In case of emergency, you should immediately leave for your nearest preferred hospital. This booking confirms your emergency visit.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Select Date - Only for non-emergency */}
                {selectedDoctor && selectedAppointmentType !== "emergency" && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Select Date</label>
                    <CustomDatePicker
                      value={selectedDate}
                      onChange={(value) => {
                        setSelectedDate(value);
                        setSelectedSlot("");
                      }}
                      minDate={new Date().toISOString().split('T')[0]}
                      placeholder="Choose a date..."
                      required
                    />
                  </div>
                )}

                {/* Step 4: Select Time Slot - Only for non-emergency */}
                {selectedDate && selectedAppointmentType !== "emergency" && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Available Time Slots {getAvailableSlots().length > 0 && `(${getAvailableSlots().length} slots available)`}
                    </label>
                    {getAvailableSlots().length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {getAvailableSlots().map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-4 py-3 rounded-xl transition-all ${
                              selectedSlot === slot
                                ? "bg-black text-white"
                                : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic py-3">No slots available for this date. Please choose another date.</p>
                    )}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={selectedAppointmentType === "emergency" ? (!selectedHospital || !selectedDoctor) : (!selectedHospital || !selectedDoctor || !selectedDate || !selectedSlot)}
                  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide disabled:bg-gray-300 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  {selectedAppointmentType === "emergency" ? "Book Emergency Visit" : !selectedSlot ? "Select all details to book" : "Book Appointment"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Route Map Modal After Booking */}
      <AnimatePresence>
        {showRouteAfterBooking && bookedHospital && (userLocation || bookedHospital?.lat) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRouteAfterBooking(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Route to {bookedHospital?.name || "Hospital"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Your appointment has been booked successfully! Here's your route.</p>
                </div>
                <button
                  onClick={() => setShowRouteAfterBooking(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Route Info */}
              {hospitalRoutes['driving-car'] ? (
                <div className="mb-4 bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🚗</div>
                      <div>
                        <p className="font-semibold text-blue-900">Driving Route</p>
                        <p className="text-sm text-blue-700">
                          Distance: {hospitalRoutes['driving-car'].distance.toFixed(1)} km • 
                          Estimated Time: {hospitalRoutes['driving-car'].duration} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : bookedHospital?.lat && bookedHospital?.lng ? (
                <div className="mb-4 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600">Calculating route...</p>
                  </div>
                </div>
              ) : null}

              {/* Map - Always show when modal is open */}
              <div className="relative h-[500px] w-full rounded-2xl overflow-hidden border border-gray-200" style={{ minHeight: '500px' }}>
                <MapContainer
                  key={`route-map-modal-${bookedHospital?.id || 'default'}`}
                  center={
                    userLocation 
                      ? [userLocation.latitude, userLocation.longitude] as [number, number]
                      : bookedHospital?.lat && bookedHospital?.lng
                        ? [bookedHospital.lat, bookedHospital.lng] as [number, number]
                        : [19.0760, 72.8777] as [number, number]
                  }
                  zoom={userLocation && bookedHospital?.lat ? 13 : 12}
                  style={{ height: "100%", width: "100%", minHeight: '500px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  <MapSizeHandler />

                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker position={[userLocation.latitude, userLocation.longitude]}>
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}

                  {/* Hospital Marker */}
                  {bookedHospital && bookedHospital.lat && bookedHospital.lng && (
                    <Marker
                      position={[bookedHospital.lat, bookedHospital.lng]}
                      icon={hospitalIcon}
                    >
                      <Popup>{bookedHospital.name}</Popup>
                    </Marker>
                  )}

                  {/* Route Polyline - Show when available */}
                  {hospitalRoutes['driving-car']?.coords && 
                   Array.isArray(hospitalRoutes['driving-car'].coords) && 
                   hospitalRoutes['driving-car'].coords.length > 0 && (
                    <>
                      <Polyline
                        positions={hospitalRoutes['driving-car'].coords as Array<[number, number]>}
                        color="blue"
                        weight={4}
                        opacity={0.7}
                      />
                      <RouteHandler
                        routeCoords={hospitalRoutes['driving-car'].coords as Array<[number, number]>}
                        selectedHospital={bookedHospital}
                      />
                    </>
                  )}
                </MapContainer>
                
                {/* Loading overlay for route */}
                {!hospitalRoutes['driving-car']?.coords && bookedHospital?.lat && bookedHospital?.lng && (
                  <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-xs text-gray-600">Calculating route...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowRouteAfterBooking(false);
                    setActiveTab("hospitals");
                  }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  View in Hospitals Tab
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medicine Detail Modal */}
      <AnimatePresence>
        {showMedicineDetail && selectedShopMedicine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMedicineDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    {selectedShopMedicine.name}
                  </h3>
                  <p className="text-gray-500">{selectedShopMedicine.genericName}</p>
                </div>
                <button
                  onClick={() => setShowMedicineDetail(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Price and Rating */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Price</p>
                    <p className="text-3xl font-bold" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      {convertCurrency(selectedShopMedicine.price, selectedCurrency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-xl font-semibold">{selectedShopMedicine.rating}</span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <p className="font-semibold">{selectedShopMedicine.category}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Manufacturer</p>
                    <p className="font-semibold">{selectedShopMedicine.manufacturer}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Dosage Form</p>
                    <p className="font-semibold">{selectedShopMedicine.dosageForm}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Strength</p>
                    <p className="font-semibold">{selectedShopMedicine.strength}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Pack Size</p>
                    <p className="font-semibold">{selectedShopMedicine.packSize}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Description
                  </h4>
                  <p className="text-gray-600">{selectedShopMedicine.description}</p>
                </div>

                {/* Prescription Warning */}
                {selectedShopMedicine.prescriptionRequired && (
                  <div className="bg-red-50 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">Prescription Required</p>
                      <p className="text-sm text-red-700">
                        You'll need to upload a valid prescription to purchase this medicine.
                      </p>
                    </div>
                  </div>
                )}

                {/* Stock Status */}
                {!selectedShopMedicine.inStock && (
                  <div className="bg-gray-100 rounded-2xl p-4 flex items-start gap-3">
                    <Package className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Out of Stock</p>
                      <p className="text-sm text-gray-600">
                        This medicine is currently unavailable. Please check back later.
                      </p>
                    </div>
                  </div>
                )}

                {/* Delivery Info */}
                {selectedShopMedicine.inStock && (
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-3">
                    <Truck className="w-5 h-5 text-black mt-0.5" />
                    <div>
                      <p className="font-semibold text-black mb-1">Fast Delivery Available</p>
                      <p className="text-sm text-gray-600">
                        Delivery in 2-3 business days to {deliveryAddress.city}, {deliveryAddress.state}
                      </p>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={() => addToCart(selectedShopMedicine)}
                  disabled={!selectedShopMedicine.inStock}
                  className={`w-full py-4 rounded-xl uppercase tracking-wide transition-colors flex items-center justify-center gap-3 ${
                    selectedShopMedicine.inStock
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {selectedShopMedicine.prescriptionRequired ? "Upload Prescription & Add to Cart" : "Add to Cart"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white h-full w-full max-w-md overflow-y-auto"
            >
              <div className="p-6 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Shopping Cart ({cart.length})
                </h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Your cart is empty
                  </p>
                  <p className="text-gray-400 text-sm mb-6">Add medicines to get started</p>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setActiveTab("buyMedicines");
                    }}
                    className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Browse Medicines
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-6 space-y-4">
                    {cart.map((item) => (
                      <motion.div
                        key={item.medicine.id}
                        layout
                        className="bg-gray-50 rounded-2xl p-4"
                      >
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                            <Pill className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                                  {item.medicine.name}
                                </h4>
                                <p className="text-sm text-gray-500">{item.medicine.strength}</p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.medicine.id)}
                                className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {item.prescriptionUploaded && (
                              <div className="flex items-center gap-1 mb-2">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-600">Prescription uploaded</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 bg-white rounded-lg p-1">
                                <button
                                  onClick={() => updateCartQuantity(item.medicine.id, -1)}
                                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.medicine.id, 1)}
                                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="font-bold" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                                {convertCurrency(item.medicine.price * item.quantity, selectedCurrency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-6 sticky bottom-0 bg-white">
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{convertCurrency(getCartTotal(), selectedCurrency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery</span>
                        <span className="font-medium text-green-600">Free</span>
                      </div>
                      <div className="flex justify-between pt-3">
                        <span className="font-semibold" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Total</span>
                        <span className="text-2xl font-bold" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                          {convertCurrency(getCartTotal(), selectedCurrency)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowCart(false);
                        setShowCheckout(true);
                      }}
                      className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Popup Modal */}
      <AnimatePresence>
        {showNotificationPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNotificationPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} border rounded-3xl p-6 max-w-lg w-full shadow-2xl`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-2xl">
                    <Bell className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className={`text-2xl ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      New Notifications
                    </h3>
                    <p className={`text-sm ${textSecondary} mt-1`}>
                      You have {alerts.length} new notification{alerts.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationPopup(false)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${textSecondary}`} />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${
                        alert.type === 'critical' ? 'text-red-500' :
                        alert.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}>
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`${textPrimary} mb-1`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                          {alert.title}
                        </h4>
                        <p className={`text-sm ${textSecondary} mb-2`}>
                          {alert.message}
                        </p>
                        <p className={`text-xs ${textTertiary}`}>
                          {new Date(alert.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowNotificationPopup(false);
                    setActiveTab("notifications");
                  }}
                  className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  View All
                </button>
                <button
                  onClick={() => setShowNotificationPopup(false)}
                  className={`flex-1 py-3 rounded-xl transition-colors uppercase tracking-wide ${
                    isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Checkout
                </h3>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Order Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Order Summary
                    </h4>
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.medicine.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.medicine.name} × {item.quantity}
                          </span>
                          <span className="font-medium">{convertCurrency(item.medicine.price * item.quantity, selectedCurrency)}</span>
                        </div>
                      ))}
                      <div className="pt-3 flex justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                          {convertCurrency(getCartTotal(), selectedCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Delivery Address
                    </h4>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                          <p className="font-medium">{deliveryAddress.street}</p>
                          <p className="text-sm text-gray-600">
                            {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zip}
                          </p>
                        </div>
                      </div>
                      <button className="text-sm text-black hover:underline" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                        Change Address
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Delivery Timeline
                    </h4>
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-3">
                      <Truck className="w-5 h-5 text-black mt-0.5" />
                      <div>
                        <p className="font-semibold text-black">Expected Delivery</p>
                        <p className="text-sm text-gray-600">2-3 business days</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Map */}
                <div>
                  <h4 className="font-semibold mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Delivery Location
                  </h4>
                  <div className="bg-gray-100 rounded-2xl overflow-hidden h-96 relative">
                    {/* Map would be integrated here with patient's location */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <MapPinned className="w-16 h-16 mx-auto mb-4 text-black" />
                        <p className="text-black" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                          {deliveryAddress.city}, {deliveryAddress.state}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide mt-8"
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
              >
                Place Order - {convertCurrency(getCartTotal(), selectedCurrency)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prescription Upload for Cart Modal */}
      <AnimatePresence>
        {showPrescriptionUploadForCart && pendingCartItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => {
              setShowPrescriptionUploadForCart(false);
              setPendingCartItem(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Upload Prescription
                </h3>
                <button
                  onClick={() => {
                    setShowPrescriptionUploadForCart(false);
                    setPendingCartItem(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-red-50 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Prescription Required</p>
                  <p className="text-sm text-red-700">
                    {pendingCartItem.name} requires a valid prescription to purchase.
                  </p>
                </div>
              </div>

              <div
                onClick={() => prescriptionUploadRef.current?.click()}
                className="rounded-2xl p-12 text-center cursor-pointer transition-colors bg-gray-50 mb-6"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">Upload your prescription</p>
                <p className="text-xs text-gray-400">PNG, JPG or PDF</p>
              </div>

              <input
                ref={prescriptionUploadRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handlePrescriptionUploadForCart}
                className="hidden"
              />

              <p className="text-xs text-gray-500 text-center">
                Your prescription will be verified by our pharmacists before order confirmation
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivery Tracking Modal */}
      <AnimatePresence>
        {showDeliveryTracking && selectedDelivery && (
          <DeliveryTrackingModal
            delivery={selectedDelivery}
            order={orders.find(o => o.id === selectedDelivery.orderId)}
            deliveryAddress={deliveryAddress}
            onClose={() => {
              setShowDeliveryTracking(false);
              setSelectedDelivery(null);
            }}
            formatDate={formatAppointmentDate}
            convertCurrency={convertCurrency}
            selectedCurrency={selectedCurrency}
          />
        )}
      </AnimatePresence>

      {/* Add Family Member Modal */}
      <AnimatePresence>
        {showAddFamilyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowAddFamilyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-3xl p-8 max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Add Family Member
                </h3>
                <button
                  onClick={() => setShowAddFamilyModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${textPrimary}`} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newMember = {
                    id: `fm${familyMembers.length + 1}`,
                    name: formData.get('name') as string,
                    relation: newFamilyMember.relation,
                    age: parseInt(formData.get('age') as string),
                    bloodGroup: newFamilyMember.bloodGroup
                  };
                  
                  if (!newMember.relation || !newMember.bloodGroup) {
                    toast.error("Please select relation and blood group");
                    return;
                  }
                  
                  setFamilyMembers([...familyMembers, newMember]);
                  toast.success(`${newMember.name} added to family members`);
                  setShowAddFamilyModal(false);
                  setNewFamilyMember({ relation: "", bloodGroup: "" });
                }}
                className="space-y-4"
              >
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className={`w-full px-4 py-2 rounded-lg outline-none transition-colors ${inputBg} ${textPrimary}`}
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Relation</label>
                  <CustomSelect
                    value={newFamilyMember.relation}
                    onChange={(value) => setNewFamilyMember({ ...newFamilyMember, relation: value })}
                    options={[
                      { value: "Father", label: "Father" },
                      { value: "Mother", label: "Mother" },
                      { value: "Spouse", label: "Spouse" },
                      { value: "Child", label: "Child" },
                      { value: "Sibling", label: "Sibling" }
                    ]}
                    placeholder="Select relation"
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Age</label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="1"
                    max="120"
                    className={`w-full px-4 py-2 rounded-lg outline-none transition-colors ${inputBg} ${textPrimary}`}
                    placeholder="Enter age"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Blood Group</label>
                  <CustomSelect
                    value={newFamilyMember.bloodGroup}
                    onChange={(value) => setNewFamilyMember({ ...newFamilyMember, bloodGroup: value })}
                    options={[
                      { value: "A+", label: "A+" },
                      { value: "A-", label: "A-" },
                      { value: "B+", label: "B+" },
                      { value: "B-", label: "B-" },
                      { value: "AB+", label: "AB+" },
                      { value: "AB-", label: "AB-" },
                      { value: "O+", label: "O+" },
                      { value: "O-", label: "O-" }
                    ]}
                    placeholder="Select blood group"
                    isDarkMode={isDarkMode}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Add Member
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family Member Details Modal */}
      <AnimatePresence>
        {showFamilyMemberDetails && selectedFamilyMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => {
              setShowFamilyMemberDetails(false);
              setSelectedFamilyMember(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-3xl p-8 max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Family Member Details
                </h3>
                <button
                  onClick={() => {
                    setShowFamilyMemberDetails(false);
                    setSelectedFamilyMember(null);
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${textPrimary}`} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Member Icon */}
                <div className="flex justify-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                    <Users className={`w-12 h-12 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                </div>

                {/* Member Details */}
                <div className="space-y-4">
                  <div className={`${cardBg} rounded-xl p-4`}>
                    <p className={`text-xs uppercase tracking-wide mb-1 ${textSecondary}`}>Full Name</p>
                    <p className={`text-lg font-semibold ${textPrimary}`}>{selectedFamilyMember.name}</p>
                  </div>

                  <div className={`${cardBg} rounded-xl p-4`}>
                    <p className={`text-xs uppercase tracking-wide mb-1 ${textSecondary}`}>Relation</p>
                    <p className={`text-lg font-semibold ${textPrimary}`}>{selectedFamilyMember.relation}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`${cardBg} rounded-xl p-4`}>
                      <p className={`text-xs uppercase tracking-wide mb-1 ${textSecondary}`}>Age</p>
                      <p className={`text-lg font-semibold ${textPrimary}`}>{selectedFamilyMember.age} years</p>
                    </div>

                    <div className={`${cardBg} rounded-xl p-4`}>
                      <p className={`text-xs uppercase tracking-wide mb-1 ${textSecondary}`}>Blood Group</p>
                      <p className={`text-lg font-semibold ${textPrimary}`}>{selectedFamilyMember.bloodGroup}</p>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowFamilyMemberDetails(false);
                    setSelectedFamilyMember(null);
                  }}
                  className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Medicines Modal */}
      <AnimatePresence>
        {showDayMedicinesModal && selectedCalendarDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => {
              setShowDayMedicinesModal(false);
              setSelectedCalendarDate(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-2xl ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    Medicines for {new Date(selectedCalendarDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <p className={`text-sm mt-1 ${textSecondary}`}>
                    {(() => {
                      const dayMedicines = medicines.flatMap(med => 
                        med.takings.filter(t => t.date === selectedCalendarDate)
                      );
                      const taken = dayMedicines.filter(t => t.taken).length;
                      const total = dayMedicines.length;
                      return `${taken}/${total} taken`;
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDayMedicinesModal(false);
                    setSelectedCalendarDate(null);
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${textPrimary}`} />
                </button>
              </div>

              <div className="space-y-4">
                {medicines.map(medicine => {
                  const dayTakings = medicine.takings.filter(t => t.date === selectedCalendarDate);
                  if (dayTakings.length === 0) return null;

                  return (
                    <div key={medicine.id} className={`${cardBg} rounded-2xl p-4`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                          <Pill className={`w-5 h-5 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${textPrimary}`}>{medicine.name}</h4>
                          <p className={`text-sm ${textSecondary}`}>{medicine.dosage}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {dayTakings.map((taking, idx) => {
                          const isToday = selectedCalendarDate === new Date().toISOString().split('T')[0];
                          const isTimeTriggered = isToday && hasMedicineTimePassed(taking.time);

                          return (
                            <div 
                              key={idx}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                taking.taken 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {taking.taken ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Clock className="w-5 h-5 text-gray-400" />
                                )}
                                <div>
                                  <p className={`font-medium ${textPrimary}`}>{taking.time}</p>
                                  <p className={`text-xs ${textSecondary}`}>
                                    {taking.taken ? 'Taken' : 'Not taken'}
                                  </p>
                                </div>
                              </div>

                              {!taking.taken && isTimeTriggered && (
                                <button
                                  onClick={() => handleMarkMedicineAsTaken(medicine.id, selectedCalendarDate, taking.time)}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                >
                                  ✓ Mark Taken
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setShowDayMedicinesModal(false);
                  setSelectedCalendarDate(null);
                }}
                className="w-full mt-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Medical History Modal */}
      <AnimatePresence>
        {showMedicalHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowMedicalHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-3xl p-8 max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Add Medical Condition
                </h3>
                <button
                  onClick={() => setShowMedicalHistoryModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${textPrimary}`} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const condition = formData.get('condition') as string;
                  if (condition.trim()) {
                    setMedicalHistory([...medicalHistory, condition]);
                    toast.success("Medical condition added");
                    setShowMedicalHistoryModal(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Condition</label>
                  <input
                    type="text"
                    name="condition"
                    required
                    className={`w-full px-4 py-2 rounded-lg outline-none transition-colors ${inputBg} ${textPrimary}`}
                    placeholder="e.g., Hypertension - Diagnosed 2020"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Add Condition
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Call Modal */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => !isCallActive && setShowCallModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-3xl p-8 max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="text-center">
                {!isCallActive ? (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                        <PhoneCall className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className={`text-2xl mb-3 ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      AI Voice Assistant
                    </h3>
                    <p className={`mb-6 ${textSecondary}`}>
                      Call our AI assistant to book an appointment. Just tell us your symptoms and preferred time, and we'll find the best doctor for you!
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setIsCallActive(true);
                          setCallDuration(0);
                          const interval = setInterval(() => {
                            setCallDuration(prev => prev + 1);
                          }, 1000);
                          setTimeout(() => {
                            clearInterval(interval);
                            setIsCallActive(false);
                            setShowCallModal(false);
                            setCallDuration(0);
                            toast.success("Appointment booking request received! We'll confirm shortly.");
                          }, 15000);
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        <PhoneCall className="w-5 h-5" />
                        Start Call
                      </button>
                      <button
                        onClick={() => setShowCallModal(false)}
                        className={`w-full ${cardBg} py-4 rounded-xl hover:bg-gray-100 transition-all`}
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <motion.div
                          className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center"
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                          }}
                        >
                          <Mic className="w-16 h-16 text-white" />
                        </motion.div>
                        <motion.div
                          className="absolute inset-0 bg-blue-500/20 rounded-full"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                      </div>
                    </div>
                    <h3 className={`text-2xl mb-2 ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Call in Progress
                    </h3>
                    <p className={`text-3xl mb-3 ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                    </p>
                    <p className={`mb-6 ${textSecondary}`}>
                      Our AI is listening... Speak clearly about your symptoms and preferred appointment time.
                    </p>
                    <div className="space-y-3">
                      <div className={`${cardBg} rounded-xl p-4`}>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 space-y-2">
                            <motion.div
                              className="h-1 bg-blue-500 rounded-full"
                              animate={{
                                width: ["20%", "80%", "40%", "90%", "60%"],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                              }}
                            />
                            <motion.div
                              className="h-1 bg-blue-400 rounded-full"
                              animate={{
                                width: ["60%", "30%", "70%", "20%", "50%"],
                              }}
                              transition={{
                                duration: 1.8,
                                repeat: Infinity,
                              }}
                            />
                            <motion.div
                              className="h-1 bg-blue-300 rounded-full"
                              animate={{
                                width: ["40%", "70%", "30%", "80%", "40%"],
                              }}
                              transition={{
                                duration: 2.2,
                                repeat: Infinity,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsCallActive(false);
                          setShowCallModal(false);
                          setCallDuration(0);
                          toast.info("Call ended");
                        }}
                        className="w-full bg-red-500 text-white py-4 rounded-xl hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        <X className="w-5 h-5" />
                        End Call
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disease Prediction Modal */}
      <AnimatePresence>
        {showPredictionModal && !selectedPredictionType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPredictionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  Disease Prediction
                </h3>
                <button
                  onClick={() => setShowPredictionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">Select a prediction track to analyze your health risks</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPredictionType("heart")}
                  className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 text-left hover:from-red-600 hover:to-red-700 transition-all"
                >
                  <Heart className="w-8 h-8 mb-3" />
                  <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Heart Disease</h4>
                  <p className="text-sm text-red-100">Predict cardiovascular disease risk</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPredictionType("diabetes")}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 text-left hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  <Droplet className="w-8 h-8 mb-3" />
                  <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Diabetes</h4>
                  <p className="text-sm text-blue-100">Assess diabetes risk factors</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPredictionType("kidney")}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 text-left hover:from-purple-600 hover:to-purple-700 transition-all"
                >
                  <Activity className="w-8 h-8 mb-3" />
                  <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Chronic Kidney Disease</h4>
                  <p className="text-sm text-purple-100">Evaluate kidney function</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPredictionType("sepsis")}
                  className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 text-left hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  <AlertCircle className="w-8 h-8 mb-3" />
                  <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>Sepsis</h4>
                  <p className="text-sm text-orange-100">Early sepsis detection</p>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showPredictionModal && selectedPredictionType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowPredictionModal(false);
              setSelectedPredictionType(null);
              setPredictionInputs({});
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    {selectedPredictionType === "heart" && "Heart Disease Prediction"}
                    {selectedPredictionType === "diabetes" && "Diabetes Prediction"}
                    {selectedPredictionType === "kidney" && "Chronic Kidney Disease Prediction"}
                    {selectedPredictionType === "sepsis" && "Sepsis Prediction"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Fill in the required medical parameters</p>
                </div>
                <button
                  onClick={() => {
                    setShowPredictionModal(false);
                    setSelectedPredictionType(null);
                    setPredictionInputs({});
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {getPredictionFields(selectedPredictionType).map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={predictionInputs[field.name] || ""}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, [field.name]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        step={field.step}
                        placeholder={field.placeholder}
                        value={predictionInputs[field.name] || ""}
                        onChange={(e) => setPredictionInputs({ ...predictionInputs, [field.name]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedPredictionType(null);
                    setPredictionInputs({});
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Back
                </button>
                <button
                  onClick={handlePredictionSubmit}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Predict
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications - Top Right */}
      <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
        <AnimatePresence>
          {toastNotifications.map((notif) => {
            const Icon = notif.icon;
            const bgColors = {
              info: "bg-blue-500",
              success: "bg-green-500",
              warning: "bg-yellow-500",
              error: "bg-red-500"
            };
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-start gap-3"
              >
                <div className={`p-2 rounded-xl ${bgColors[notif.type]} bg-opacity-10`}>
                  <Icon className={`w-5 h-5 ${bgColors[notif.type].replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    {notif.message}
                  </p>
                </div>
                <button
                  onClick={() => setToastNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Chatbot */}
      <Chatbot userType="patient" />
    </div>
  );
}
