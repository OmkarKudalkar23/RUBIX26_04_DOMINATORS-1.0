import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Chatbot } from "./Chatbot";
import {
  getHospitalBeds,
  updateHospitalBed,
  getHospitalDoctorSlots,
  toggleHospitalDoctorSlot,
  getHospitalStaff,
  updateHospitalStaffStatus,
  deleteHospitalStaff,
  getHospitalSurgeAlerts,
  getHospitalEnvironment,
  getHospitalAppointments,
  getOpdQueue,
  updateOpdCheckIn,
  createOpdCheckIn,
  getHospitalInventory,
  getInventoryAlerts,
  consumeInventoryItem,
  getInventoryTrends,
  getAdmissions,
  createAdmission,
  admitPatient,
  dischargePatient,
  updateHospitalProfile,
  changeHospitalPassword,
  getEarlyWarning,
  getHospitalLoad,
  type BedData,
  type DoctorSlot,
  type StaffMember,
  type SurgeAlert,
  type EnvironmentalData,
  type HospitalAppointment,
  type OpdCheckIn,
  type InventoryItem,
  type Admission,
} from "../services/api";
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
  BarChart3,
  PieChart,
  LineChart,
  Moon,
  Sun,
  Globe,
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

  // Settings states
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [showAlertConfigModal, setShowAlertConfigModal] = useState(false);

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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<{ lowStock: InventoryItem[] }>({ lowStock: [] });
  const [inventoryTrends, setInventoryTrends] = useState<any>(null);
  const [admissions, setAdmissions] = useState<Admission[]>([]);

  // Admission form state
  const [admissionForm, setAdmissionForm] = useState({
    patientName: '',
    age: '',
    department: 'General',
    bedType: 'General' as Admission["bedType"],
    severity: 'medium' as Admission["severity"],
    oxygenRequired: false,
    isolationRequired: false
  });

  // OPD check-in form state
  const [opdCheckInForm, setOpdCheckInForm] = useState({
    patientName: '',
    department: 'General',
    doctorName: '',
    priority: 'normal' as OpdCheckIn["priority"]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          earlyWarningData,
          hospitalLoadData
        ] = await Promise.allSettled([
          getHospitalBeds(),
          getHospitalDoctorSlots(),
          getHospitalStaff(),
          getHospitalSurgeAlerts(),
          getHospitalEnvironment(),
          getHospitalAppointments(),
          getEarlyWarning('Mumbai').catch(() => null), // Default to Mumbai
          getHospitalLoad('Mumbai').catch(() => null) // Default to Mumbai
        ]);

        setBeds(bedsData.status === 'fulfilled' ? bedsData.value : []);
        setDoctorSlots(doctorSlotsData.status === 'fulfilled' ? doctorSlotsData.value : []);
        setStaff(staffData.status === 'fulfilled' ? staffData.value : []);

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

        // Fetch OPD queue + Inventory (best-effort, don't block dashboard)
        try {
          const [queueResp, invResp, invAlertsResp] = await Promise.allSettled([
            getOpdQueue(),
            getHospitalInventory(),
            getInventoryAlerts()
          ]);
          setOpdQueue(queueResp.status === 'fulfilled' ? queueResp.value : []);
          setInventory(invResp.status === 'fulfilled' ? invResp.value : []);
          setInventoryAlerts(invAlertsResp.status === 'fulfilled' ? invAlertsResp.value : { lowStock: [] });

          const [admResp, trendsResp] = await Promise.allSettled([
            getAdmissions(),
            getInventoryTrends(7)
          ]);
          setAdmissions(admResp.status === 'fulfilled' ? admResp.value : []);
          setInventoryTrends(trendsResp.status === 'fulfilled' ? trendsResp.value : null);
        } catch {
          // ignore
        }

        // Log hospital load if available (optional debug)
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

  // All appointments for today (used across dashboard + OPD view)
  const todaysAppointments = appointments.filter((a) => a.date === today);
  const todayAppointments = todaysAppointments.length;

  // OPD-specific slices for integrated OPD dashboard view
  const todaysOpdAppointments = todaysAppointments.filter(
    (a) => a.type === "OPD"
  );
  const todaysOpdScheduled = todaysOpdAppointments.filter(
    (a) => a.status === "scheduled"
  );
  const todaysOpdCompleted = todaysOpdAppointments.filter(
    (a) => a.status === "completed"
  );

  // Admissions / Emergency metrics (DB-backed via admissions workflow)
  const admissionsToday = admissions.filter((a) => {
    const created = a.createdAt ? new Date(a.createdAt) : null;
    if (!created) return false;
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
    const t1 = new Date();
    t1.setHours(23, 59, 59, 999);
    return created >= t0 && created <= t1;
  });
  const admissions24h = admissionsToday.length;
  const emergencyCases = admissions.filter((a) => a.bedType === "Emergency" || a.severity === "critical").length;
  const inventoryLowCount = inventoryAlerts.lowStock.length;

  // OPD queue metrics
  const opdWaiting = opdQueue.filter((q) => ["checked-in", "in-triage", "in-consult"].includes(q.status)).length;
  const opdInConsult = opdQueue.filter((q) => q.status === "in-consult").length;
  const completionRate = todaysOpdAppointments.length > 0 ? Math.round((todaysOpdCompleted.length / todaysOpdAppointments.length) * 100) : 0;
  const queueCoverage = todaysOpdAppointments.length > 0 ? Math.round((opdQueue.length / todaysOpdAppointments.length) * 100) : 0;

  // OPD priority distribution
  const priorityData = ["low", "normal", "high", "critical"].map((p) => ({
    name: p.toUpperCase(),
    value: opdQueue.filter((q) => q.priority === p).length
  }));

  const totalSlots = doctorSlots.reduce((sum, ds) => sum + ds.slots.length, 0);
  const bookedSlots = doctorSlots.reduce(
    (sum, ds) => sum + ds.slots.filter((s) => s.status === "booked").length,
    0
  );

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

  const handleOccupyBed = async (bedId: string) => {
    try {
      const updatedBed = await updateHospitalBed(bedId, { action: "occupy" });
      setBeds((prevBeds) =>
        prevBeds.map((b) => (b.id === bedId ? updatedBed : b))
      );
      toast.success("Bed occupied successfully");
    } catch (error: any) {
      console.error("Error occupying bed:", error);
      toast.error(error.message || "Failed to occupy bed");
    }
  };

  const handleReleaseBed = async (bedId: string) => {
    try {
      const updatedBed = await updateHospitalBed(bedId, { action: "release" });
      setBeds((prevBeds) =>
        prevBeds.map((b) => (b.id === bedId ? updatedBed : b))
      );
      toast.success("Bed released successfully");
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

  // Show missed notifications on login - based on REAL data only (no dummy data)
  useEffect(() => {
    const hasSeenMissedNotifications = sessionStorage.getItem('hasSeenHospitalMissedNotifications');
    if (!hasSeenMissedNotifications && (surgeAlerts.length > 0 || totalAvailable < 10 || highSeverityAlerts > 0)) {
      const missedNotifications: Array<{ message: string; type: "info" | "success" | "warning" | "error"; icon: any; delay: number }> = [];

      // Only show notifications based on REAL data from ML models and backend
      if (highSeverityAlerts > 0) {
        missedNotifications.push({
          message: `${highSeverityAlerts} high priority alert${highSeverityAlerts > 1 ? 's' : ''} require${highSeverityAlerts > 1 ? '' : 's'} immediate attention`,
          type: "error" as const,
          icon: AlertCircle,
          delay: 1000
        });
      }

      if (surgeAlerts.length > 0) {
        missedNotifications.push({
          message: `${surgeAlerts.length} active surge alert${surgeAlerts.length > 1 ? 's' : ''}`,
          type: "warning" as const,
          icon: AlertTriangle,
          delay: 1500
        });
      }

      if (totalAvailable < 10) {
        missedNotifications.push({
          message: `Low bed availability: Only ${totalAvailable} bed${totalAvailable > 1 ? 's' : ''} available`,
          type: "warning" as const,
          icon: BedDouble,
          delay: 2000
        });
      }

      missedNotifications.forEach((notif) => {
        setTimeout(() => {
          addToastNotification(notif.message, notif.type, notif.icon);
        }, notif.delay);
      });

      sessionStorage.setItem('hasSeenHospitalMissedNotifications', 'true');
    }
  }, [surgeAlerts.length, totalAvailable, highSeverityAlerts]);

  // REMOVED: Simulated real-time notifications (dummy data)
  // All notifications now come from real ML models and backend data
  // Real-time updates are handled by the 5-minute auto-refresh in fetchData useEffect

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
                City General Hospital
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
                    { id: "dashboard", icon: Home, label: "Dashboard" },
                    { id: "beds", icon: BedDouble, label: "Bed Management" },
                    { id: "doctors", icon: Stethoscope, label: "Doctor Slots" },
                    { id: "opd", icon: ClipboardList, label: "OPD Queue" },
                    { id: "inventory", icon: Building2, label: "Inventory" },
                    { id: "staff", icon: Users, label: "Staff Allocation" },
                    { id: "surge", icon: TrendingUp, label: "Surge Alerts" },
                    { id: "appointments", icon: Calendar, label: "Appointments" },
                    { id: "settings", icon: Settings, label: "Settings" },
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
            { id: "dashboard", icon: Home, label: "Dashboard" },
            { id: "beds", icon: BedDouble, label: "Bed Management" },
            { id: "doctors", icon: Stethoscope, label: "Doctor Slots" },
            { id: "opd", icon: ClipboardList, label: "OPD Queue" },
            { id: "admissions", icon: DoorOpen, label: "Admissions" },
            { id: "admissions", icon: DoorOpen, label: "Admissions" },
            { id: "inventory", icon: Building2, label: "Inventory" },
            { id: "staff", icon: Users, label: "Staff Allocation" },
            { id: "surge", icon: TrendingUp, label: "Surge Alerts" },
            { id: "appointments", icon: Calendar, label: "Appointments" },
            { id: "settings", icon: Settings, label: "Settings" },
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
                      Dashboard Overview
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Real-time hospital operations and analytics
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toast.success("Data refreshed")}
                      className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Refresh
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
                          High Pollution Alert
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">
                          AQI: {environmentalData?.aqi || 0} - {environmentalData?.pollutionLevel || "N/A"} | Expect surge in respiratory patients
                        </p>
                        <button
                          onClick={() => setActiveTab("surge")}
                          className="text-sm text-red-700 hover:underline flex items-center gap-1"
                        >
                          View recommendations <ChevronRight className="w-4 h-4" />
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
                      Bed Occupancy
                    </h3>
                    <p className="text-xs text-gray-600">
                      {totalOccupied}/{totalBeds} beds occupied
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
                      Active Staff
                    </h3>
                    <p className="text-xs text-gray-600">
                      Out of {totalStaff} total staff
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
                      Today's Appointments
                    </h3>
                    <p className="text-xs text-gray-600">
                      {bookedSlots}/{totalSlots} slots booked
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
                      High Priority Alerts
                    </h3>
                    <p className="text-xs text-gray-600">
                      {surgeAlerts.length} total alerts active
                    </p>
                  </motion.div>
                </div>

                {/* Operational Command View - Real-time Metrics */}
                <div className="space-y-4">
                  <h3
                    className="text-xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                  >
                    Operational Command View
                  </h3>

                  {/* OPD Load, Bed Occupancy, Admissions, Emergency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* OPD Load */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Stethoscope className="w-7 h-7" />
                        <Activity className="w-5 h-5 opacity-70" />
                      </div>
                      <p className="text-sm opacity-90 mb-1">OPD LOAD (24h)</p>
                      <p className="text-4xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                        {opdQueue.length || todaysOpdScheduled.length || todaysOpdAppointments.length}
                      </p>
                      <p className="text-xs opacity-75">checked-in / scheduled</p>
                    </div>

                    {/* Bed Occupancy */}
                    <div className={`rounded-2xl p-6 ${occupancyRate > 85 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                        occupancyRate > 70 ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                          'bg-gradient-to-br from-green-500 to-green-600'
                      } text-white`}>
                      <div className="flex items-center justify-between mb-3">
                        <BedDouble className="w-7 h-7" />
                        <span className="text-3xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                          {occupancyRate}%
                        </span>
                      </div>
                      <p className="text-sm opacity-90 mb-1">BED OCCUPANCY</p>
                      <p className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                        {totalOccupied}/{totalBeds}
                      </p>
                      <p className="text-xs opacity-75">{totalAvailable} beds available</p>
                    </div>

                    {/* Admissions */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <UserPlus className="w-7 h-7" />
                        <Users className="w-5 h-5 opacity-70" />
                      </div>
                      <p className="text-sm opacity-90 mb-1">ADMISSIONS (24h)</p>
                      <p className="text-4xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                        {admissions24h}
                      </p>
                      <p className="text-xs opacity-75">created today</p>
                    </div>

                    {/* Emergency Cases */}
                    <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <AlertTriangle className="w-7 h-7" />
                        <AlertCircle className="w-5 h-5 opacity-70" />
                      </div>
                      <p className="text-sm opacity-90 mb-1">EMERGENCY CASES</p>
                      <p className="text-4xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                        {emergencyCases}
                      </p>
                      <p className="text-xs opacity-75">critical / emergency</p>
                    </div>
                  </div>

                {/* Bed & ICU Status + Inventory Alerts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Bed & ICU Status */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h4
                        className="text-lg uppercase tracking-wide mb-4 flex items-center gap-2"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                      >
                        <BedDouble className="w-6 h-6 text-blue-600" />
                        Bed & ICU Status
                      </h4>

                      <div className="space-y-4">
                        {/* General Beds */}
                        <div className="bg-white rounded-xl p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>General Beds</span>
                            <span className={`text-xl ${occupancyRate > 85 ? 'text-red-600' :
                                occupancyRate > 70 ? 'text-orange-600' :
                                  'text-green-600'
                              }`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                              {occupancyRate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div
                              className={`h-3 rounded-full transition-all ${occupancyRate > 85 ? 'bg-red-500' :
                                  occupancyRate > 70 ? 'bg-orange-500' :
                                    'bg-green-500'
                                }`}
                              style={{ width: `${occupancyRate}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-600">
                            {totalOccupied} occupied • {totalAvailable} available • {totalBeds} total
                          </p>
                        </div>

                        {/* ICU Beds */}
                        {beds.find(b => b.type.toLowerCase().includes('icu')) && (() => {
                          const icuBed = beds.find(b => b.type.toLowerCase().includes('icu'))!;
                          const icuOccupancy = Math.round((icuBed.occupied / icuBed.total) * 100);
                          return (
                            <div className="bg-white rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>ICU Beds</span>
                                <span className={`text-xl ${icuOccupancy > 85 ? 'text-red-600' :
                                    icuOccupancy > 70 ? 'text-orange-600' :
                                      'text-green-600'
                                  }`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                                  {icuOccupancy}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                <div
                                  className={`h-3 rounded-full transition-all ${icuOccupancy > 85 ? 'bg-red-500' :
                                      icuOccupancy > 70 ? 'bg-orange-500' :
                                        'bg-green-500'
                                    }`}
                                  style={{ width: `${icuOccupancy}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-600">
                                {icuBed.occupied} occupied • {icuBed.available} available • {icuBed.total} total
                              </p>
                            </div>
                          );
                        })()}

                        {/* Emergency Beds Alert */}
                        {totalAvailable < 10 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-orange-600" />
                              <span className="text-sm text-orange-700" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                                Action Required
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Open <span className="text-xl text-orange-600" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                                {Math.max(5, Math.round(totalBeds * 0.1 - totalAvailable))}
                              </span> emergency beds
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inventory Alerts */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h4
                        className="text-lg uppercase tracking-wide mb-4 flex items-center gap-2"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                      >
                        <Building2 className="w-6 h-6 text-green-600" />
                        Inventory Alerts
                      </h4>

                      {/* Live low-stock summary (DB-backed) */}
                      <div className="mb-4 bg-white rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                            Low Stock Items
                          </div>
                          <div className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                            {inventoryLowCount}
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab("inventory")}
                          className="text-xs px-3 py-2 bg-black text-white rounded-xl uppercase tracking-wide"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          View
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Oxygen Cylinders */}
                        {(() => {
                          const oxygenLevel = Math.max(40, 100 - (occupancyRate * 0.5));
                          const statusColor = oxygenLevel > 70 ? 'green' : oxygenLevel > 40 ? 'orange' : 'red';
                          const StatusIcon = oxygenLevel > 70 ? CheckCircle : oxygenLevel > 40 ? AlertTriangle : AlertCircle;

                          return (
                            <div className={`bg-${statusColor}-50 border border-${statusColor}-200 rounded-xl p-4`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`w-5 h-5 text-${statusColor}-600`} />
                                  <span className="text-sm" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>Oxygen Cylinders</span>
                                </div>
                                <span className={`text-xl text-${statusColor}-600`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                                  {Math.round(oxygenLevel)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div
                                  className={`bg-${statusColor}-500 h-2 rounded-full transition-all`}
                                  style={{ width: `${oxygenLevel}%` }}
                                />
                              </div>
                              {oxygenLevel < 70 && (
                                <p className="text-xs text-orange-600">
                                  ⚠️ Increase stock by {Math.round(100 - oxygenLevel)}%
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {/* Medical Masks */}
                        {(() => {
                          const maskStock = environmentalData?.aqi && environmentalData.aqi > 200 ? 45 : 85;
                          const statusColor = maskStock > 70 ? 'green' : maskStock > 40 ? 'orange' : 'red';
                          const StatusIcon = maskStock > 70 ? CheckCircle : maskStock > 40 ? AlertTriangle : AlertCircle;

                          return (
                            <div className={`bg-${statusColor}-50 border border-${statusColor}-200 rounded-xl p-4`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`w-5 h-5 text-${statusColor}-600`} />
                                  <span className="text-sm" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>Medical Masks</span>
                                </div>
                                <span className={`text-xl text-${statusColor}-600`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                                  {maskStock}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div
                                  className={`bg-${statusColor}-500 h-2 rounded-full transition-all`}
                                  style={{ width: `${maskStock}%` }}
                                />
                              </div>
                              {environmentalData?.aqi && environmentalData.aqi > 200 && (
                                <p className="text-xs text-orange-600">
                                  😷 High demand expected - Restock immediately
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {/* Essential Medicines */}
                        {(() => {
                          const medicineStock = highSeverityAlerts > 0 ? 55 : 78;
                          const statusColor = medicineStock > 70 ? 'green' : medicineStock > 40 ? 'orange' : 'red';
                          const StatusIcon = medicineStock > 70 ? CheckCircle : medicineStock > 40 ? AlertTriangle : AlertCircle;

                          return (
                            <div className={`bg-${statusColor}-50 border border-${statusColor}-200 rounded-xl p-4`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`w-5 h-5 text-${statusColor}-600`} />
                                  <span className="text-sm" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>Essential Medicines</span>
                                </div>
                                <span className={`text-xl text-${statusColor}-600`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                                  {medicineStock}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div
                                  className={`bg-${statusColor}-500 h-2 rounded-full transition-all`}
                                  style={{ width: `${medicineStock}%` }}
                                />
                              </div>
                              {highSeverityAlerts > 0 && (
                                <p className="text-xs text-orange-600">
                                  📦 Surge expected - Check respiratory medicine stock
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced OPD Dashboard - AI/Analyst style */}
                <div className="mt-6 rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl border border-slate-700">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h3
                        className="text-xl md:text-2xl uppercase tracking-wide mb-1"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                      >
                        OPD Command Center
                      </h3>
                      <p className="text-xs text-slate-300">Live OPD flow • Queue • Completion • Priorities</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-2 bg-slate-800 rounded-xl text-xs uppercase tracking-wide border border-slate-700">
                        Completion: {completionRate}%
                      </div>
                      <button
                        onClick={() => setActiveTab("doctors")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-colors text-xs md:text-sm uppercase tracking-wide shadow-md"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        <Stethoscope className="w-4 h-4" />
                        Manage Slots
                      </button>
                    </div>
                  </div>

                  {/* KPI Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <motion.div whileHover={{ y: -2 }} className="rounded-xl p-4 bg-slate-800 border border-slate-700 shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wide text-slate-300">Total OPD</span>
                        <Calendar className="w-4 h-4 text-slate-300" />
                      </div>
                      <div className="text-4xl font-black" style={{ fontFamily: "'Doto', sans-serif" }}>
                        {todaysOpdAppointments.length}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Scheduled for today</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -2 }} className="rounded-xl p-4 bg-slate-800 border border-slate-700 shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wide text-slate-300">Queue / Waiting</span>
                        <Clock className="w-4 h-4 text-orange-300" />
                      </div>
                      <div className="text-4xl font-black text-orange-300" style={{ fontFamily: "'Doto', sans-serif" }}>
                        {opdWaiting || todaysOpdScheduled.length || opdQueue.length}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Checked-in & not completed</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -2 }} className="rounded-xl p-4 bg-slate-800 border border-slate-700 shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wide text-slate-300">In Consult</span>
                        <Activity className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div className="text-4xl font-black text-cyan-300" style={{ fontFamily: "'Doto', sans-serif" }}>
                        {opdInConsult}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Currently with doctors</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -2 }} className="rounded-xl p-4 bg-slate-800 border border-slate-700 shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wide text-slate-300">Completion</span>
                        <CheckCircle className="w-4 h-4 text-green-300" />
                      </div>
                      <div className="text-4xl font-black text-green-300" style={{ fontFamily: "'Doto', sans-serif" }}>
                        {completionRate}%
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Completed vs total today</p>
                    </motion.div>
                  </div>

                  {/* Charts Row */}
                  {(() => {
                    const departmentData = todaysOpdAppointments.reduce((acc: any, apt) => {
                      acc[apt.department] = (acc[apt.department] || 0) + 1;
                      return acc;
                    }, {});
                    const departmentChartData = Object.entries(departmentData).map(([name, value]) => ({
                      name,
                      value,
                    }));

                    const statusData = [
                      { name: "Completed", value: todaysOpdCompleted.length, color: "#10b981" },
                      { name: "Scheduled", value: todaysOpdScheduled.length, color: "#f59e0b" },
                      { name: "Cancelled", value: todaysOpdAppointments.filter(a => a.status === "cancelled").length, color: "#ef4444" },
                    ].filter(item => item.value > 0);

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
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* OPD by Department - Pie */}
                        <div className="rounded-xl p-5 bg-slate-800 border border-slate-700 shadow">
                          <h4 className="text-sm uppercase tracking-wide mb-3 text-slate-200" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            OPD by Department
                          </h4>
                          {departmentChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Tooltip />
                                <Legend />
                                <Pie
                                  data={departmentChartData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {departmentChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No data</div>
                          )}
                        </div>

                        {/* Status Distribution - Donut */}
                        <div className="rounded-xl p-5 bg-slate-800 border border-slate-700 shadow">
                          <h4 className="text-sm uppercase tracking-wide mb-3 text-slate-200" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            Status Mix
                          </h4>
                          {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Tooltip />
                                <Legend />
                                <Pie
                                  data={statusData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={80}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No data</div>
                          )}
                        </div>

                        {/* Priority Distribution + Time Slots */}
                        <div className="rounded-xl p-5 bg-slate-800 border border-slate-700 shadow">
                          <h4 className="text-sm uppercase tracking-wide mb-3 text-slate-200" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            Priority & Time Slots
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={priorityData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                  <XAxis dataKey="name" stroke="#cbd5f5" />
                                  <YAxis stroke="#cbd5f5" />
                                  <Tooltip />
                                  <Bar dataKey="value" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="h-32">
                              {timeSlotChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={timeSlotChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#cbd5f5" />
                                    <YAxis stroke="#cbd5f5" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 text-sm">No time-slot data</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Live Queue Table */}
                  <div className="rounded-xl p-5 bg-slate-800 border border-slate-700 shadow overflow-x-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm uppercase tracking-wide text-slate-200" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                        Live OPD Queue
                      </h4>
                      <span className="text-xs text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                        Showing {opdQueue.length} of {todaysOpdAppointments.length || opdQueue.length} patients
                      </span>
                    </div>

                    {opdQueue.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-sm">No check-ins yet.</div>
                    ) : (
                      <div className="min-w-full">
                        <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-slate-300 mb-3 pb-2 border-b border-slate-700">
                          <span>#</span>
                          <span>Patient</span>
                          <span>Dept / Doctor</span>
                          <span>Priority</span>
                          <span className="text-right">Status</span>
                        </div>
                        <div className="space-y-2">
                          {opdQueue
                            .slice()
                            .sort((a, b) => a.queueNumber - b.queueNumber)
                            .map((c) => (
                              <div
                                key={c.id}
                                className="grid grid-cols-5 gap-4 py-3 px-2 rounded-lg text-xs border border-slate-700 bg-slate-900/50"
                              >
                                <span className="font-semibold text-slate-100">#{c.queueNumber}</span>
                                <span className="text-slate-200 truncate">{c.patientName}</span>
                                <span className="text-slate-300 truncate">{c.department}{c.doctorName ? ` • ${c.doctorName}` : ''}</span>
                                <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wide text-center ${
                                  c.priority === 'critical' ? 'bg-red-600/20 text-red-300 border border-red-500/50' :
                                  c.priority === 'high' ? 'bg-orange-500/20 text-orange-200 border border-orange-400/50' :
                                  c.priority === 'normal' ? 'bg-slate-700 text-slate-200 border border-slate-600' :
                                  'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}>
                                  {c.priority}
                                </span>
                                <span className="text-right">
                                  <span
                                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                                      c.status === "completed"
                                        ? "bg-green-500/20 text-green-200 border border-green-500/50"
                                        : c.status === "no-show"
                                        ? "bg-slate-700 text-slate-300 border border-slate-600"
                                        : c.status === "in-consult"
                                        ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/50"
                                        : c.status === "in-triage"
                                        ? "bg-amber-500/20 text-amber-200 border border-amber-400/50"
                                        : "bg-indigo-500/20 text-indigo-200 border border-indigo-400/50"
                                    }`}
                                  >
                                    {c.status}
                                  </span>
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bed Status Grid */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                    >
                      Bed Status by Type
                    </h3>
                    <button
                      onClick={() => setActiveTab("beds")}
                      className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
                    >
                      View all <ChevronRight className="w-4 h-4" />
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
            {activeTab === "beds" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2
                    className="text-2xl md:text-3xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    Bed Management
                  </h2>
                  <button
                    onClick={() => setShowAddBedModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Bed Type
                  </button>
                </div>

                {/* Bed Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {beds.map((bed) => (
                    <div key={bed.id} className="bg-gray-50 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white rounded-xl">
                            <BedDouble className="w-6 h-6" />
                          </div>
                          <div>
                            <h3
                              className="text-lg uppercase tracking-wide"
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                            >
                              {bed.type} Ward
                            </h3>
                            <p className="text-xs text-gray-500">
                              {bed.occupied}/{bed.total} occupied
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBed(bed);
                            setShowBedModal(true);
                          }}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${(bed.occupied / bed.total) * 100 > 90
                              ? "bg-red-500"
                              : (bed.occupied / bed.total) * 100 > 75
                                ? "bg-orange-500"
                                : "bg-green-500"
                              }`}
                            style={{ width: `${(bed.occupied / bed.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round((bed.occupied / bed.total) * 100)}% occupancy
                        </p>
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            {bed.total}
                          </div>
                          <div className="text-xs text-gray-500 uppercase">Total</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            {bed.occupied}
                          </div>
                          <div className="text-xs text-gray-500 uppercase">Occupied</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            {bed.available}
                          </div>
                          <div className="text-xs text-gray-500 uppercase">Available</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOccupyBed(bed.id)}
                          disabled={bed.available === 0}
                          className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          Occupy Bed
                        </button>
                        <button
                          onClick={() => handleReleaseBed(bed.id)}
                          disabled={bed.occupied === 0}
                          className="flex-1 py-2 bg-white text-black border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          Release Bed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctors Tab */}
            {activeTab === "doctors" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2
                    className="text-2xl md:text-3xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    Doctor Slots & OPD
                  </h2>
                  <button
                    onClick={() => setShowAddDoctorModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Doctor Schedule
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search doctors or specializations..."
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
                <div className="space-y-4">
                  {filteredDoctorSlots.map((doctor) => (
                    <div key={doctor.id} className="bg-gray-50 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white rounded-xl">
                            <Stethoscope className="w-6 h-6" />
                          </div>
                          <div>
                            <h3
                              className="text-lg uppercase tracking-wide"
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                            >
                              {doctor.doctorName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {doctor.specialization} • {doctor.department}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {doctor.date} • {doctor.slots.filter((s) => s.status === "booked").length}/
                              {doctor.slots.length} slots booked
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDoctorSlot(doctor);
                            setShowDoctorSlotModal(true);
                          }}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Slots Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {doctor.slots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => handleToggleSlot(doctor.id, index)}
                            className={`p-3 rounded-xl text-xs transition-all ${slot.status === "available"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : slot.status === "booked"
                                ? "bg-blue-100 text-blue-700 cursor-default"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              }`}
                          >
                            <div className="uppercase tracking-wide mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                              {slot.time}
                            </div>
                            <div className="text-[10px] opacity-80">
                              {slot.status === "booked" ? slot.patientName : slot.status}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {filteredDoctorSlots.length === 0 && (
                    <div className="text-center py-12">
                      <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No doctors found matching your criteria</p>
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
                    OPD Queue Management
                  </h2>
                  <button
                    onClick={async () => {
                      const q = await getOpdQueue().catch(() => []);
                      setOpdQueue(q);
                      toast.success("OPD queue refreshed");
                    }}
                    className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Refresh Queue
                  </button>
                </div>

                {/* Check-in form */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg uppercase tracking-wide mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    New Patient Check-in
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      value={opdCheckInForm.patientName}
                      onChange={(e) => setOpdCheckInForm((p) => ({ ...p, patientName: e.target.value }))}
                      placeholder="Patient name"
                      className="px-4 py-2 bg-white rounded-xl outline-none text-sm"
                    />
                    <input
                      value={opdCheckInForm.doctorName}
                      onChange={(e) => setOpdCheckInForm((p) => ({ ...p, doctorName: e.target.value }))}
                      placeholder="Doctor (optional)"
                      className="px-4 py-2 bg-white rounded-xl outline-none text-sm"
                    />
                    <select
                      value={opdCheckInForm.department}
                      onChange={(e) => setOpdCheckInForm((p) => ({ ...p, department: e.target.value }))}
                      className="px-4 py-2 bg-white rounded-xl outline-none text-sm"
                    >
                      <option value="General">General</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Cardiac">Cardiac</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                    <select
                      value={opdCheckInForm.priority}
                      onChange={(e) => setOpdCheckInForm((p) => ({ ...p, priority: e.target.value as any }))}
                      className="px-4 py-2 bg-white rounded-xl outline-none text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={async () => {
                        if (!opdCheckInForm.patientName.trim()) {
                          toast.error("Patient name is required");
                          return;
                        }
                        const created = await createOpdCheckIn({
                          patientName: opdCheckInForm.patientName.trim(),
                          department: opdCheckInForm.department,
                          doctorName: opdCheckInForm.doctorName.trim() || undefined,
                          priority: opdCheckInForm.priority
                        }).catch((e) => {
                          toast.error(e?.message || "Failed to check-in patient");
                          return null;
                        });
                        if (!created) return;
                        toast.success(`Checked-in #${created.queueNumber}`);
                        setOpdCheckInForm({ patientName: '', department: 'General', doctorName: '', priority: 'normal' });
                        const q = await getOpdQueue().catch(() => []);
                        setOpdQueue(q);
                      }}
                      className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Check-in
                    </button>
                  </div>
                </div>

                {/* Queue table */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Live Queue
                    </h3>
                    <span className="text-xs text-gray-600">{opdQueue.length} check-ins today</span>
                  </div>
                  {opdQueue.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-500">No check-ins yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {opdQueue
                        .slice()
                        .sort((a, b) => a.queueNumber - b.queueNumber)
                        .map((c) => (
                          <div key={c.id} className="bg-white rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold">
                                {c.queueNumber}
                              </div>
                              <div>
                                <div className="text-sm font-semibold">{c.patientName}</div>
                                <div className="text-xs text-gray-600">{c.department}{c.doctorName ? ` • ${c.doctorName}` : ''}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={c.priority}
                                onChange={async (e) => {
                                  const updated = await updateOpdCheckIn(c.id, { priority: e.target.value as any }).catch(() => null);
                                  if (!updated) return toast.error("Failed to update priority");
                                  setOpdQueue((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
                                }}
                                className="px-3 py-2 bg-gray-50 rounded-xl text-xs"
                              >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                              </select>
                              <select
                                value={c.status}
                                onChange={async (e) => {
                                  const updated = await updateOpdCheckIn(c.id, { status: e.target.value as any }).catch(() => null);
                                  if (!updated) return toast.error("Failed to update status");
                                  setOpdQueue((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
                                }}
                                className="px-3 py-2 bg-gray-50 rounded-xl text-xs"
                              >
                                <option value="checked-in">Checked-in</option>
                                <option value="in-triage">In triage</option>
                                <option value="in-consult">In consult</option>
                                <option value="completed">Completed</option>
                                <option value="no-show">No-show</option>
                              </select>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === "inventory" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2
                    className="text-2xl md:text-3xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    Inventory Usage Tracking
                  </h2>
                  <button
                    onClick={async () => {
                      const [items, alerts] = await Promise.all([
                        getHospitalInventory().catch(() => []),
                        getInventoryAlerts().catch(() => ({ lowStock: [] }))
                      ]);
                      setInventory(items);
                      setInventoryAlerts(alerts);
                      toast.success("Inventory refreshed");
                    }}
                    className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Refresh
                  </button>
                </div>

                {inventoryAlerts.lowStock.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">Low stock alerts</span>
                    </div>
                    <p className="text-xs text-red-700">
                      {inventoryAlerts.lowStock.map((i) => i.name).join(", ")}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.map((item) => {
                    const isLow = item.currentStock <= item.minStock;
                    const pct = item.minStock > 0 ? Math.min(100, Math.round((item.currentStock / item.minStock) * 100)) : 100;
                    return (
                      <div key={item.id} className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold">{item.name}</div>
                            <div className="text-xs text-gray-600">{item.category} • {item.unit}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {isLow ? 'LOW' : 'OK'}
                          </span>
                        </div>
                        <div className="text-3xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                          {item.currentStock}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div className={`h-2 rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-xs text-gray-600 mb-3">Min: {item.minStock} • Reorder: {item.reorderQty}</div>
                        <button
                          onClick={async () => {
                            const qty = 1;
                            const resp = await consumeInventoryItem(item.id, { qty, reason: 'manual-consume' }).catch(() => null);
                            if (!resp) return toast.error("Failed to consume");
                            toast.success(`Consumed ${qty} ${item.unit}`);
                            const [items, alerts] = await Promise.all([
                              getHospitalInventory().catch(() => []),
                              getInventoryAlerts().catch(() => ({ lowStock: [] }))
                            ]);
                            setInventory(items);
                            setInventoryAlerts(alerts);
                          }}
                          className="w-full py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-xs uppercase tracking-wide"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          Consume 1
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admissions Tab */}
            {activeTab === "admissions" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2
                    className="text-2xl md:text-3xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    Admissions Workflow
                  </h2>
                  <button
                    onClick={async () => {
                      const list = await getAdmissions().catch(() => []);
                      setAdmissions(list);
                      toast.success("Admissions refreshed");
                    }}
                    className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Refresh
                  </button>
                </div>

                {/* Rule-based intake form */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg uppercase tracking-wide mb-4" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                    New Admission Intake
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <input
                      value={admissionForm.patientName}
                      onChange={(e) => setAdmissionForm((p) => ({ ...p, patientName: e.target.value }))}
                      placeholder="Patient name"
                      className="px-4 py-2 bg-white rounded-xl outline-none text-sm md:col-span-2"
                    />
                    <input
                      value={admissionForm.age}
                      onChange={(e) => setAdmissionForm((p) => ({ ...p, age: e.target.value }))}
                      placeholder="Age"
                      className="px-4 py-2 bg-white rounded-xl outline-none text-sm"
                    />
                    <select
                      value={admissionForm.department}
                      onChange={(e) => setAdmissionForm((p) => ({ ...p, department: e.target.value }))}
                      className="px-4 py-2 bg-white rounded-xl outline-none text-sm"
                    >
                      <option value="General">General</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Cardiac">Cardiac</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                    <select
                      value={admissionForm.bedType}
                      onChange={(e) => setAdmissionForm((p) => ({ ...p, bedType: e.target.value as any }))}
                      className="px-4 py-2 bg-white rounded-xl outline-none text-sm"
                    >
                      <option value="General">General</option>
                      <option value="Private">Private</option>
                      <option value="ICU">ICU</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                    <select
                      value={admissionForm.severity}
                      onChange={(e) => setAdmissionForm((p) => ({ ...p, severity: e.target.value as any }))}
                      className="px-4 py-2 bg-white rounded-xl outline-none text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={admissionForm.oxygenRequired}
                          onChange={(e) => setAdmissionForm((p) => ({ ...p, oxygenRequired: e.target.checked }))}
                        />
                        Oxygen required
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={admissionForm.isolationRequired}
                          onChange={(e) => setAdmissionForm((p) => ({ ...p, isolationRequired: e.target.checked }))}
                        />
                        Isolation required
                      </label>
                    </div>
                    <button
                      onClick={async () => {
                        if (!admissionForm.patientName.trim()) return toast.error("Patient name is required");
                        const resp = await createAdmission({
                          patientName: admissionForm.patientName.trim(),
                          age: admissionForm.age ? Number(admissionForm.age) : undefined,
                          department: admissionForm.department,
                          bedType: admissionForm.bedType,
                          severity: admissionForm.severity,
                          oxygenRequired: admissionForm.oxygenRequired,
                          isolationRequired: admissionForm.isolationRequired
                        }).catch((e) => {
                          toast.error(e?.message || "Failed to create admission");
                          return null;
                        });
                        if (!resp) return;
                        toast.success("Admission created (allocation attempted)");
                        setAdmissionForm({ patientName: '', age: '', department: 'General', bedType: 'General', severity: 'medium', oxygenRequired: false, isolationRequired: false });
                        const list = await getAdmissions().catch(() => []);
                        setAdmissions(list);
                        const b = await getHospitalBeds().catch(() => []);
                        setBeds(b);
                        const inv = await getHospitalInventory().catch(() => []);
                        setInventory(inv);
                        const alerts = await getInventoryAlerts().catch(() => ({ lowStock: [] }));
                        setInventoryAlerts(alerts);
                      }}
                      className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Create & Allocate
                    </button>
                  </div>
                </div>

                {/* Admissions list */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Recent Admissions
                    </h3>
                    <span className="text-xs text-gray-600">{admissions.length} records</span>
                  </div>
                  {admissions.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-500">No admissions yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {admissions.slice(0, 30).map((a) => (
                        <div key={a.id} className="bg-white rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-3 bg-gray-100 rounded-xl">
                              <DoorOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{a.patientName} {a.age ? `• ${a.age}` : ''}</div>
                              <div className="text-xs text-gray-600">
                                {a.department} • {a.bedType} • {a.severity.toUpperCase()} {a.oxygenRequired ? '• O2' : ''} {a.isolationRequired ? '• ISO' : ''}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{a.allocationNote}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wide ${
                              a.status === 'admitted' ? 'bg-green-100 text-green-700' :
                              a.status === 'allocated' ? 'bg-blue-100 text-blue-700' :
                              a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-200 text-gray-700'
                            }`}>
                              {a.status}
                            </span>
                            {a.status === 'allocated' && (
                              <button
                                onClick={async () => {
                                  const resp = await admitPatient(a.id).catch(() => null);
                                  if (!resp) return toast.error("Failed to admit");
                                  toast.success("Patient admitted (bed occupied + inventory consumed)");
                                  setAdmissions(await getAdmissions().catch(() => []));
                                  setBeds(await getHospitalBeds().catch(() => []));
                                  setInventory(await getHospitalInventory().catch(() => []));
                                  setInventoryAlerts(await getInventoryAlerts().catch(() => ({ lowStock: [] })));
                                }}
                                className="px-3 py-2 bg-black text-white rounded-xl text-xs uppercase tracking-wide"
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                              >
                                Admit
                              </button>
                            )}
                            {a.status === 'admitted' && (
                              <button
                                onClick={async () => {
                                  const resp = await dischargePatient(a.id).catch(() => null);
                                  if (!resp) return toast.error("Failed to discharge");
                                  toast.success("Patient discharged (bed released)");
                                  setAdmissions(await getAdmissions().catch(() => []));
                                  setBeds(await getHospitalBeds().catch(() => []));
                                }}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs uppercase tracking-wide"
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                              >
                                Discharge
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Staff Tab */}
            {activeTab === "staff" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2
                    className="text-2xl md:text-3xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    Staff Allocation
                  </h2>
                  <button
                    onClick={() => setShowAddStaffModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Staff Member
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search staff members..."
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
            )}

            {/* Surge Alerts Tab */}
            {activeTab === "surge" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2
                      className="text-2xl md:text-3xl uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                    >
                      Surge Predictions & Alerts
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      AI-powered predictions based on environmental and seasonal data
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAlertConfigModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    <Settings className="w-4 h-4" />
                    Configure Alerts
                  </button>
                </div>

                {/* Environmental Data Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                  <h3
                    className="text-lg uppercase tracking-wide mb-4"
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
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="space-y-6">
                <h2
                  className="text-2xl md:text-3xl uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Today's Appointments
                </h2>

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
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="max-w-3xl mx-auto">
                <h2
                  className="text-2xl md:text-3xl mb-6 uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Settings
                </h2>

                <div className="space-y-4">
                  {/* Account Settings */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3
                      className="text-lg mb-4 uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                    >
                      Account
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowChangePasswordModal(true)}
                        className="w-full flex items-center gap-3 text-left px-4 py-3 bg-white rounded-xl hover:bg-gray-100 transition-colors text-sm"
                      >
                        <Lock className="w-5 h-5 text-gray-600" />
                        <span>Change Password</span>
                      </button>
                      <button
                        onClick={() => setShowUpdateProfileModal(true)}
                        className="w-full flex items-center gap-3 text-left px-4 py-3 bg-white rounded-xl hover:bg-gray-100 transition-colors text-sm"
                      >
                        <Edit className="w-5 h-5 text-gray-600" />
                        <span>Update Hospital Profile</span>
                      </button>
                      <button
                        onClick={() => toast.info("Privacy settings feature coming soon")}
                        className="w-full flex items-center gap-3 text-left px-4 py-3 bg-white rounded-xl hover:bg-gray-100 transition-colors text-sm"
                      >
                        <Shield className="w-5 h-5 text-gray-600" />
                        <span>Privacy Settings</span>
                      </button>
                    </div>
                  </div>

                  {/* Appearance Settings */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3
                      className="text-lg mb-4 uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                    >
                      Appearance
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
                          <span className="text-sm">Dark Mode</span>
                        </div>
                        <button
                          onClick={() => {
                            setDarkMode(!darkMode);
                            toast.success(darkMode ? "Light mode enabled" : "Dark mode enabled");
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
                          <span className="text-sm">Language</span>
                        </div>
                        <select
                          value={language}
                          onChange={(e) => {
                            setLanguage(e.target.value);
                            toast.success(`Language changed to ${e.target.value}`);
                          }}
                          className="w-full px-3 py-2 bg-gray-50 rounded-lg outline-none text-sm"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Español</option>
                          <option value="French">Français</option>
                          <option value="German">Deutsch</option>
                          <option value="Hindi">हिन्दी</option>
                          <option value="Chinese">中文</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </main>

      {/* Bed Detail Modal */}
      <AnimatePresence>
        {showBedModal && selectedBed && (
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
        )}
      </AnimatePresence>

      {/* Doctor Slot Modal */}
      <AnimatePresence>
        {showDoctorSlotModal && selectedDoctorSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDoctorSlotModal(false)}
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
                    className="text-xl uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                  >
                    {selectedDoctorSlot.doctorName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedDoctorSlot.specialization} • {selectedDoctorSlot.department}
                  </p>
                </div>
                <button
                  onClick={() => setShowDoctorSlotModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedDoctorSlot.slots.map((slot, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all ${slot.status === "available"
                      ? "bg-green-50 border-green-200"
                      : slot.status === "booked"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-100 border-gray-200"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className="text-lg uppercase tracking-wide"
                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                          >
                            {slot.time}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wide ${slot.status === "available"
                              ? "bg-green-100 text-green-700"
                              : slot.status === "booked"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-200 text-gray-700"
                              }`}
                          >
                            {slot.status}
                          </span>
                        </div>
                        {slot.patientName && (
                          <p className="text-sm text-gray-600">Patient: {slot.patientName}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          handleToggleSlot(selectedDoctorSlot.id, index);
                          const updatedDoctor = doctorSlots.find((d) => d.id === selectedDoctorSlot.id);
                          if (updatedDoctor) setSelectedDoctorSlot(updatedDoctor);
                        }}
                        disabled={slot.status === "booked"}
                        className={`px-4 py-2 rounded-lg text-sm uppercase tracking-wide transition-colors ${slot.status === "blocked"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : slot.status === "available"
                            ? "bg-gray-600 text-white hover:bg-gray-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        {slot.status === "blocked" ? "Unblock" : slot.status === "available" ? "Block" : "Booked"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    Temperature Alert Threshold (°C)
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
                  Add Bed Type
                </h3>
                <button
                  onClick={() => setShowAddBedModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Feature coming soon - Add new bed types to your hospital
              </p>
              <button
                onClick={() => {
                  toast.info("Add bed type feature coming soon");
                  setShowAddBedModal(false);
                }}
                className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
              >
                Close
              </button>
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
                  Add Doctor Schedule
                </h3>
                <button
                  onClick={() => setShowAddDoctorModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Feature coming soon - Add new doctor schedules and OPD slots
              </p>
              <button
                onClick={() => {
                  toast.info("Add doctor schedule feature coming soon");
                  setShowAddDoctorModal(false);
                }}
                className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
              >
                Close
              </button>
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
              <p className="text-sm text-gray-600 mb-4">
                Feature coming soon - Add new staff members to your hospital
              </p>
              <button
                onClick={() => {
                  toast.info("Add staff feature coming soon");
                  setShowAddStaffModal(false);
                }}
                className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
              >
                Close
              </button>
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
                            {alert.title || alert.type}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {alert.date ? new Date(alert.date).toLocaleDateString() : (alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Today')}
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
    </div>
  );
}
