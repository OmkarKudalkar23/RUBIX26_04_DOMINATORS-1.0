import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Chatbot } from "./Chatbot";
import { InventoryTab } from "./InventoryTab";
import {
  getHospitalBeds,
  updateHospitalBed,
  getHospitalDoctorSlots,
  toggleHospitalDoctorSlot,
  toggleDoctorActive, // Added import
  getHospitalStaff,
  updateHospitalStaffStatus,
  deleteHospitalStaff,
  getHospitalSurgeAlerts,
  getHospitalEnvironment,
  getHospitalAppointments,
  updateHospitalProfile,
  changeHospitalPassword,
  getEarlyWarning,
  getHospitalLoad,
  checkInOpdPatient,
  getOpdQueue,
  updateOpdQueueEntry,
  getHospitalDoctors,
  createHospitalBed,
  createHospitalDoctor,
  createHospitalStaff,
  createHospitalAppointment,
  createHospitalSurgeAlert,
  type BedData,
  type DoctorSlot,
  type StaffMember,
  type SurgeAlert,
  type EnvironmentalData,
  type HospitalAppointment,
  type OpdCheckIn,
  type HospitalDoctor,
} from "../services/api";
import {
  getCentralizedHospitalCapacity,
  type CentralizedHospitalData,
  type CentralizedCapacityResponse,
} from "../services/centralizedApi";
import {
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Bell,
  Settings,
  LogOut,
  Menu,
  Home,
  X,
  AlertTriangle,
  Activity,
  Users,
  Hospital,
  Stethoscope,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  Heart,
  Wind,
  Thermometer,
  Cloud,
  Shield,
  Info,
  Eye,
  Edit,
  Plus,
  Minus,
  BedDouble,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  DoorOpen,
  Briefcase,
  ClipboardList,
  FileText,
  Download,
  Upload,
  BarChart3 as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Moon,
  Sun,
  Globe,
  Package,
  Lock,
  Save,
  Trash2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { translations } from "../utils/translations";
import { AnalyticsTab } from './AnalyticsTab';
import { OpdDashboard } from './OpdDashboard';
import { CentralizedDashboard } from './CentralizedDashboard';

interface HospitalDashboardProps {
  onLogout: () => void;
}

// Interfaces are now imported from api.ts

export function HospitalDashboard({ onLogout }: HospitalDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const [showBedModal, setShowBedModal] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<Array<{
    id: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    icon: any;
  }>>([]);
  const [showDoctorSlotModal, setShowDoctorSlotModal] = useState(false);
  const [selectedDoctorSlot, setSelectedDoctorSlot] = useState<DoctorSlot | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showSurgeDetailModal, setShowSurgeDetailModal] = useState(false);
  const [selectedSurge, setSelectedSurge] = useState<SurgeAlert | null>(null);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");

  // User State
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
  }, []);

  // Settings states
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [showAlertConfigModal, setShowAlertConfigModal] = useState(false);

  // Manual Entry Modals
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [showAddAlertModal, setShowAddAlertModal] = useState(false);

  // Manual Appointment Form
  const [manualAppointmentForm, setManualAppointmentForm] = useState({
    patientName: "",
    doctorName: "",
    department: "",
    date: new Date().toISOString().split('T')[0],
    time: "10:00",
    type: "OPD"
  });

  // Manual Alert Form
  const [manualAlertForm, setManualAlertForm] = useState({
    type: "epidemic",
    message: "",
    severity: "high"
  });

  // Alert Configuration
  const [alertConfig, setAlertConfig] = useState({
    aqiThreshold: 300,
    tempThreshold: 40,
    surgeThreshold: 30,
    enablePollutionAlerts: true,
    enableSeasonalAlerts: true,
    enableSurgeAlerts: true,
  });

  // Change password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Update profile form
  const [profileForm, setProfileForm] = useState({
    hospitalName: "City General Hospital",
    email: "admin@cityhospital.com",
    phone: "+1 (555) 987-6543",
    address: "123 Healthcare Blvd, Medical District",
  });

  // State - All data fetched from backend
  const [beds, setBeds] = useState<BedData[]>([]);
  const [doctorSlots, setDoctorSlots] = useState<DoctorSlot[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [surgeAlerts, setSurgeAlerts] = useState<SurgeAlert[]>([]);
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData | null>(null);
  const [appointments, setAppointments] = useState<HospitalAppointment[]>([]);
  const [opdQueue, setOpdQueue] = useState<OpdCheckIn[]>([]);
  const [hospitalDoctors, setHospitalDoctors] = useState<HospitalDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Centralized Dashboard State
  const [centralizedData, setCentralizedData] = useState<CentralizedCapacityResponse | null>(null);
  const [centralizedLoading, setCentralizedLoading] = useState(false);

  // OPD Check-in form state
  const [opdForm, setOpdForm] = useState({
    patientName: '',
    department: '',
    doctorName: '',
    visitType: 'OPD' as "OPD" | "Follow-up",
    priority: 'normal' as "low" | "normal" | "high" | "critical",
    estimatedArrivalTime: '',
    consultationComplexity: 'medium' as "low" | "medium" | "high",
    isEmergency: false,
    arrivalStatus: 'waiting' as "arrived" | "delayed" | "no-show" | "on-time" | "waiting"
  });

  // New Resource Forms State
  const [newBedForm, setNewBedForm] = useState({ type: "", total: 10 });

  const [newDoctorForm, setNewDoctorForm] = useState({
    name: "",
    email: "",
    specialization: "",
    department: ""
  });

  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    role: "Nurse" as "Nurse" | "Technician" | "Support" | "Admin",
    department: "",
    shift: "Morning" as "Morning" | "Evening" | "Night"
  });

  // New Resource Handlers
  const handleAddBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBed = await createHospitalBed({ ...newBedForm, type: newBedForm.type.trim() });
      setBeds(prev => [...prev, newBed]);
      toast.success("New ward added successfully");
      setShowAddBedModal(false);
      setNewBedForm({ type: "", total: 10 });
    } catch (error: any) {
      console.error("Error adding ward:", error);
      toast.error(error.message || "Failed to add ward");
    }
  };

  const handleAddDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newDoc = await createHospitalDoctor(newDoctorForm);
      setHospitalDoctors(prev => [...prev, newDoc]);
      // Trigger a refresh of doctor slots to generate the new slots
      getHospitalDoctorSlots().then(slots => setDoctorSlots(slots));

      toast.success("Doctor added successfully. Schedule initialized.");
      setShowAddDoctorModal(false);
      setNewDoctorForm({ name: "", email: "", specialization: "", department: "" });
    } catch (error: any) {
      console.error("Error adding doctor:", error);
      toast.error(error.message || "Failed to add doctor");
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newStaffMember = await createHospitalStaff({
        ...newStaffForm,
        status: 'active'
      });
      setStaff(prev => [...prev, newStaffMember]);
      toast.success("Staff member added successfully");
      setShowAddStaffModal(false);
      setNewStaffForm({
        name: "",
        role: "Nurse",
        department: "",
        shift: "Morning"
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add staff");
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAppt = await createHospitalAppointment(manualAppointmentForm);
      setAppointments(prev => [...prev, newAppt]);
      toast.success("Appointment scheduled successfully");
      setShowAddAppointmentModal(false);
      // Reset form
      setManualAppointmentForm({
        patientName: "",
        doctorName: "",
        department: "",
        date: new Date().toISOString().split('T')[0],
        time: "10:00",
        type: "OPD"
      });
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      toast.error(error.message || "Failed to schedule appointment");
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAlert = await createHospitalSurgeAlert(manualAlertForm);
      setSurgeAlerts(prev => [...prev, newAlert]);
      toast.success("Surge alert broadcasted successfully");
      setShowAddAlertModal(false);
      setManualAlertForm({
        type: "epidemic",
        message: "",
        severity: "high"
      });
    } catch (error: any) {
      console.error("Error creating alert:", error);
      toast.error(error.message || "Failed to broadcast alert");
    }
  };
  // Translations helper
  const t = translations[language as keyof typeof translations] || translations['English'];

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [
          bedsData,
          doctorSlotsData,
          staffData,
          surgeAlertsData,
          environmentDataResp,
          appointmentsData,
          opdQueueData,
          hospitalDoctorsData,
          earlyWarningData,
          hospitalLoadData
        ] = await Promise.allSettled([
          getHospitalBeds(),
          getHospitalDoctorSlots(),
          getHospitalStaff(),
          getHospitalSurgeAlerts(),
          getHospitalEnvironment(),
          getHospitalAppointments(),
          getOpdQueue(),
          getHospitalDoctors(),
          getEarlyWarning('Mumbai').catch(() => null), // Default to Mumbai
          getHospitalLoad('Mumbai').catch(() => null) // Default to Mumbai
        ]);

        setBeds(bedsData.status === 'fulfilled' ? bedsData.value : []);
        setDoctorSlots(doctorSlotsData.status === 'fulfilled' ? doctorSlotsData.value : []);
        setStaff(staffData.status === 'fulfilled' ? staffData.value : []);
        setOpdQueue(opdQueueData.status === 'fulfilled' ? opdQueueData.value : []);
        setHospitalDoctors(hospitalDoctorsData.status === 'fulfilled' ? hospitalDoctorsData.value : []);

        // Merge surge alerts with early warning alerts
        const allSurgeAlerts: SurgeAlert[] = [];

        // Add regular surge alerts
        if (surgeAlertsData.status === 'fulfilled') {
          allSurgeAlerts.push(...surgeAlertsData.value);
        }

        // Add early warning alerts if available
        if (earlyWarningData.status === 'fulfilled' && earlyWarningData.value) {
          const ew = earlyWarningData.value;
          if (ew.alert_level && ew.alert_level !== 'NORMAL') {
            // Map alert level to severity
            const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
              'INFO': 'low',
              'WATCH': 'medium',
              'WARNING': 'high',
              'CRITICAL': 'high'
            };

            // Map alert level to type
            const typeMap: Record<string, 'pollution' | 'seasonal' | 'epidemic' | 'weather'> = {
              'INFO': 'epidemic',
              'WATCH': 'epidemic',
              'WARNING': 'epidemic',
              'CRITICAL': 'epidemic'
            };

            const earlyWarningSurgeAlert: SurgeAlert = {
              id: `early-warning-${Date.now()}`,
              type: typeMap[ew.alert_level] || 'epidemic',
              severity: severityMap[ew.alert_level] || 'medium',
              title: `Early Warning: ${ew.alert_level} Alert`,
              message: ew.message || `Disease outbreak early warning detected. ${ew.total_anomalies} anomalies detected with ${ew.max_spike_percentage.toFixed(1)}% spike.`,
              department: 'Emergency',
              expectedIncrease: Math.round(ew.forecast_increase_percentage || 0),
              timestamp: new Date().toISOString(),
            };
            allSurgeAlerts.push(earlyWarningSurgeAlert);
          }
        }

        setSurgeAlerts(allSurgeAlerts);
        setEnvironmentalData(environmentDataResp.status === 'fulfilled' ? environmentDataResp.value : null);
        setAppointments(appointmentsData.status === 'fulfilled' ? appointmentsData.value : []);

        // Log hospital load if available
        if (hospitalLoadData.status === 'fulfilled' && hospitalLoadData.value) {
          console.log('Hospital load forecast:', hospitalLoadData.value);
        }
      } catch (err: any) {
        console.error("Error loading hospital dashboard data:", err);
        setError(err.message || "Failed to load hospital dashboard data");
        toast.error("Failed to load hospital dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // REMOVED ALL HARDCODED DATA - Now fetched from backend via useEffect above

  // Calculate statistics (with guards for empty data)
  const totalBeds = beds.reduce((sum, bed) => sum + bed.total, 0);
  const totalOccupied = beds.reduce((sum, bed) => sum + bed.occupied, 0);
  const totalAvailable = beds.reduce((sum, bed) => sum + bed.available, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  const activeStaff = staff.filter((s) => s.status === "active").length;
  const totalStaff = staff.length;

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Appointments (all + OPD slices) for today
  const todaysAppointments = appointments.filter((a) => a.date === today);
  const todayAppointments = todaysAppointments.length;

  const todaysOpdAppointments = todaysAppointments.filter((a) => a.type === "OPD");
  const todaysOpdScheduled = todaysOpdAppointments.filter((a) => a.status === "scheduled");
  const todaysOpdCompleted = todaysOpdAppointments.filter((a) => a.status === "completed");

  const totalSlots = doctorSlots.reduce((sum, ds) => sum + ds.slots.length, 0);
  const bookedSlots = doctorSlots.reduce(
    (sum, ds) => sum + ds.slots.filter((s) => s.status === "booked").length,
    0
  );

  // Real-time polling for checking doctor status and queue updates
  useEffect(() => {
    if (!user?.hospitalId) return;

    const intervalId = setInterval(() => {
      // Fetch Doctor Slots (for Status dots)
      getHospitalDoctorSlots()
        .then((data) => setDoctorSlots(data))
        .catch((err) => console.error("Polling slots error:", err));

      // Fetch Queue (for lists)
      getOpdQueue()
        .then((data) => setOpdQueue(data))
        .catch((err) => console.error("Polling queue error:", err));

    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [user?.hospitalId]);

  const highSeverityAlerts = surgeAlerts.filter((a) => a.severity === "high").length;

  // Handle bed operations - Now using API
  const handleUpdateBedCount = async (bedId: string, change: number) => {
    try {
      const bed = beds.find((b) => b.id === bedId);
      if (!bed) return;

      const newTotal = Math.max(0, bed.total + change);
      const updatedBed = await updateHospitalBed(bedId, { total: newTotal });

      setBeds((prevBeds) =>
        prevBeds.map((b) => (b.id === bedId ? updatedBed : b))
      );
      toast.success(`Bed count updated for ${bed.type} ward`);
    } catch (error: any) {
      console.error("Error updating bed count:", error);
      toast.error(error.message || "Failed to update bed count");
    }
  };

  const handleOccupyBed = async (bed: any, bedNumber?: number) => {
    try {
      const payload: any = { action: "occupy" };
      if (bedNumber !== undefined) {
        payload.bedNumber = bedNumber;
      }
      const updatedBed = await updateHospitalBed(bed.id, payload);
      setBeds((prevBeds) =>
        prevBeds.map((b) => (b.id === bed.id ? updatedBed : b))
      );
      toast.success(bedNumber ? `Bed #${bedNumber} occupied` : "Bed occupied successfully");
    } catch (error: any) {
      console.error("Error occupying bed:", error);
      toast.error(error.message || "Failed to occupy bed");
    }
  };

  const handleReleaseBed = async (bed: any, bedNumber?: number) => {
    try {
      const payload: any = { action: "release" };
      if (bedNumber !== undefined) {
        payload.bedNumber = bedNumber;
      }
      const updatedBed = await updateHospitalBed(bed.id, payload);
      setBeds((prevBeds) =>
        prevBeds.map((b) => (b.id === bed.id ? updatedBed : b))
      );
      toast.success(bedNumber ? `Bed #${bedNumber} released` : "Bed released successfully");
    } catch (error: any) {
      console.error("Error releasing bed:", error);
      toast.error(error.message || "Failed to release bed");
    }
  };

  // Handle slot operations
  const handleToggleSlot = async (doctorId: string, slotIndex: number) => {
    try {
      const updatedSlot = await toggleHospitalDoctorSlot(doctorId, slotIndex);
      setDoctorSlots((prevSlots) =>
        prevSlots.map((doctor) => (doctor.id === doctorId ? updatedSlot : doctor))
      );
      const slot = updatedSlot.slots[slotIndex];
      if (slot.status === "blocked") {
        toast.success("Slot blocked");
      } else if (slot.status === "available") {
        toast.success("Slot unblocked");
      }
    } catch (error: any) {
      console.error("Error toggling slot:", error);
      toast.error(error.message || "Failed to toggle slot");
    }
  };

  const handleDoctorStatusToggle = async (slotId: string) => {
    try {
      const updated = await toggleDoctorActive(slotId);
      setDoctorSlots((prevSlots) =>
        prevSlots.map((doctor) => (doctor.id === slotId ? { ...doctor, ...updated } : doctor))
      );
      toast.success(updated.isActive ? "Doctor is now On Duty" : "Doctor is now Off Duty");
    } catch (error: any) {
      console.error("Error toggling doctor status:", error);
      toast.error(error.message || "Failed to toggle doctor status");
    }
  };

  // Handle staff operations
  const handleUpdateStaffStatus = async (staffId: string, newStatus: StaffMember["status"]) => {
    try {
      const updatedStaff = await updateHospitalStaffStatus(staffId, newStatus);
      setStaff((prevStaff) =>
        prevStaff.map((s) => (s.id === staffId ? updatedStaff : s))
      );
      toast.success(`Staff status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating staff status:", error);
      toast.error(error.message || "Failed to update staff status");
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      await deleteHospitalStaff(staffId);
      setStaff((prevStaff) => prevStaff.filter((s) => s.id !== staffId));
      toast.success("Staff member removed");
      setShowStaffModal(false);
      setSelectedStaff(null);
    } catch (error: any) {
      console.error("Error deleting staff:", error);
      toast.error(error.message || "Failed to delete staff member");
    }
  };

  // OPD Queue handlers
  const handleOpdCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newEntry = await checkInOpdPatient(opdForm);
      setOpdQueue((prev) => [...prev, newEntry]);
      setOpdForm({
        patientName: '',
        department: '',
        doctorName: '',
        visitType: 'OPD',
        priority: 'normal',
        estimatedArrivalTime: '',
        consultationComplexity: 'medium',
        isEmergency: false,
        arrivalStatus: 'waiting'
      });
      toast.success(`Patient ${opdForm.patientName} checked in successfully`);
    } catch (error: any) {
      console.error('Error checking in patient:', error);
      toast.error(error.message || 'Failed to check in patient');
    }
  };

  const handleUpdateOpdStatus = async (id: string, status: string) => {
    try {
      const updated = await updateOpdQueueEntry(id, { status: status as any });
      setOpdQueue((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));

      // Refresh Doctor Slots immediately to reflect Busy/Free status change in Right Panel
      getHospitalDoctorSlots()
        .then((data) => setDoctorSlots(data))
        .catch(console.error);

      toast.success(`Status updated to ${status}`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleUpdateOpdPriority = async (id: string, priority: string) => {
    try {
      const updated = await updateOpdQueueEntry(id, { priority: priority as any });
      setOpdQueue((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
      toast.success(`Priority updated to ${priority}`);
    } catch (error: any) {
      console.error('Error updating priority:', error);
      toast.error(error.message || 'Failed to update priority');
    }
  };

  // Refresh OPD queue periodically
  useEffect(() => {
    if (activeTab !== 'opd') return;



    const interval = setInterval(async () => {
      try {
        const freshQueue = await getOpdQueue();
        setOpdQueue(freshQueue);
      } catch (error) {
        console.error('Error refreshing OPD queue:', error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  // Fetch centralized data when city tab is active
  useEffect(() => {
    if (activeTab !== 'city') return;

    const fetchCentralizedData = async () => {
      try {
        setCentralizedLoading(true);
        const data = await getCentralizedHospitalCapacity();
        setCentralizedData(data);
      } catch (error) {
        console.error('Error fetching centralized data:', error);
        toast.error('Failed to load city dashboard data');
      } finally {
        setCentralizedLoading(false);
      }
    };

    fetchCentralizedData();

    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchCentralizedData, 5 * 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Handle change password - Now using API
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await changeHospitalPassword({
        currentPassword,
        newPassword
      });
      toast.success("Password changed successfully");
      setShowChangePasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    }
  };

  // Handle update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateHospitalProfile({
        hospitalName: profileForm.hospitalName,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address
      });
      toast.success("Profile updated successfully");
      setShowUpdateProfileModal(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    }
  };

  // Handle alert configuration
  const handleSaveAlertConfig = () => {
    toast.success("Alert configuration saved successfully");
    setShowAlertConfigModal(false);
  };

  // Get surge color
  const getSurgeColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "low":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getSurgeIcon = (type: string) => {
    switch (type) {
      case "pollution":
        return <Wind className="w-5 h-5" />;
      case "seasonal":
        return <Cloud className="w-5 h-5" />;
      case "epidemic":
        return <AlertTriangle className="w-5 h-5" />;
      case "weather":
        return <Thermometer className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // Filter logic
  const filteredDoctorSlots = doctorSlots.filter((ds) => {
    const matchesSearch =
      ds.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === "all" || ds.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === "all" || s.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  // Function to add toast notification
  const addToastNotification = (message: string, type: "info" | "success" | "warning" | "error", icon: any) => {
    const id = Date.now().toString();
    setToastNotifications(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => {
      setToastNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  // Show notification popup on login if there are high severity alerts
  useEffect(() => {
    const hasSeenNotificationPopup = sessionStorage.getItem('hasSeenHospitalNotificationPopup');
    if (!hasSeenNotificationPopup && highSeverityAlerts > 0) {
      setTimeout(() => {
        setShowNotificationPopup(true);
        sessionStorage.setItem('hasSeenHospitalNotificationPopup', 'true');
      }, 2000);
    }
  }, []);

  // Show missed notifications on login
  useEffect(() => {
    const hasSeenMissedNotifications = sessionStorage.getItem('hasSeenHospitalMissedNotifications');
    if (!hasSeenMissedNotifications) {
      const missedNotifications = [
        { message: "Patient Surge Alert: Immediate attention required in ER", type: "error" as const, icon: AlertCircle, delay: 1000 },
        { message: "New bed allocation request in ICU", type: "warning" as const, icon: Hospital, delay: 1500 },
        { message: "Night shift staff allocation completed", type: "success" as const, icon: Users, delay: 2000 },
        { message: "Equipment maintenance scheduled for OR-3", type: "info" as const, icon: Settings, delay: 2500 },
        { message: "Bed Capacity Alert: 90% occupancy in Cardiology", type: "warning" as const, icon: Activity, delay: 3000 },
      ];

      missedNotifications.forEach((notif) => {
        setTimeout(() => {
          addToastNotification(notif.message, notif.type, notif.icon);
        }, notif.delay);
      });

      sessionStorage.setItem('hasSeenHospitalMissedNotifications', 'true');
    }
  }, []);

  // Simulate real-time notifications
  useEffect(() => {
    const notificationIntervals: NodeJS.Timeout[] = [];

    // Simulate surge alerts
    const surgeInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const alertTypes = ["Patient Surge", "Bed Capacity Alert", "Emergency Influx"];
        const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        addToastNotification(
          `${randomAlert}: Immediate attention required`,
          "error",
          AlertCircle
        );
      }
    }, 45000); // Every 45 seconds

    // Simulate bed requests
    const bedInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        addToastNotification(
          "New bed allocation request in ICU",
          "warning",
          Hospital
        );
      }
    }, 35000); // Every 35 seconds

    // Simulate staff updates
    const staffInterval = setInterval(() => {
      if (Math.random() > 0.75) {
        addToastNotification(
          "Staff shift change notification",
          "info",
          Users
        );
      }
    }, 55000); // Every 55 seconds

    notificationIntervals.push(surgeInterval, bedInterval, staffInterval);

    return () => {
      notificationIntervals.forEach(interval => clearInterval(interval));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1
                className="text-xl md:text-2xl uppercase tracking-wide"
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
              >
                Hospital Database
              </h1>
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setShowNotificationPopup(true)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
                {highSeverityAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center bg-red-500 text-white" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    {highSeverityAlerts}
                  </span>
                )}
              </button>
              <button
                onClick={onLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2
                    className="text-xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    Menu
                  </h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {[
                    { id: "dashboard", icon: Home, label: t.dashboard },
                    { id: "beds", icon: BedDouble, label: t.bedManagement },
                    { id: "opd", icon: Clock, label: t.opdQueue },

                    { id: "staff", icon: Users, label: t.staffAllocation },
                    { id: "surge", icon: TrendingUp, label: t.surgeAlerts },
                    { id: "appointments", icon: Calendar, label: t.appointments },
                    { id: "inventory", icon: Package, label: t.inventory },
                    { id: "city", icon: Globe, label: "City Dashboard" },
                    { id: "settings", icon: Settings, label: t.settings },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                        ? "bg-black text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm uppercase tracking-wide">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-[73px] bottom-0 w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <nav className="p-4 space-y-2">
          {[
            { id: "dashboard", icon: Home, label: t.dashboard },
            { id: "beds", icon: BedDouble, label: t.bedManagement },
            { id: "opd", icon: Clock, label: t.opdQueue },

            { id: "staff", icon: Users, label: t.staffAllocation },
            { id: "surge", icon: TrendingUp, label: t.surgeAlerts },
            { id: "appointments", icon: Calendar, label: t.appointments },
            { id: "inventory", icon: Package, label: t.inventory },
            { id: "city", icon: Globe, label: "City Dashboard" },
            { id: "settings", icon: Settings, label: t.settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${activeTab === item.id
                ? "bg-black text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="uppercase tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-[73px] md:ml-64 p-4 md:p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading hospital dashboard...</p>
            </div>
          </div>
        )}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {!isLoading && !error && (
          <React.Fragment>
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2
                      className="text-2xl md:text-3xl uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                    >
                      {t.dashboardOverview}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {t.dashboardSubtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toast.success(t.dataRefreshed)}
                      className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      {t.refresh}
                    </button>
                  </div>
                </div>

                {/* Environmental Alert Banner */}
                {environmentalData && environmentalData.aqi > 300 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4 md:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-100 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                          {t.highPollutionAlert}
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">
                          AQI: {environmentalData?.aqi || 0} - {environmentalData?.pollutionLevel || "N/A"} | Expect surge in respiratory patients
                        </p>
                        <button
                          onClick={() => setActiveTab("surge")}
                          className="text-sm text-red-700 hover:underline flex items-center gap-1"
                        >
                          {t.viewRecommendations} <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Key Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Bed Occupancy */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 cursor-pointer"
                    onClick={() => setActiveTab("beds")}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white rounded-xl">
                        <BedDouble className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                        {occupancyRate}%
                      </span>
                    </div>
                    <h3 className="text-sm uppercase tracking-wide mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      {t.bedOccupancy}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {totalOccupied}/{totalBeds} {t.bedsOccupied}
                    </p>
                  </motion.div>

                  {/* Active Staff */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 cursor-pointer"
                    onClick={() => setActiveTab("staff")}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white rounded-xl">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                        {activeStaff}
                      </span>
                    </div>
                    <h3 className="text-sm uppercase tracking-wide mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      {t.activeStaff}
                    </h3>
                    <p className="text-xs text-gray-600">
                      Out of {totalStaff} {t.totalStaff}
                    </p>
                  </motion.div>

                  {/* Today's Appointments */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 cursor-pointer"
                    onClick={() => setActiveTab("appointments")}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white rounded-xl">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                        {todayAppointments}
                      </span>
                    </div>
                    <h3 className="text-sm uppercase tracking-wide mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      {t.todayAppointments}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {bookedSlots}/{totalSlots} {t.slotsBooked}
                    </p>
                  </motion.div>

                  {/* Active Alerts */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 cursor-pointer"
                    onClick={() => setActiveTab("surge")}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <span className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                        {highSeverityAlerts}
                      </span>
                    </div>
                    <h3 className="text-sm uppercase tracking-wide mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      {t.highPriorityAlerts}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {surgeAlerts.length} {t.alertsActive}
                    </p>
                  </motion.div>
                </div>

                {/* OPD Command Center (AI-style dashboard) */}
                {(() => {
                  const completionRate = todaysOpdAppointments.length > 0
                    ? Math.round((todaysOpdCompleted.length / todaysOpdAppointments.length) * 100)
                    : 0;

                  const departmentData = todaysOpdAppointments.reduce((acc: any, apt) => {
                    acc[apt.department] = (acc[apt.department] || 0) + 1;
                    return acc;
                  }, {});
                  const departmentChartData = Object.entries(departmentData).map(([name, value]) => ({ name, value }));

                  const statusData = [
                    { name: "Completed", value: todaysOpdCompleted.length, color: "#10b981" },
                    { name: "Scheduled", value: todaysOpdScheduled.length, color: "#f59e0b" },
                    { name: "Cancelled", value: todaysOpdAppointments.filter(a => a.status === "cancelled").length, color: "#ef4444" },
                  ].filter(x => x.value > 0);

                  const timeSlotData = todaysOpdAppointments.reduce((acc: any, apt) => {
                    const hour = apt.time.split(':')[0] + (apt.time.includes('PM') && parseInt(apt.time.split(':')[0]) !== 12 ? 12 : 0);
                    const slot = hour < 12 ? `${hour}:00 AM` : hour === 12 ? "12:00 PM" : `${hour - 12}:00 PM`;
                    acc[slot] = (acc[slot] || 0) + 1;
                    return acc;
                  }, {});
                  const timeSlotChartData = Object.entries(timeSlotData)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => {
                      const aHour = parseInt(a.name.split(':')[0]) + (a.name.includes('PM') && parseInt(a.name.split(':')[0]) !== 12 ? 12 : 0);
                      const bHour = parseInt(b.name.split(':')[0]) + (b.name.includes('PM') && parseInt(b.name.split(':')[0]) !== 12 ? 12 : 0);
                      return aHour - bHour;
                    });

                  const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];

                  return (
                    <div className="mt-4 rounded-2xl p-6 bg-white shadow-xl border border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-xl md:text-2xl uppercase tracking-wide mb-1 text-black" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            {t.opdCommandCenter}
                          </h3>
                          <p className="text-xs text-gray-600">{t.opdSubtitle}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-2 bg-indigo-100 rounded-xl text-xs uppercase tracking-wide border border-indigo-200 text-indigo-700">
                            {t.completed}: {completionRate}%
                          </div>
                          <button
                            onClick={() => setActiveTab("doctors")}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-colors text-xs md:text-sm uppercase tracking-wide shadow-md"
                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                          >
                            <Stethoscope className="w-4 h-4" />
                            {t.manageOpd}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase tracking-wide text-blue-700 font-semibold">{t.totalOpd}</span>
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-4xl font-black text-black" style={{ fontFamily: "'Doto', sans-serif" }}>{todaysOpdAppointments.length}</div>
                          <p className="text-[11px] text-gray-600 mt-1">{t.scheduledToday}</p>
                        </div>
                        <div className="rounded-xl p-4 bg-orange-50 border border-orange-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase tracking-wide text-orange-700 font-semibold">{t.waiting}</span>
                            <Clock className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="text-4xl font-black text-black" style={{ fontFamily: "'Doto', sans-serif" }}>{todaysOpdScheduled.length}</div>
                          <p className="text-[11px] text-gray-600 mt-1">{t.notCompleted}</p>
                        </div>
                        <div className="rounded-xl p-4 bg-green-50 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase tracking-wide text-green-700 font-semibold">{t.completed}</span>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="text-4xl font-black text-black" style={{ fontFamily: "'Doto', sans-serif" }}>{todaysOpdCompleted.length}</div>
                          <p className="text-[11px] text-gray-600 mt-1">{t.doneToday}</p>
                        </div>
                      </div>



                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
                          <h4 className="text-sm uppercase tracking-wide mb-3 text-black" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            {t.departmentMix}
                          </h4>
                          {departmentChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Tooltip />
                                <Legend />
                                <Pie data={departmentChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                                  {departmentChartData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">No data</div>
                          )}
                        </div>

                        <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
                          <h4 className="text-sm uppercase tracking-wide mb-3 text-black" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            {t.statusMix}
                          </h4>
                          {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Tooltip />
                                <Legend />
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                                  {statusData.map((s, idx) => <Cell key={idx} fill={s.color} />)}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">No data</div>
                          )}
                        </div>

                        <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
                          <h4 className="text-sm uppercase tracking-wide mb-3 text-black" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            {t.timeSlotTrend}
                          </h4>
                          {timeSlotChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                              <LineChart data={timeSlotChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#374151" />
                                <YAxis stroke="#374151" />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">No data</div>
                          )}
                        </div>
                      </div>

                      {/* Live OPD table */}
                      <div className="rounded-xl p-5 bg-gray-50 border border-gray-200 overflow-x-auto">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm uppercase tracking-wide text-black" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            {t.liveOpdQueue}
                          </h4>
                          <span className="text-xs text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-300">
                            {t.showing} {Math.min(todaysOpdAppointments.length, 10)} {t.of} {todaysOpdAppointments.length}
                          </span>
                        </div>
                        {todaysOpdAppointments.length === 0 ? (
                          <div className="py-10 text-center text-gray-500 text-sm">{t.noOpdAppointments}</div>
                        ) : (
                          <div className="min-w-full">
                            <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-300">
                              <span>{t.time}</span>
                              <span>{t.patient}</span>
                              <span>{t.doctor}</span>
                              <span>{t.department}</span>
                              <span className="text-right">{t.status}</span>
                            </div>
                            <div className="space-y-2">
                              {todaysOpdAppointments
                                .slice()
                                .sort((a, b) => (a.time > b.time ? 1 : -1))
                                .slice(0, 10)
                                .map((apt) => (
                                  <div key={apt.id} className="grid grid-cols-5 gap-4 py-3 px-2 rounded-lg text-xs border border-gray-200 bg-white">
                                    <span className="font-semibold text-black">{apt.time}</span>
                                    <span className="text-gray-700 truncate">{apt.patientName}</span>
                                    <span className="text-gray-600 truncate">{apt.doctorName}</span>
                                    <span className="text-gray-600 truncate">{apt.department}</span>
                                    <span className="text-right">
                                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${apt.status === "completed"
                                        ? "bg-green-100 text-green-700 border border-green-300"
                                        : apt.status === "cancelled"
                                          ? "bg-red-100 text-red-700 border border-red-300"
                                          : "bg-amber-100 text-amber-700 border border-amber-300"
                                        }`}>
                                        {apt.status}
                                      </span>
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Bed Status Grid */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                    >
                      {t.bedStatusByType}
                    </h3>
                    <button
                      onClick={() => setActiveTab("beds")}
                      className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
                    >
                      {t.viewAll} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {beds.map((bed) => (
                      <div key={bed.id} className="bg-white rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                            {bed.type}
                          </span>
                          <span className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap ${bed.available < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {bed.available} Available
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Total: {bed.total}</span>
                            <span>Occupied: {bed.occupied}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-black h-2 rounded-full transition-all"
                              style={{ width: `${(bed.occupied / bed.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Surge Alerts */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                    >
                      Recent Surge Predictions
                    </h3>
                    <button
                      onClick={() => setActiveTab("surge")}
                      className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
                    >
                      View all <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {surgeAlerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${getSurgeColor(alert.severity)}`}
                        onClick={() => {
                          setSelectedSurge(alert);
                          setShowSurgeDetailModal(true);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {getSurgeIcon(alert.type)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                                {alert.title}
                              </h4>
                              <span className="text-xs uppercase tracking-wide">
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-xs opacity-80 mb-2">{alert.message}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-white/50 rounded">
                                {alert.department}
                              </span>
                              <span className="px-2 py-1 bg-white/50 rounded">
                                +{alert.expectedIncrease}% expected
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Beds Tab */}
            {/* Beds Tab - VISUAL OVERHAUL */}
            {activeTab === "beds" && (
              <div className="space-y-8">
                <div className="sticky top-20 z-20 bg-gray-50/95 backdrop-blur-sm py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-gray-200 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all shadow-sm">
                  <div>
                    <h2
                      className="text-2xl md:text-3xl uppercase tracking-wide text-gray-900"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: "800" }}
                    >
                      {t.bedManagement}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {t.visualBedTracker}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Legend */}
                    <div className="hidden md:flex items-center gap-4 bg-white px-3 py-1.5 rounded-lg border border-gray-200 mr-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-700">{t.available}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-700">{t.occupied}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAddBedModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide shadow-md hover:shadow-lg"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: "600" }}
                    >
                      <Plus className="w-4 h-4" />
                      {t.addBedType}
                    </button>
                  </div>
                </div>

                {/* Bed Wards Visual Grid */}
                <div className="grid grid-cols-1 gap-8">
                  {beds.map((bed) => (
                    <div key={bed.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-12">
                      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-50 rounded-2xl">
                            <BedDouble className="w-6 h-6 text-gray-900" />
                          </div>
                          <div>
                            <h3
                              className="text-xl uppercase tracking-wide text-gray-900"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: "700" }}
                            >
                              {bed.type} Ward
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <span className="font-medium text-gray-900">{bed.occupied}</span> {t.occupied}
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className="font-medium text-gray-900">{bed.available}</span> {t.available}
                            </div>
                          </div>
                        </div>

                        {/* Occupancy Percentage Badge */}
                        <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${(bed.occupied / bed.total) >= 0.9 ? 'bg-red-50 text-red-600' :
                          (bed.occupied / bed.total) >= 0.7 ? 'bg-orange-50 text-orange-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                          <Activity className="w-4 h-4" />
                          {Math.round((bed.occupied / bed.total) * 100)}% Full
                        </div>
                      </div>

                      {/* Visual Bed Grid */}
                      <div className="flex flex-wrap gap-3">
                        {/* 
                           If 'bed.beds' exists (backend supported), use it. 
                           Otherwise fallback to numeric loop for safety until migration is confirmed.
                        */}
                        {bed.beds && bed.beds.length > 0 ? (
                          // Sort by bed number just to be safe they appear in order
                          [...bed.beds].sort((a, b) => a.number - b.number).map((b) => (
                            <motion.button
                              key={b.number}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (b.status === 'occupied') {
                                  handleReleaseBed(bed, b.number);
                                } else {
                                  handleOccupyBed(bed, b.number);
                                }
                              }}
                              className={`
                                  relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                                  ${b.status === 'occupied'
                                  ? "bg-red-500 text-white shadow-lg shadow-red-200 ring-2 ring-red-100"
                                  : "bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 shadow-sm"}
                                `}
                            >
                              <BedDouble className={`w-5 h-5 ${b.status === 'occupied' ? "fill-current" : ""}`} />
                              <span className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full shadow-sm
                                  ${b.status === 'occupied' ? "bg-white text-red-600 border border-red-100" : "bg-emerald-600 text-white"}
                                `}>
                                {b.number}
                              </span>

                              {/* Tooltip */}
                              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                                {b.status === 'occupied' ? `${t.releaseBed} ${b.number}` : `${t.occupyBed} ${b.number}`}
                              </div>
                            </motion.button>
                          ))
                        ) : (
                          // Fallback Legacy Loop (should generally be replaced by above if backend works)
                          Array.from({ length: bed.total }).map((_, i) => {
                            const isOccupied = i < bed.occupied;
                            const bedNum = i + 1;
                            return (
                              <motion.button
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => isOccupied ? handleReleaseBed(bed, undefined) : handleOccupyBed(bed, undefined)}
                                className={`
                                  relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                                  ${isOccupied
                                    ? "bg-red-500 text-white shadow-lg shadow-red-200 ring-2 ring-red-100"
                                    : "bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 shadow-sm"}
                                `}
                              >
                                <BedDouble className={`w-5 h-5 ${isOccupied ? "fill-current" : ""}`} />
                                <span className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full shadow-sm
                                  ${isOccupied ? "bg-white text-red-600 border border-red-100" : "bg-emerald-600 text-white"}
                                `}>
                                  {bedNum}
                                </span>
                              </motion.button>
                            );
                          })
                        )}

                        {/* Add Bed Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={async () => {
                            try {
                              // Add bed action
                              const updated = await updateHospitalBed(bed.id, { action: 'add-bed' });
                              setBeds(beds.map(b => b.id === bed.id ? updated : b));
                              toast.success("New bed added to ward");
                            } catch (error: any) {
                              toast.error("Failed to add bed");
                            }
                          }}
                          className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border-2 border-dashed border-gray-300 text-gray-400 hover:border-black hover:text-black transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  ))}

                  {beds.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900">No Wards Configured</h3>
                      <p className="text-gray-500 mb-6">Start by adding a ward to manage beds.</p>
                      <button
                        onClick={() => setShowAddBedModal(true)}
                        className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                      >
                        {t.addBedType}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OPD Queue Tab */}
            {activeTab === "opd" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2
                    className="text-2xl md:text-3xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    {t.opdQueue}
                  </h2>
                  <div className="text-sm text-gray-600">
                    Auto-refreshes every 30 seconds
                  </div>
                </div>

                {/* Top Section: Check-in Form + Analytics Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Check-in Form - Left Half */}
                  <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                    <h3 className="text-base font-semibold mb-3" style={{ fontFamily: "'Doto', sans-serif" }}>
                      {t.patientCheckIn}
                    </h3>
                    <form onSubmit={handleOpdCheckIn} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Patient Name</label>
                          <input
                            type="text"
                            placeholder="Ex: John Doe"
                            value={opdForm.patientName}
                            onChange={(e: any) => setOpdForm({ ...opdForm, patientName: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                          <select
                            value={opdForm.department}
                            onChange={(e: any) => setOpdForm({ ...opdForm, department: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          >
                            <option value="">Select Department</option>
                            <option value="Cardiology">Cardiology</option>
                            <option value="Orthopedics">Orthopedics</option>
                            <option value="Pediatrics">Pediatrics</option>
                            <option value="General Medicine">General Medicine</option>
                            <option value="Neurology">Neurology</option>
                            <option value="ENT">ENT</option>
                            <option value="Dermatology">Dermatology</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Doctor</label>
                          <select
                            value={opdForm.doctorName}
                            onChange={(e: any) => setOpdForm({ ...opdForm, doctorName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          >
                            <option value="">Auto-Assign</option>
                            {hospitalDoctors.map((doctor) => (
                              <option key={doctor.id} value={doctor.name}>
                                {doctor.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Priority</label>
                          <select
                            value={opdForm.priority}
                            onChange={(e: any) => setOpdForm({ ...opdForm, priority: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          >
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>



                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">ETA</label>
                          <input
                            type="datetime-local"
                            value={opdForm.estimatedArrivalTime}
                            onChange={(e: any) => setOpdForm({ ...opdForm, estimatedArrivalTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Complexity</label>
                          <select
                            value={opdForm.consultationComplexity}
                            onChange={(e: any) => setOpdForm({ ...opdForm, consultationComplexity: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          >
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 px-3 py-2 border border-red-100 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={opdForm.isEmergency}
                            onChange={(e: any) => setOpdForm({ ...opdForm, isEmergency: e.target.checked })}
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                          />
                          <span className="text-xs font-bold text-red-700 uppercase">Emergency</span>
                        </label>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors uppercase tracking-wide text-sm font-semibold"
                        >
                          {t.checkIn}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Analytics Dashboard - Right Half */}
                  <OpdDashboard
                    opdQueue={opdQueue}
                    doctorSlots={doctorSlots}
                    onToggleDoctorActive={handleDoctorStatusToggle}
                  />
                </div>


                {/* Queue Display */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: "'Doto', sans-serif" }}>
                    Current Queue                   </h3>
                  {opdQueue.filter((e: any) => e.status !== 'completed' && e.status !== 'no-show').length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                      No patients in queue
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {opdQueue
                        .filter((e: any) => e.status !== 'completed' && e.status !== 'no-show')
                        .sort((a: any, b: any) => {
                          // Prefer priorityScore if available (Higher score = Higher priority)
                          if (a.priorityScore !== undefined && b.priorityScore !== undefined) {
                            return b.priorityScore - a.priorityScore;
                          }
                          const priorityOrder: any = { critical: 0, high: 1, normal: 2, low: 3 };
                          return priorityOrder[a.priority] - priorityOrder[b.priority];
                        })
                        .map((entry: any) => {
                          const borderColor =
                            entry.isEmergency || entry.priority === 'critical'
                              ? 'border-l-4 border-red-500 bg-red-50'
                              : entry.priority === 'high'
                                ? 'border-l-4 border-orange-500'
                                : entry.priority === 'low'
                                  ? 'border-l-4 border-gray-400'
                                  : 'border-l-4 border-blue-400';

                          return (
                            <div
                              key={entry.id}
                              className={`rounded-xl shadow-md p-4 ${borderColor} bg-white hover:shadow-lg transition-shadow relative overflow-hidden`}
                            >
                              {entry.priorityScore !== undefined && (
                                <div className="absolute top-0 right-0 bg-gray-100 px-2 py-1 rounded-bl-lg text-[10px] font-mono text-gray-500">
                                  Score: {entry.priorityScore.toFixed(1)}
                                </div>
                              )}

                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${entry.isEmergency ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                                      {entry.queueNumber}
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 uppercase tracking-wide">Patient</p>
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold">{entry.patientName}</p>
                                        {entry.isEmergency && (
                                          <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">EMERGENCY</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${entry.status === 'in-consult' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                          entry.status === 'in-triage' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                            entry.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                                              'bg-blue-50 text-blue-700 border border-blue-100'
                                        }`}>
                                        {entry.status === 'in-consult' ? 'In Consult' :
                                          entry.status === 'in-triage' ? 'Triage' :
                                            entry.status === 'checked-in' ? 'Waiting' : entry.status}
                                      </span>
                                    </div>
                                    {/* Arrival Status dropdown moved below or beside */}
                                    <div className="flex items-center gap-2 mt-1">
                                      {(entry.arrivalStatus === 'delayed' || entry.arrivalStatus === 'no-show') && (
                                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                                      )}
                                      <select
                                        value={entry.arrivalStatus || 'waiting'}
                                        onChange={async (e) => {
                                          const newStatus = e.target.value;
                                          const updated = await updateOpdQueueEntry(entry.id, { arrivalStatus: newStatus as any });
                                          setOpdQueue(prev => prev.map(p => p.id === entry.id ? updated : p));
                                        }}
                                        className="text-[10px] bg-transparent border-b border-dashed border-gray-300 focus:border-black cursor-pointer py-0.5"
                                      >
                                        <option value="waiting">Waiting</option>
                                        <option value="arrived">Arrived</option>
                                        <option value="delayed">Delayed</option>
                                        <option value="on-time">On Time</option>
                                        <option value="no-show">No Show</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">ETA</p>
                                    <p className="text-sm font-medium">
                                      {entry.estimatedArrivalTime ? new Date(entry.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Details</p>
                                    <div className="text-xs text-gray-600">
                                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${entry.consultationComplexity === 'high' ? 'bg-purple-500' :
                                        entry.consultationComplexity === 'low' ? 'bg-green-500' : 'bg-blue-500'
                                        }`}></span>
                                      {entry.consultationComplexity ? entry.consultationComplexity.charAt(0).toUpperCase() + entry.consultationComplexity.slice(1) : 'Medium'} Complexity
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Doctor</p>
                                    <p className="text-sm truncate">{entry.doctorName || 'Unassigned'}</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                  {(entry.status === 'checked-in' || entry.status === 'in-triage') && (
                                    <button
                                      onClick={() => handleUpdateOpdStatus(entry.id, 'in-consult')}
                                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-xs uppercase tracking-wide"
                                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                    >
                                      Start
                                    </button>
                                  )}
                                  {entry.status === 'in-consult' && (
                                    <button
                                      onClick={() => handleUpdateOpdStatus(entry.id, 'completed')}
                                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs uppercase tracking-wide"
                                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                    >
                                      Complete
                                    </button>
                                  )}
                                  <select
                                    value={entry.priority}
                                    onChange={(e) => handleUpdateOpdPriority(entry.id, e.target.value)}
                                    className="px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                                    aria-label="Change Priority"
                                  >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )
            }



            {/* Doctors Tab */}
            {
              activeTab === "doctors" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2
                      className="text-2xl md:text-3xl uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                    >
                      {t.doctorSchedule}
                    </h2>
                    <button
                      onClick={() => setShowAddDoctorModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <Plus className="w-4 h-4" />
                      {t.addDoctor}
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder={t.searchDoctors}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white rounded-xl outline-none text-sm"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={filterDepartment}
                          onChange={(e) => setFilterDepartment(e.target.value)}
                          className="pl-10 pr-8 py-2 bg-white rounded-xl outline-none text-sm appearance-none cursor-pointer min-w-[200px]"
                        >
                          <option value="all">All Departments</option>
                          <option value="Respiratory">Respiratory</option>
                          <option value="Cardiac">Cardiac</option>
                          <option value="General">General</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Slot Cards */}

                </div>
              )
            }

            {
              activeTab === 'analytics' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
                  <AnalyticsTab />
                </div>
              )
            }

            {/* Staff Tab */}
            {
              activeTab === "staff" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2
                      className="text-2xl md:text-3xl uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                    >
                      {t.staffManagement}
                    </h2>
                    <button
                      onClick={() => setShowAddStaffModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <UserPlus className="w-4 h-4" />
                      {t.addStaff}
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder={t.searchStaff}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white rounded-xl outline-none text-sm"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={filterDepartment}
                          onChange={(e) => setFilterDepartment(e.target.value)}
                          className="pl-10 pr-8 py-2 bg-white rounded-xl outline-none text-sm appearance-none cursor-pointer min-w-[200px]"
                        >
                          <option value="all">All Departments</option>
                          <option value="ICU">ICU</option>
                          <option value="Emergency">Emergency</option>
                          <option value="General">General</option>
                          <option value="Cardiac">Cardiac</option>
                          <option value="Radiology">Radiology</option>
                          <option value="Laboratory">Laboratory</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Staff Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map((member) => (
                      <div key={member.id} className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h3
                                className="text-sm uppercase tracking-wide"
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                              >
                                {member.name}
                              </h3>
                              <p className="text-xs text-gray-600">{member.role}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedStaff(member);
                              setShowStaffModal(true);
                            }}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Department</span>
                            <span className="text-gray-900">{member.department}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Shift</span>
                            <span className="text-gray-900">{member.shift}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 mb-4">
                          <span
                            className={`flex-1 px-3 py-2 rounded-lg text-xs text-center uppercase tracking-wide ${member.status === "active"
                              ? "bg-green-100 text-green-700"
                              : member.status === "on-leave"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-200 text-gray-700"
                              }`}
                          >
                            {member.status}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {member.status === "active" && (
                            <button
                              onClick={() => handleUpdateStaffStatus(member.id, "off-duty")}
                              className="flex-1 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-xs uppercase tracking-wide"
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                            >
                              Mark Off-Duty
                            </button>
                          )}
                          {member.status === "off-duty" && (
                            <button
                              onClick={() => handleUpdateStaffStatus(member.id, "active")}
                              className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs uppercase tracking-wide"
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                            >
                              Mark Active
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredStaff.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No staff members found</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            {/* Surge Alerts Tab */}
            {
              activeTab === "surge" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2
                        className="text-2xl md:text-3xl uppercase tracking-wide"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                      >
                        Surge Predictions & Alerts
                      </h2>
                      <p className="text-sm text-gray-500 mt-4">
                        AI-powered predictions based on environmental and seasonal data
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddAlertModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm uppercase tracking-wide"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Broadcast Alert
                      </button>
                      <button
                        onClick={() => setShowAlertConfigModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        <Settings className="w-4 h-4 mt-2" />
                        Configure Alerts
                      </button>
                    </div>
                  </div>

                  {/* Environmental Data Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                    <h3
                      className="text-lg uppercase tracking-wide mb-4 mt-10"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                    >
                      Current Environmental Data
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wind className="w-5 h-5 text-blue-600" />
                          <span className="text-xs uppercase tracking-wide text-gray-600">AQI</span>
                        </div>
                        <div className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                          {environmentalData?.aqi || 0}
                        </div>
                        <div className={`text-xs ${(environmentalData?.aqi || 0) > 300 ? 'text-red-600' : 'text-gray-600'}`}>
                          {environmentalData?.pollutionLevel || "N/A"}
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Thermometer className="w-5 h-5 text-orange-600" />
                          <span className="text-xs uppercase tracking-wide text-gray-600">Temperature</span>
                        </div>
                        <div className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                          {environmentalData?.temperature || 0}°C
                        </div>
                        <div className="text-xs text-gray-600">Current temp</div>
                      </div>
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Cloud className="w-5 h-5 text-gray-600" />
                          <span className="text-xs uppercase tracking-wide text-gray-600">Humidity</span>
                        </div>
                        <div className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                          {environmentalData?.humidity || 0}%
                        </div>
                        <div className="text-xs text-gray-600">Relative</div>
                      </div>
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <span className="text-xs uppercase tracking-wide text-gray-600">Festival</span>
                        </div>
                        <div className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                          {environmentalData?.festivalFlag ? "Yes" : "No"}
                        </div>
                        <div className="text-xs text-gray-600">This week</div>
                      </div>
                    </div>
                  </div>

                  {/* Surge Alerts */}
                  <div className="space-y-4">
                    {surgeAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        whileHover={{ scale: 1.01 }}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${getSurgeColor(alert.severity)}`}
                        onClick={() => {
                          setSelectedSurge(alert);
                          setShowSurgeDetailModal(true);
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white rounded-xl">
                            {getSurgeIcon(alert.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3
                                  className="text-lg uppercase tracking-wide mb-1"
                                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                                >
                                  {alert.title}
                                </h3>
                                <p className="text-sm opacity-90">{alert.message}</p>
                              </div>
                              <span
                                className="px-3 py-1 bg-white rounded-lg text-xs uppercase tracking-wide"
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                              >
                                {alert.severity}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="px-3 py-1 bg-white rounded-lg text-xs">
                                {alert.department} Dept
                              </span>
                              <span className="px-3 py-1 bg-white rounded-lg text-xs">
                                +{alert.expectedIncrease}% Expected
                              </span>
                              <span className="px-3 py-1 bg-white rounded-lg text-xs">
                                {alert.date}
                              </span>
                            </div>
                            <div className="text-sm opacity-90">
                              <strong>Prediction:</strong> {alert.prediction}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            }

            {/* Appointments Tab */}
            {
              activeTab === "appointments" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2
                      className="text-2xl md:text-3xl uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                    >
                      Today's Appointments
                    </h2>
                    <button
                      onClick={() => setShowAddAppointmentModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <Plus className="w-4 h-4" />
                      Schedule Appointment
                    </button>
                  </div>

                  <div className="space-y-3">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 bg-white rounded-xl">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3
                                  className="text-lg uppercase tracking-wide"
                                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                                >
                                  {appointment.patientName}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wide ${appointment.status === "scheduled"
                                    ? "bg-blue-100 text-blue-700"
                                    : appointment.status === "completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                    }`}
                                >
                                  {appointment.status}
                                </span>
                                <span className="px-3 py-1 bg-white rounded-lg text-xs">
                                  {appointment.type}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>Doctor: {appointment.doctorName}</p>
                                <p>Department: {appointment.department}</p>
                                <p>Time: {appointment.time}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            {/* Inventory Tab */}
            {
              activeTab === "inventory" && (
                <div className="space-y-6">
                  <InventoryTab />
                </div>
              )
            }

            {/* City Dashboard Tab */}
            {
              activeTab === "city" && (
                <CentralizedDashboard onLogout={onLogout} isEmbedded={true} />
              )
            }

            {/* Settings Tab */}
            {
              activeTab === "settings" && (
                <div className="max-w-3xl mx-auto">
                  <h2
                    className="text-2xl md:text-3xl mb-6 uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    {t.settings}
                  </h2>

                  <div className="space-y-4">
                    {/* Account Settings */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h3
                        className="text-lg font-semibold mb-4"
                        style={{ fontFamily: "'Doto', sans-serif" }}
                      >
                        {t.account}
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowChangePasswordModal(true)}
                          className="w-full flex items-center gap-3 text-left px-4 py-3 bg-white rounded-xl hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Lock className="w-5 h-5 text-gray-600" />
                          <span>{t.changePassword}</span>
                        </button>
                        <button
                          onClick={() => setShowUpdateProfileModal(true)}
                          className="w-full flex items-center gap-3 text-left px-4 py-3 bg-white rounded-xl hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Edit className="w-5 h-5 text-gray-600" />
                          <span>{t.updateProfile}</span>
                        </button>
                        <button
                          onClick={() => toast.info("Privacy settings feature coming soon")}
                          className="w-full flex items-center gap-3 text-left px-4 py-3 bg-white rounded-xl hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Shield className="w-5 h-5 text-gray-600" />
                          <span>{t.privacySettings}</span>
                        </button>
                      </div>
                    </div>

                    {/* Appearance Settings */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h3
                        className="text-lg font-semibold mb-4"
                        style={{ fontFamily: "'Doto', sans-serif" }}
                      >
                        {t.appearance}
                      </h3>
                      <div className="space-y-4">
                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl">
                          <div className="flex items-center gap-3">
                            {darkMode ? (
                              <Moon className="w-5 h-5 text-gray-600" />
                            ) : (
                              <Sun className="w-5 h-5 text-gray-600" />
                            )}
                            <span className="text-sm">{t.darkMode}</span>
                          </div>
                          <button
                            onClick={() => {
                              setDarkMode(!darkMode);
                              toast.success(darkMode ? t.lightModeEnabled : t.darkModeEnabled);
                            }}
                            className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-black" : "bg-gray-300"
                              }`}
                          >
                            <motion.div
                              animate={{ x: darkMode ? 24 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
                            />
                          </button>
                        </div>

                        {/* Language Selector */}
                        <div className="px-4 py-3 bg-white rounded-xl">
                          <div className="flex items-center gap-3 mb-3">
                            <Globe className="w-5 h-5 text-gray-600" />
                            <span className="text-sm">{t.language}</span>
                          </div>
                          <select
                            value={language}
                            onChange={(e) => {
                              setLanguage(e.target.value);
                              // We need to fetch the newly selected language translation for the toast
                              const newLang = e.target.value;
                              const newT = translations[newLang as keyof typeof translations] || translations['English'];
                              toast.success(`${newT.languageChanged} ${newLang}`);
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="English">English</option>
                            <option value="Hindi">हिन्दी</option>
                            {/* <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Chinese">Chinese</option> */}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          </React.Fragment >
        )}
      </main >

      {/* Bed Detail Modal */}
      <AnimatePresence>
        {
          showBedModal && selectedBed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowBedModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className="text-xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    {selectedBed.type} Ward Management
                  </h3>
                  <button
                    onClick={() => setShowBedModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">Total Beds</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateBedCount(selectedBed.id, -10)}
                          className="p-2 bg-white rounded-lg hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xl w-16 text-center" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                          {selectedBed.total}
                        </span>
                        <button
                          onClick={() => handleUpdateBedCount(selectedBed.id, 10)}
                          className="p-2 bg-white rounded-lg hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Occupied</div>
                      <div className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                        {selectedBed.occupied}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Available</div>
                      <div className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                        {selectedBed.available}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        handleOccupyBed(selectedBed.id);
                        const updatedBed = beds.find((b) => b.id === selectedBed.id);
                        if (updatedBed) setSelectedBed(updatedBed);
                      }}
                      disabled={selectedBed.available === 0}
                      className="flex-1 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Occupy Bed
                    </button>
                    <button
                      onClick={() => {
                        handleReleaseBed(selectedBed.id);
                        const updatedBed = beds.find((b) => b.id === selectedBed.id);
                        if (updatedBed) setSelectedBed(updatedBed);
                      }}
                      disabled={selectedBed.occupied === 0}
                      className="flex-1 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Release Bed
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* Doctor Slot Modal */}


      {/* Staff Detail Modal */}
      <AnimatePresence>
        {showStaffModal && selectedStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowStaffModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Staff Details
                </h3>
                <button
                  onClick={() => setShowStaffModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-lg" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      {selectedStaff.name}
                    </h4>
                    <p className="text-sm text-gray-600">{selectedStaff.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-600 mb-1">Department</div>
                    <div className="text-sm" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      {selectedStaff.department}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-600 mb-1">Shift</div>
                    <div className="text-sm" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                      {selectedStaff.shift}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-600 mb-1">Status</div>
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-xs uppercase tracking-wide ${selectedStaff.status === "active"
                        ? "bg-green-100 text-green-700"
                        : selectedStaff.status === "on-leave"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-200 text-gray-700"
                        }`}
                    >
                      {selectedStaff.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {selectedStaff.status === "active" && (
                    <button
                      onClick={() => {
                        handleUpdateStaffStatus(selectedStaff.id, "on-leave");
                        setShowStaffModal(false);
                      }}
                      className="flex-1 py-3 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition-colors text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Mark On Leave
                    </button>
                  )}
                  {selectedStaff.status !== "active" && (
                    <button
                      onClick={() => {
                        handleUpdateStaffStatus(selectedStaff.id, "active");
                        setShowStaffModal(false);
                      }}
                      className="flex-1 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Mark Active
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to remove this staff member?")) {
                        handleDeleteStaff(selectedStaff.id);
                      }
                    }}
                    className="flex-1 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors text-sm uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Remove Staff
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surge Detail Modal */}
      <AnimatePresence>
        {showSurgeDetailModal && selectedSurge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSurgeDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3
                    className="text-xl uppercase tracking-wide mb-2"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    {selectedSurge.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wide ${selectedSurge.severity === "high"
                        ? "bg-red-100 text-red-700"
                        : selectedSurge.severity === "medium"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {selectedSurge.severity} severity
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs">
                      {selectedSurge.department} Dept
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSurgeDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm uppercase tracking-wide mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Alert Message
                  </h4>
                  <p className="text-sm text-gray-700">{selectedSurge.message}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm uppercase tracking-wide mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Prediction
                  </h4>
                  <p className="text-sm text-gray-700">{selectedSurge.prediction}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                    <span className="text-lg" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      +{selectedSurge.expectedIncrease}%
                    </span>
                    <span className="text-sm text-gray-600">increase expected</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm uppercase tracking-wide mb-3" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    Recommended Actions
                  </h4>
                  <div className="space-y-2">
                    {selectedSurge.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      toast.success("Action plan downloaded");
                      setShowSurgeDetailModal(false);
                    }}
                    className="flex-1 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <Download className="w-4 h-4" />
                    Download Plan
                  </button>
                  <button
                    onClick={() => {
                      toast.success("Alert acknowledged");
                      setShowSurgeDetailModal(false);
                    }}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Acknowledge
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowChangePasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Change Password
                </h3>
                <button
                  onClick={() => setShowChangePasswordModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide shadow-lg"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Profile Modal */}
      <AnimatePresence>
        {showUpdateProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpdateProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Update Hospital Profile
                </h3>
                <button
                  onClick={() => setShowUpdateProfileModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.hospitalName}
                    onChange={(e) => setProfileForm({ ...profileForm, hospitalName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    Address
                  </label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUpdateProfileModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide shadow-lg"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Configuration Modal */}
      <AnimatePresence>
        {showAlertConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAlertConfigModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Alert Configuration
                </h3>
                <button
                  onClick={() => setShowAlertConfigModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    AQI Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={alertConfig.aqiThreshold}
                    onChange={(e) => setAlertConfig({ ...alertConfig, aqiThreshold: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    Temperature Alert Threshold (Â°C)
                  </label>
                  <input
                    type="number"
                    value={alertConfig.tempThreshold}
                    onChange={(e) => setAlertConfig({ ...alertConfig, tempThreshold: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                    Surge Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={alertConfig.surgeThreshold}
                    onChange={(e) => setAlertConfig({ ...alertConfig, surgeThreshold: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                    <span className="text-sm">Pollution Alerts</span>
                    <button
                      onClick={() => setAlertConfig({ ...alertConfig, enablePollutionAlerts: !alertConfig.enablePollutionAlerts })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${alertConfig.enablePollutionAlerts ? "bg-black" : "bg-gray-300"
                        }`}
                    >
                      <motion.div
                        animate={{ x: alertConfig.enablePollutionAlerts ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                    <span className="text-sm">Seasonal Alerts</span>
                    <button
                      onClick={() => setAlertConfig({ ...alertConfig, enableSeasonalAlerts: !alertConfig.enableSeasonalAlerts })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${alertConfig.enableSeasonalAlerts ? "bg-black" : "bg-gray-300"
                        }`}
                    >
                      <motion.div
                        animate={{ x: alertConfig.enableSeasonalAlerts ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                    <span className="text-sm">Surge Prediction Alerts</span>
                    <button
                      onClick={() => setAlertConfig({ ...alertConfig, enableSurgeAlerts: !alertConfig.enableSurgeAlerts })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${alertConfig.enableSurgeAlerts ? "bg-black" : "bg-gray-300"
                        }`}
                    >
                      <motion.div
                        animate={{ x: alertConfig.enableSurgeAlerts ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAlertConfigModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAlertConfig}
                    className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide shadow-lg"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simple modals for Add Bed, Add Doctor, Add Staff */}
      <AnimatePresence>
        {showAddBedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddBedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Add New Ward
                </h3>
                <button
                  onClick={() => setShowAddBedModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddBedSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ward Name / Type</label>
                  <input
                    type="text"
                    required
                    value={newBedForm.type}
                    onChange={(e) => setNewBedForm({ ...newBedForm, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="e.g. ICU, General Ward"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newBedForm.total}
                    onChange={(e) => setNewBedForm({ ...newBedForm, total: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Create Ward
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddDoctorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddDoctorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Add Doctor
                </h3>
                <button
                  onClick={() => setShowAddDoctorModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.name}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Dr. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newDoctorForm.email}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="doctor@hospital.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.specialization}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, specialization: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="e.g. Cardiology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.department}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, department: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="e.g. Cardiology Dept"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Add Doctor
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddStaffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddStaffModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Add Staff Member
                </h3>
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddStaffSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.name}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="Nurse">Nurse</option>
                    <option value="Technician">Technician</option>
                    <option value="Support">Support</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.department}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, department: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <select
                    value={newStaffForm.shift}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, shift: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Add Staff Member
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Appointment Modal */}
      <AnimatePresence>
        {showAddAppointmentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Schedule Appointment</h3>
                <button
                  onClick={() => setShowAddAppointmentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={manualAppointmentForm.patientName}
                    onChange={(e) => setManualAppointmentForm({ ...manualAppointmentForm, patientName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={manualAppointmentForm.doctorName}
                    onChange={(e) => setManualAppointmentForm({ ...manualAppointmentForm, doctorName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={manualAppointmentForm.department}
                    onChange={(e) => setManualAppointmentForm({ ...manualAppointmentForm, department: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={manualAppointmentForm.date}
                      onChange={(e) => setManualAppointmentForm({ ...manualAppointmentForm, date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      required
                      value={manualAppointmentForm.time}
                      onChange={(e) => setManualAppointmentForm({ ...manualAppointmentForm, time: e.target.value })}
                      className="w-full px-4 py-2 border rounded-xl"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900"
                >
                  Schedule Appointment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Alert Modal */}
      <AnimatePresence>
        {showAddAlertModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-red-600">Broadcast Surge Alert</h3>
                <button
                  onClick={() => setShowAddAlertModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleBroadcastAlert} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                  <select
                    value={manualAlertForm.type}
                    onChange={(e) => setManualAlertForm({ ...manualAlertForm, type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl"
                  >
                    <option value="epidemic">Epidemic / Disease Outbreak</option>
                    <option value="pollution">High Pollution</option>
                    <option value="seasonal">Seasonal Surge</option>
                    <option value="weather">Extreme Weather</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={manualAlertForm.severity}
                    onChange={(e) => setManualAlertForm({ ...manualAlertForm, severity: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl"
                  >
                    <option value="low">Low (Info)</option>
                    <option value="medium">Medium (Watch)</option>
                    <option value="high">High (Warning)</option>
                    <option value="critical">Critical (Emergency)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    required
                    value={manualAlertForm.message}
                    onChange={(e) => setManualAlertForm({ ...manualAlertForm, message: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl h-24"
                    placeholder="Describe the surge situation..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700"
                >
                  Broadcast Alert
                </button>
              </form>
            </motion.div>
          </div>
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
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-2xl">
                    <Bell className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Surge Alerts
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      You have {highSeverityAlerts} high severity alert{highSeverityAlerts > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationPopup(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {surgeAlerts
                  .filter(alert => alert.severity === "high")
                  .slice(0, 5)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 rounded-2xl border bg-red-50 border-red-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-red-500">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                            {alert.type}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs uppercase" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                          High
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowNotificationPopup(false);
                    setActiveTab("surge");
                  }}
                  className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  View All Alerts
                </button>
                <button
                  onClick={() => setShowNotificationPopup(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl transition-colors uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  Close
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
      <Chatbot userType="hospital" />
    </div >
  );
}
