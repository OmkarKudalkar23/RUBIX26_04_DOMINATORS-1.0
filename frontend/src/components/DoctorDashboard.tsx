import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Chatbot } from "./Chatbot";
import {
  getDoctorProfile,
  getDoctorAppointments,
  updateAppointmentStatus,
  getPatientHistory,
  getHealthAlerts,
  getDoctorMedicalRecords,
  uploadDoctorMedicalRecord,
  deleteDoctorMedicalRecord,
  type MedicalRecord,
  getEarlyWarning,
  getMLPrediction,
  type MLPredictionResponse,
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
  CheckCircle,
  X,
  AlertTriangle,
  Activity,
  FileText,
  Pill,
  Users,
  Hospital,
  Stethoscope,
  Search,
  Filter,
  ChevronRight,
  MessageSquare,
  CheckCheck,
  XCircle,
  AlertCircle,
  TrendingUp,
  Heart,
  Wind,
  Thermometer,
  Cloud,
  Shield,
  Info,
  Eye,
  Upload,
  FileCheck,
  IdCard,
  GraduationCap,
  Building2,
  MapPinned,
  Moon,
  Sun,
  Globe,
  Lock,
  Edit,
  Droplet,
  Folder,
  ScanLine,
} from "lucide-react";

interface DoctorDashboardProps {
  onLogout: () => void;
}

interface PatientAppointment {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  date: string;
  time: string;
  type: "checkup" | "followup" | "emergency";
  status: "pending" | "accepted" | "rejected";
  notes?: string;
  patientId: string;
  symptoms?: string;
  reason?: string;
  scheduledTime?: string;
}

// MedicalRecord interface imported from api.ts

interface PatientHistory {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  address: string;
  lastVisit: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    adherence: number; // percentage
    lastTaken: string;
    missedDoses: number;
  }[];
  prescriptions: {
    id: string;
    date: string;
    diagnosis: string;
    medicines: string[];
  }[];
  vitals: {
    heartRate: string;
    bloodPressure: string;
    temperature: string;
    weight: string;
  };
  medicalRecords?: MedicalRecord[];
  predictions?: {
    type: string;
    risk: string;
    probability: number;
    date: string;
  }[];
}

interface HealthAlert {
  id: string;
  type: "pollution" | "seasonal" | "epidemic" | "weather";
  severity: "low" | "medium" | "high";
  title: string;
  message: string;
  affectedConditions: string[];
  recommendations: string[];
  date: string;
}

export function DoctorDashboard({ onLogout }: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState("appointments");
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientHistory | null>(null);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<Array<{
    id: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    icon: any;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointment | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseType, setResponseType] = useState<"accept" | "reject">("accept");

  // Settings states
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Update profile form
  const [profileForm, setProfileForm] = useState({
    name: "Dr. Sarah Mitchell",
    email: "dr.sarah@healthsync.com",
    phone: "+1 (555) 123-4567",
    consultationFee: "150",
  });

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<"prescription" | "report" | "xray" | "ct-scan" | "mri" | "lab-result" | "other">("report");
  const [doctorMedicalRecords, setDoctorMedicalRecords] = useState<MedicalRecord[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sort appointments: emergency first, then by nearest date
  const sortAppointmentsByDate = (appts: PatientAppointment[]) => {
    return [...appts].sort((a, b) => {
      // Emergency appointments always come first
      if (a.type === "emergency" && b.type !== "emergency") return -1;
      if (a.type !== "emergency" && b.type === "emergency") return 1;

      // If both are emergency or both are not, sort by date/time
      const dateTimeA = new Date(`${a.date} ${a.time}`);
      const dateTimeB = new Date(`${b.date} ${b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  };

  // Appointments state - now loaded from API
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  // Patient history - now fetched per patient on demand
  // Removed hardcoded patientsHistory array - data is fetched from API when needed

  // Health alerts - now loaded from API
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [mlPrediction, setMlPrediction] = useState<MLPredictionResponse | null>(null);

  // Patient history loading state
  const [isLoadingPatientHistory, setIsLoadingPatientHistory] = useState(false);

  // Doctor profile - now loaded from API
  const [doctorProfile, setDoctorProfile] = useState({
    name: "",
    specialty: "",
    qualification: "",
    experience: "",
    email: "",
    phone: "",
    licenseNumber: "",
    workPlace: "",
    workAddress: "",
    consultationFee: 0,
    avatar: "🩺",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch doctor profile on mount
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profile = await getDoctorProfile();
        setDoctorProfile({
          name: profile.name || "Dr. Unknown",
          specialty: profile.specialization || "General",
          qualification: profile.education || "",
          experience: "", // Backend doesn't provide this yet
          email: profile.email || "",
          phone: profile.phone || "",
          licenseNumber: "", // Backend doesn't provide this yet
          workPlace: profile.hospital?.name || "",
          workAddress: profile.hospital?.address || profile.address || "",
          consultationFee: 0, // Backend doesn't provide this yet
          avatar: "🩺",
        });
      } catch (error: any) {
        console.error("Error fetching doctor profile:", error);
        toast.error("Failed to load doctor profile");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchDoctorProfile();
  }, []);

  // Fetch appointments on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoadingAppointments(true);
        setAppointmentsError(null);
        const data = await getDoctorAppointments();

        // Map backend response to PatientAppointment format
        const mappedAppointments: PatientAppointment[] = data.map((apt: any) => ({
          id: apt.id,
          patientName: apt.patientName || "Unknown Patient",
          patientAge: apt.patientAge || 0,
          patientGender: apt.patientGender || "Unknown",
          date: apt.date,
          time: apt.time || "",
          type: apt.type,
          status: apt.status,
          notes: apt.notes || "",
          patientId: apt.patientId || "",
          symptoms: apt.symptoms || "",
        }));

        setAppointments(sortAppointmentsByDate(mappedAppointments));
      } catch (error: any) {
        console.error("Error fetching appointments:", error);
        setAppointmentsError(error.message || "Failed to load appointments");
        toast.error("Failed to load appointments");
      } finally {
        setIsLoadingAppointments(false);
      }
    };
    fetchAppointments();
  }, []);

  // Fetch health alerts on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoadingAlerts(true);

        // Fetch both regular health alerts and early warning alerts
        const [healthAlertsData, earlyWarningData] = await Promise.allSettled([
          getHealthAlerts(),
          getEarlyWarning('Mumbai').catch(() => null) // Default to Mumbai
        ]);

        const alerts: HealthAlert[] = [];

        // Add regular health alerts
        if (healthAlertsData.status === 'fulfilled') {
          const data = healthAlertsData.value;
          const mappedAlerts: HealthAlert[] = data.map((alert: any) => ({
            id: alert.id || `alert-${Date.now()}-${Math.random()}`,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            affectedConditions: alert.affectedConditions || [],
            recommendations: alert.recommendations || [],
            date: alert.date || alert.timestamp || new Date().toISOString().split('T')[0],
          }));
          alerts.push(...mappedAlerts);
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

            const earlyWarningAlert: HealthAlert = {
              id: `early-warning-${Date.now()}`,
              type: typeMap[ew.alert_level] || 'epidemic',
              severity: severityMap[ew.alert_level] || 'medium',
              title: `Early Warning: ${ew.alert_level} Alert - Mumbai`,
              message: ew.message || `Disease outbreak early warning detected. ${ew.total_anomalies} anomalies detected with ${ew.max_spike_percentage.toFixed(1)}% spike.`,
              affectedConditions: ['Respiratory', 'Fever', 'General Health'],
              recommendations: ew.recommendations || [
                'Monitor patient symptoms closely',
                'Prepare for potential surge in cases',
                'Review infection control protocols'
              ],
              date: new Date().toISOString().split('T')[0],
            };
            alerts.push(earlyWarningAlert);
          }
        }

        setHealthAlerts(alerts);
      } catch (error: any) {
        console.error("Error fetching health alerts:", error);
        // Don't show error toast for alerts - they're optional
      } finally {
        setIsLoadingAlerts(false);
      }
    };
    fetchAlerts();

    // Fetch ML Prediction
    getMLPrediction('Mumbai').then(setMlPrediction).catch(console.error);

    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle appointment response
  const handleAppointmentAction = (action: "accept" | "reject") => {
    if (!selectedAppointment) return;

    setResponseType(action);
    setShowResponseModal(true);
  };

  const submitAppointmentResponse = async () => {
    if (!selectedAppointment) return;

    try {
      const status = responseType === "accept" ? "accepted" : "rejected";
      const updatedAppointment = await updateAppointmentStatus(
        selectedAppointment.id,
        status,
        responseMessage
      );

      // Map backend response to PatientAppointment format
      const mappedAppointment: PatientAppointment = {
        id: updatedAppointment.id,
        patientName: updatedAppointment.patientName || "Unknown Patient",
        patientAge: updatedAppointment.patientAge || 0,
        patientGender: updatedAppointment.patientGender || "Unknown",
        date: updatedAppointment.date,
        time: updatedAppointment.time || "",
        type: updatedAppointment.type,
        status: updatedAppointment.status,
        notes: updatedAppointment.notes || "",
        patientId: updatedAppointment.patientId || "",
        symptoms: updatedAppointment.symptoms || "",
      };

      // Update local state
      const updatedAppointments = appointments.map((apt) =>
        apt.id === selectedAppointment.id ? mappedAppointment : apt
      );

      setAppointments(sortAppointmentsByDate(updatedAppointments));
      toast.success(
        `Appointment ${responseType === "accept" ? "accepted" : "rejected"} successfully!`
      );

      setShowResponseModal(false);
      setResponseMessage("");
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast.error(error.message || "Failed to update appointment");
    }
  };

  // View patient history - now fetches from API
  const viewPatientHistory = async (patientId: string) => {
    try {
      setIsLoadingPatientHistory(true);
      const data = await getPatientHistory(patientId);

      // Map backend response to PatientHistory format
      const mappedPatient: PatientHistory = {
        id: data.id,
        name: data.name || "Unknown Patient",
        age: data.age || 0,
        gender: data.gender || "Unknown",
        bloodGroup: data.bloodGroup || "",
        phone: data.phone || "",
        address: data.address || "",
        lastVisit: data.lastVisit || "",
        medicines: [], // Backend doesn't provide this yet - TODO: add medicines endpoint
        prescriptions: [], // Backend doesn't provide this yet - TODO: add prescriptions endpoint
        vitals: {
          heartRate: "N/A", // Backend doesn't provide this yet
          bloodPressure: "N/A",
          temperature: "N/A",
          weight: "N/A",
        },
        medicalRecords: (data.medicalRecords || []).map((record: any) => ({
          id: record.id,
          type: record.type,
          fileName: record.fileName || "",
          fileUrl: record.fileUrl || "",
          uploadDate: record.uploadDate || new Date().toISOString(),
          summary: record.summary,
          extractedData: record.extractedData,
        })),
      };

      setSelectedPatient(mappedPatient);
      setShowPatientHistory(true);
    } catch (error: any) {
      console.error("Error fetching patient history:", error);
      toast.error(error.message || "Failed to load patient history");
    } finally {
      setIsLoadingPatientHistory(false);
    }
  };

  // REMOVED ALL HARDCODED DATA - removed patientsHistory array and duplicate healthAlerts array
  // REMOVED generateAISummary - now handled by backend Gemini API

  // Loading state for medical records
  const [isLoadingMedicalRecords, setIsLoadingMedicalRecords] = useState(false);

  // Fetch medical records from backend
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        setIsLoadingMedicalRecords(true);
        const records = await getDoctorMedicalRecords();
        setDoctorMedicalRecords(records);
      } catch (error: any) {
        console.error("Error fetching medical records:", error);
        toast.error("Failed to load medical records");
      } finally {
        setIsLoadingMedicalRecords(false);
      }
    };
    fetchMedicalRecords();
  }, []);

  // Handle file upload - now uses backend API with Gemini analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PDFs and images are allowed.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    const loadingToast = toast.loading(`Uploading and analyzing ${uploadType}...`);

    try {
      // Upload file and get AI analysis from backend
      const newRecord = await uploadDoctorMedicalRecord(file, uploadType);

      // Add to local state
      setDoctorMedicalRecords([newRecord, ...doctorMedicalRecords]);
      setShowUploadModal(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.dismiss(loadingToast);
      toast.success(`${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} analyzed successfully!`);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error("Error uploading medical record:", error);
      toast.error(error.message || "Failed to upload and analyze document");
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.symptoms?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Get statistics
  const appointmentStats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    accepted: appointments.filter((a) => a.status === "accepted").length,
    rejected: appointments.filter((a) => a.status === "rejected").length,
    emergency: appointments.filter((a) => a.type === "emergency" && a.status === "pending").length,
  };

  const sidebarItems = [
    { id: "appointments", icon: Calendar, label: "Appointments" },
    { id: "alerts", icon: AlertTriangle, label: "Health Alerts" },
    { id: "medicalRecords", icon: Folder, label: "Medical Records" },
    { id: "profile", icon: User, label: "Profile" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  // Initialize dummy medical records for all patients on first load
  React.useEffect(() => {
    const allMedicalRecords = JSON.parse(localStorage.getItem('allPatientMedicalRecords') || '{}');

    // Initialize patient p2 records if not exists
    if (!allMedicalRecords['p2']) {
      allMedicalRecords['p2'] = [
        {
          id: "p2-record-001",
          type: "prescription",
          fileName: "prescription_hypertension.pdf",
          fileUrl: "#",
          uploadDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          summary: "Prescription for Stage 1 Hypertension management. Amlodipine 5mg once daily in the morning. Monitor blood pressure regularly at home. Lifestyle modifications: reduce sodium intake to <2000mg/day, exercise 30 minutes daily, maintain healthy weight. Follow-up in 4 weeks to assess response to treatment."
        },
        {
          id: "p2-record-002",
          type: "lab-result",
          fileName: "glucose_tolerance_test.pdf",
          fileUrl: "#",
          uploadDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          summary: "Oral Glucose Tolerance Test: Fasting glucose: 112 mg/dL (elevated, pre-diabetic range). 2-hour post-glucose: 168 mg/dL (impaired glucose tolerance). HbA1c: 6.1% (pre-diabetes 5.7-6.4%). Patient shows signs of insulin resistance. Recommendations: Weight loss of 5-10%, low glycemic index diet, 150 minutes moderate exercise weekly. Metformin may be considered. Repeat testing in 6 months."
        }
      ];
    }

    // Initialize patient p3 records if not exists
    if (!allMedicalRecords['p3']) {
      allMedicalRecords['p3'] = [
        {
          id: "p3-record-001",
          type: "xray",
          fileName: "chest_xray_cad_screening.jpg",
          fileUrl: "#",
          uploadDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          summary: "Chest X-Ray for CAD evaluation: Mild cardiomegaly noted with cardiothoracic ratio of 0.52 (borderline enlarged). Lung fields are clear bilaterally. No pulmonary edema or pleural effusion. Calcification visible in aortic arch consistent with atherosclerosis. Recommendation: Echocardiogram for detailed cardiac assessment, stress test to evaluate functional capacity. Continue current cardiac medications."
        },
        {
          id: "p3-record-002",
          type: "report",
          fileName: "ecg_angina_evaluation.pdf",
          fileUrl: "#",
          uploadDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
          summary: "12-Lead ECG Analysis: Sinus rhythm at 82 bpm. ST-segment depression of 1.5mm in leads V4-V6 suggestive of lateral wall ischemia. T-wave inversion in leads II, III, aVF. Left ventricular hypertrophy pattern present. Findings consistent with coronary artery disease. Recommendation: Coronary angiography to assess extent of stenosis. Optimize anti-anginal therapy with beta-blockers and nitrates. Consider revascularization if significant blockage."
        },
        {
          id: "p3-record-003",
          type: "lab-result",
          fileName: "cardiac_biomarkers.pdf",
          fileUrl: "#",
          uploadDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          summary: "Cardiac Biomarkers Panel: Troponin I: 0.02 ng/mL (normal <0.04, no acute MI). BNP: 145 pg/mL (mildly elevated, suggests some heart strain). Total Cholesterol: 245 mg/dL (high), LDL: 165 mg/dL (very high risk), HDL: 35 mg/dL (low, increased risk). High-sensitivity CRP: 4.8 mg/L (elevated inflammation). Recommendation: Aggressive statin therapy, aspirin, ACE inhibitor. Target LDL <70 mg/dL for CAD patient."
        }
      ];
    }

    // Initialize patient p4 records if not exists
    if (!allMedicalRecords['p4']) {
      allMedicalRecords['p4'] = [
        {
          id: "p4-record-001",
          type: "report",
          fileName: "holter_monitor_arrhythmia.pdf",
          fileUrl: "#",
          uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          summary: "24-Hour Holter Monitor Results: Total heart beats: 98,450. Frequent premature atrial contractions (PACs): 1,250 episodes. Short runs of atrial fibrillation detected (longest 45 seconds). Average heart rate: 68 bpm (range 52-142). No ventricular arrhythmias. Recommendation: Start anticoagulation to prevent stroke, rate control with beta-blockers, consider electrophysiology study if symptoms worsen."
        }
      ];
    }

    // Initialize patient p5 records if not exists
    if (!allMedicalRecords['p5']) {
      allMedicalRecords['p5'] = [
        {
          id: "p5-record-001",
          type: "ct-scan",
          fileName: "ct_post_surgery_followup.pdf",
          fileUrl: "#",
          uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          summary: "Post-operative CT Scan (Abdominal Surgery): Surgical site shows appropriate healing without abscess formation or fluid collection. No anastomotic leak detected. Bowel loops appear normal with no signs of obstruction or ileus. Minimal expected post-surgical changes in peritoneal fat. No free air or pneumoperitoneum. Recommendation: Continue current recovery protocol, advance diet as tolerated, remove surgical drain if output <30mL/day."
        },
        {
          id: "p5-record-002",
          type: "lab-result",
          fileName: "post_op_cbc_metabolic.pdf",
          fileUrl: "#",
          uploadDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          summary: "Post-operative Labs: CBC: WBC 9,200/mm³ (mild elevation, expected post-op), Hemoglobin 11.8 g/dL (mild anemia from surgery), normal platelet count. Metabolic panel: All electrolytes within normal range, creatinine 0.95 mg/dL (normal kidney function). Liver enzymes slightly elevated but trending down. No signs of infection. Recovery progressing well. Continue iron supplementation for anemia, monitor for any fever or wound complications."
        }
      ];
    }

    localStorage.setItem('allPatientMedicalRecords', JSON.stringify(allMedicalRecords));
  }, []);

  // REMOVED localStorage logic - now using backend API

  // Function to add toast notification
  const addToastNotification = (message: string, type: "info" | "success" | "warning" | "error", icon: any) => {
    const id = Date.now().toString();
    setToastNotifications(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => {
      setToastNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  // Show notification popup on login if there are pending appointments
  React.useEffect(() => {
    const hasSeenNotificationPopup = sessionStorage.getItem('hasSeenDoctorNotificationPopup');
    if (!hasSeenNotificationPopup && appointmentStats.pending > 0) {
      setTimeout(() => {
        setShowNotificationPopup(true);
        sessionStorage.setItem('hasSeenDoctorNotificationPopup', 'true');
      }, 2000);
    }
  }, []);

  // Show missed notifications on login
  React.useEffect(() => {
    const hasSeenMissedNotifications = sessionStorage.getItem('hasSeenDoctorMissedNotifications');
    if (!hasSeenMissedNotifications) {
      const missedNotifications = [
        { message: "New appointment request from Michael Brown", type: "info" as const, icon: Calendar, delay: 1000 },
        { message: "Lab results uploaded for patient Emma Davis", type: "success" as const, icon: FileText, delay: 1500 },
        { message: "Urgent: Emergency consultation requested", type: "error" as const, icon: AlertCircle, delay: 2000 },
        { message: "Patient John Smith completed pre-appointment form", type: "info" as const, icon: User, delay: 2500 },
        { message: "Reminder: Staff meeting at 3 PM today", type: "warning" as const, icon: Clock, delay: 3000 },
      ];

      missedNotifications.forEach((notif) => {
        setTimeout(() => {
          addToastNotification(notif.message, notif.type, notif.icon);
        }, notif.delay);
      });

      sessionStorage.setItem('hasSeenDoctorMissedNotifications', 'true');
    }
  }, []);

  // Simulate real-time notifications
  React.useEffect(() => {
    const notificationIntervals: NodeJS.Timeout[] = [];

    // Simulate new appointment requests
    const appointmentInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const patientNames = ["John Smith", "Sarah Williams", "Michael Brown", "Emma Davis"];
        const randomPatient = patientNames[Math.floor(Math.random() * patientNames.length)];
        addToastNotification(
          `New appointment request from ${randomPatient}`,
          "info",
          Calendar
        );
      }
    }, 40000); // Every 40 seconds

    // Simulate urgent cases
    const urgentInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        addToastNotification(
          "Urgent: Emergency consultation requested",
          "error",
          AlertCircle
        );
      }
    }, 50000); // Every 50 seconds

    // Simulate lab results
    const labInterval = setInterval(() => {
      if (Math.random() > 0.75) {
        addToastNotification(
          "Lab results uploaded for your patient",
          "success",
          FileText
        );
      }
    }, 35000); // Every 35 seconds

    notificationIntervals.push(appointmentInterval, urgentInterval, labInterval);

    return () => {
      notificationIntervals.forEach(interval => clearInterval(interval));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white">
        <div className="px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1
                className="text-2xl md:text-3xl uppercase tracking-wide"
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
              >
                HEALTH SYNC
              </h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Doctor Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p
                className="text-sm uppercase tracking-wide"
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
              >
                {doctorProfile.name}
              </p>
              <p className="text-xs text-gray-500">{doctorProfile.specialty}</p>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotificationPopup(true)}
              className="relative p-2 md:p-3 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              {appointmentStats.pending > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center bg-yellow-500 text-white" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                  {appointmentStats.pending}
                </span>
              )}
            </button>

            <button
              onClick={onLogout}
              className="p-2 md:p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 pt-24 px-4 shadow-2xl"
            >
              <nav className="space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setShowSidebar(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                        ? "bg-black text-white"
                        : "hover:bg-gray-100 text-gray-700"
                        }`}
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm uppercase tracking-wide">{item.label}</span>
                      {item.id === "medicalRecords" && doctorMedicalRecords.length > 0 && (
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${activeTab === item.id ? "bg-white text-black" : "bg-black text-white"
                          }`}>
                          {doctorMedicalRecords.length}
                        </span>
                      )}
                      {item.id === "appointments" && appointmentStats.pending > 0 && (
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${activeTab === item.id ? "bg-white text-black" : "bg-black text-white"
                          }`}>
                          {appointmentStats.pending}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-24 px-4 md:px-8 pb-8">
        {/* ML Prediction Alert */}
        {mlPrediction && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                <Activity className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2">
                    AI Clinical Advisory
                    <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">FORECAST</span>
                  </h3>
                  <span className="text-xs text-blue-600 font-medium">
                    Updated: {new Date(mlPrediction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-blue-800 mb-3 leading-relaxed">
                  {mlPrediction.doctor_dashboard}
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-blue-700 bg-white/60 p-2 rounded-lg inline-flex">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Expected Patients (24h): <span className="text-blue-900 font-bold text-sm">{mlPrediction.expected_patients_next_24h}</span>
                  </span>
                  <div className="w-px h-3 bg-blue-300"></div>
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5" />
                    AQI Impact: <span className={`font-bold text-sm ${mlPrediction.aqi > 150 ? 'text-red-600' : 'text-blue-900'}`}>{mlPrediction.aqi}</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <div className="max-w-7xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <p className="text-xs text-gray-600 uppercase tracking-wider">Total</p>
                </div>
                <p
                  className="text-2xl"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  {appointmentStats.total}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs text-yellow-600 uppercase tracking-wider">Pending</p>
                </div>
                <p
                  className="text-2xl text-yellow-600"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  {appointmentStats.pending}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-600 uppercase tracking-wider">Accepted</p>
                </div>
                <p
                  className="text-2xl text-green-600"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  {appointmentStats.accepted}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-red-600 uppercase tracking-wider">Rejected</p>
                </div>
                <p
                  className="text-2xl text-red-600"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  {appointmentStats.rejected}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <p className="text-xs text-orange-600 uppercase tracking-wider">Emergency</p>
                </div>
                <p
                  className="text-2xl text-orange-600"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  {appointmentStats.emergency}
                </p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients or symptoms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "pending", "accepted", "rejected"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterStatus(filter)}
                    className={`px-4 py-3 rounded-xl transition-all text-xs uppercase tracking-wider ${filterStatus === filter
                      ? "bg-black text-white"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments List */}
            <div className="space-y-3">
              {isLoadingAppointments ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading appointments...</p>
                </div>
              ) : appointmentsError ? (
                <div className="text-center py-12 bg-red-50 rounded-2xl">
                  <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                  <p className="text-red-500">{appointmentsError}</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No appointments found</p>
                </div>
              ) : (
                filteredAppointments.map((apt) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-50 rounded-2xl p-4 md:p-6 ${apt.type === "emergency" ? "ring-2 ring-rose-200" : ""
                      }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className="text-lg uppercase tracking-wide"
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                              >
                                {apt.patientName}
                              </h3>
                              {apt.type === "emergency" && (
                                <span className="px-2 py-1 bg-rose-200 text-rose-800 text-xs rounded-lg uppercase tracking-wider">
                                  Emergency
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {apt.patientAge} years • {apt.patientGender}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wider ${apt.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : apt.status === "accepted"
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-rose-100 text-rose-600"
                              }`}
                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                          >
                            {apt.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{apt.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{apt.time}</span>
                          </div>
                        </div>

                        {apt.symptoms && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                              Symptoms
                            </p>
                            <p className="text-sm text-gray-700">{apt.symptoms}</p>
                          </div>
                        )}

                        {apt.notes && (
                          <div className="bg-white p-3 rounded-xl">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                              Your Response
                            </p>
                            <p className="text-sm text-gray-700">{apt.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-2">
                        <button
                          onClick={() => viewPatientHistory(apt.patientId)}
                          className="flex-1 md:flex-none px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors text-sm uppercase tracking-wider"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                        {apt.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                handleAppointmentAction("accept");
                              }}
                              className="flex-1 md:flex-none px-4 py-2 bg-emerald-300 hover:bg-emerald-400 text-white rounded-xl transition-colors text-sm uppercase tracking-wider"
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                            >
                              <CheckCheck className="w-4 h-4 mx-auto" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                handleAppointmentAction("reject");
                              }}
                              className="flex-1 md:flex-none px-4 py-2 bg-rose-300 hover:bg-rose-400 text-white rounded-xl transition-colors text-sm uppercase tracking-wider"
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                            >
                              <X className="w-4 h-4 mx-auto" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Health Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-2xl md:text-3xl mb-6 uppercase tracking-wide"
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
            >
              Health Alerts & Recommendations
            </h2>

            <div className="space-y-4">
              {isLoadingAlerts ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading health alerts...</p>
                </div>
              ) : healthAlerts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No health alerts at this time</p>
                </div>
              ) : (
                healthAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 ${alert.severity === "high"
                      ? "bg-red-50 ring-2 ring-red-200"
                      : alert.severity === "medium"
                        ? "bg-orange-50 ring-2 ring-orange-200"
                        : "bg-blue-50 ring-2 ring-blue-200"
                      }`}
                  >
                    {/* Alert Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-3 rounded-xl ${alert.severity === "high"
                            ? "bg-red-200"
                            : alert.severity === "medium"
                              ? "bg-orange-200"
                              : "bg-blue-200"
                            }`}
                        >
                          {alert.type === "pollution" && <Wind className="w-6 h-6" />}
                          {alert.type === "seasonal" && <Calendar className="w-6 h-6" />}
                          {alert.type === "epidemic" && <Shield className="w-6 h-6" />}
                          {alert.type === "weather" && <Cloud className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3
                            className="text-xl mb-1 uppercase tracking-wide"
                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                          >
                            {alert.title}
                          </h3>
                          <p className="text-sm text-gray-600">{alert.date}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wider ${alert.severity === "high"
                          ? "bg-red-200 text-red-800"
                          : alert.severity === "medium"
                            ? "bg-orange-200 text-orange-800"
                            : "bg-blue-200 text-blue-800"
                          }`}
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    {/* Alert Message */}
                    <p className="text-gray-700 mb-4">{alert.message}</p>

                    {/* Affected Conditions */}
                    <div className="mb-4">
                      <p
                        className="text-xs text-gray-600 uppercase tracking-wider mb-2"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        Affected Conditions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {alert.affectedConditions.map((condition, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white rounded-lg text-sm"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <p
                        className="text-xs text-gray-600 uppercase tracking-wider mb-3"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                      >
                        Preparation & Recommendations
                      </p>
                      <div className="space-y-2">
                        {alert.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-white p-3 rounded-xl">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-2xl md:text-3xl mb-6 uppercase tracking-wide"
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
            >
              Doctor Profile
            </h2>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              {/* Profile Header */}
              <div className="flex items-start gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center text-4xl">
                  {doctorProfile.avatar}
                </div>
                <div className="flex-1">
                  <h3
                    className="text-2xl mb-1 uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                  >
                    {doctorProfile.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{doctorProfile.specialty}</p>
                  <p className="text-sm text-gray-500">{doctorProfile.qualification}</p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Experience
                  </p>
                  <p className="text-gray-800">{doctorProfile.experience}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    License Number
                  </p>
                  <p className="text-gray-800">{doctorProfile.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Email
                  </p>
                  <p className="text-gray-800">{doctorProfile.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Phone
                  </p>
                  <p className="text-gray-800">{doctorProfile.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Work Place
                  </p>
                  <p className="text-gray-800">{doctorProfile.workPlace}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Consultation Fee
                  </p>
                  <p className="text-gray-800">${doctorProfile.consultationFee}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Work Address
                  </p>
                  <p className="text-gray-800">{doctorProfile.workAddress}</p>
                </div>
              </div>
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
                    <span>Update Profile</span>
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

        {/* Medical Records Tab */}
        {activeTab === "medicalRecords" && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2
                  className="text-2xl md:text-3xl mb-2 uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                >
                  Medical Records
                </h2>
                <p className="text-gray-600">Upload and analyze medical documents with AI</p>
                {doctorMedicalRecords.length > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Latest upload: {new Date(Math.max(...doctorMedicalRecords.map(r => new Date(r.uploadDate).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>

            {/* Stats Overview */}
            {doctorMedicalRecords.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
                  <FileText className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                    {doctorMedicalRecords.length}
                  </p>
                  <p className="text-xs text-blue-700 uppercase tracking-wide">Total Documents</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4">
                  <ScanLine className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                    {doctorMedicalRecords.filter(r => ['xray', 'ct-scan', 'mri'].includes(r.type)).length}
                  </p>
                  <p className="text-xs text-purple-700 uppercase tracking-wide">Imaging Reports</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
                  <Activity className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                    {doctorMedicalRecords.filter(r => r.type === 'lab-result' || r.type === 'report').length}
                  </p>
                  <p className="text-xs text-green-700 uppercase tracking-wide">Lab Reports</p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-4">
                  <Pill className="w-6 h-6 text-rose-600 mb-2" />
                  <p className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                    {doctorMedicalRecords.filter(r => r.type === 'prescription').length}
                  </p>
                  <p className="text-xs text-rose-700 uppercase tracking-wide">Prescriptions</p>
                </div>
              </div>
            )}

            {isLoadingMedicalRecords ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading medical records...</p>
                </div>
              </div>
            ) : doctorMedicalRecords.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-12 text-center">
                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl mb-2" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                  No Medical Records Yet
                </h3>
                <p className="text-gray-500 mb-6">Upload your first medical document to get AI analysis</p>
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
              <div className="grid gap-4">
                {doctorMedicalRecords.map((record) => {
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
                    prescription: "bg-blue-50 border-blue-200",
                    report: "bg-green-50 border-green-200",
                    xray: "bg-purple-50 border-purple-200",
                    "ct-scan": "bg-purple-50 border-purple-200",
                    mri: "bg-indigo-50 border-indigo-200",
                    "lab-result": "bg-rose-50 border-rose-200",
                    other: "bg-gray-50 border-gray-200"
                  };

                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl p-6 border-2 ${typeColors[record.type]}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${typeColors[record.type]} flex items-center justify-center flex-shrink-0`}>
                          <TypeIcon className="w-6 h-6 text-gray-700" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3
                                className="text-lg uppercase tracking-wide"
                                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                              >
                                {record.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                              </h3>
                              <p className="text-sm text-gray-500">{record.fileName}</p>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {new Date(record.uploadDate).toLocaleDateString()}
                            </span>
                          </div>

                          {record.summary && (
                            <div className="bg-white rounded-xl p-4 mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">AI Analysis</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{record.summary}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(record.fileUrl, '_blank')}
                              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                            >
                              View Document
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this record?')) {
                                  return;
                                }

                                try {
                                  await deleteDoctorMedicalRecord(record.id);
                                  setDoctorMedicalRecords(doctorMedicalRecords.filter(r => r.id !== record.id));
                                  toast.success("Record deleted successfully");
                                } catch (error: any) {
                                  console.error("Error deleting record:", error);
                                  toast.error(error.message || "Failed to delete record");
                                }
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
          </div>
        )}
      </main>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowResponseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  {responseType === "accept" ? "Accept" : "Reject"} Appointment
                </h3>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Patient: {selectedAppointment.patientName}</p>
                <p className="text-sm text-gray-600">
                  {selectedAppointment.date} at {selectedAppointment.time}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-xs text-gray-600 uppercase tracking-wider mb-2">
                  {responseType === "accept" ? "Confirmation" : "Reason"} Message
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={
                    responseType === "accept"
                      ? "Add any special instructions or confirmations..."
                      : "Please provide a reason for rejection..."
                  }
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors uppercase tracking-wider text-sm"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitAppointmentResponse}
                  className={`flex-1 px-4 py-3 rounded-xl transition-colors uppercase tracking-wider text-sm text-white ${responseType === "accept"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                    }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient History Modal */}
      <AnimatePresence>
        {showPatientHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowPatientHistory(false);
              setSelectedPatient(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 md:p-6">
                {isLoadingPatientHistory ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-500">Loading patient history...</p>
                  </div>
                ) : selectedPatient ? (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3
                          className="text-2xl uppercase tracking-wide mb-1"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                        >
                          {selectedPatient.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.bloodGroup}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPatientHistory(false)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Contact Info */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                        <p className="text-sm text-gray-800">{selectedPatient.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Visit</p>
                        <p className="text-sm text-gray-800">{selectedPatient.lastVisit}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</p>
                        <p className="text-sm text-gray-800">{selectedPatient.address}</p>
                      </div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Folder className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-blue-600 uppercase tracking-wider">Documents</span>
                        </div>
                        <p className="text-2xl text-blue-900" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                          {selectedPatient.medicalRecords?.length || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 uppercase tracking-wider">Prescriptions</span>
                        </div>
                        <p className="text-2xl text-green-900" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                          {selectedPatient.prescriptions?.length || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-purple-600 uppercase tracking-wider">Predictions</span>
                        </div>
                        <p className="text-2xl text-purple-900" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                          {selectedPatient.predictions?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Current Vitals */}
                    <div className="mb-6">
                      <h4
                        className="text-lg mb-3 uppercase tracking-wide"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                      >
                        Current Vitals
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-red-50 p-4 rounded-xl">
                          <Heart className="w-5 h-5 text-red-600 mb-2" />
                          <p className="text-xs text-gray-600 mb-1">Heart Rate</p>
                          <p
                            className="text-lg"
                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                          >
                            {selectedPatient.vitals.heartRate}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl">
                          <Activity className="w-5 h-5 text-blue-600 mb-2" />
                          <p className="text-xs text-gray-600 mb-1">BP</p>
                          <p
                            className="text-lg"
                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                          >
                            {selectedPatient.vitals.bloodPressure}
                          </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl">
                          <Thermometer className="w-5 h-5 text-orange-600 mb-2" />
                          <p className="text-xs text-gray-600 mb-1">Temperature</p>
                          <p
                            className="text-lg"
                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                          >
                            {selectedPatient.vitals.temperature}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl">
                          <TrendingUp className="w-5 h-5 text-purple-600 mb-2" />
                          <p className="text-xs text-gray-600 mb-1">Weight</p>
                          <p
                            className="text-lg"
                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                          >
                            {selectedPatient.vitals.weight}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Medicine Adherence - Last 30 Days */}
                    <div className="mb-6">
                      <h4
                        className="text-lg mb-3 uppercase tracking-wide"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                      >
                        Medicine Adherence (Last 30 Days)
                      </h4>
                      <div className="space-y-3">
                        {selectedPatient.medicines.map((med, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <Pill className="w-5 h-5 text-gray-600" />
                                  <h5
                                    className="uppercase tracking-wide"
                                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                                  >
                                    {med.name}
                                  </h5>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {med.dosage} • {med.frequency}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`text-2xl ${med.adherence >= 90
                                    ? "text-green-600"
                                    : med.adherence >= 70
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                    }`}
                                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                                >
                                  {med.adherence}%
                                </p>
                                <p className="text-xs text-gray-500">Adherence</p>
                              </div>
                            </div>

                            {/* Adherence Progress Bar */}
                            <div className="mb-3">
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${med.adherence >= 90
                                    ? "bg-green-500"
                                    : med.adherence >= 70
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                    }`}
                                  style={{ width: `${med.adherence}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                  Last Taken
                                </p>
                                <p className="text-gray-800">{med.lastTaken}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                  Missed Doses
                                </p>
                                <p className="text-gray-800">{med.missedDoses} doses</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Health Predictions */}
                    {selectedPatient.predictions && selectedPatient.predictions.length > 0 && (
                      <div className="mb-6">
                        <h4
                          className="text-lg mb-3 uppercase tracking-wide"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                        >
                          Disease Risk Predictions
                        </h4>
                        <div className="space-y-3">
                          {selectedPatient.predictions.map((prediction: any) => (
                            <div
                              key={prediction.id}
                              className={`p-4 rounded-xl border-2 ${prediction.risk === "high"
                                ? "bg-red-50 border-red-200"
                                : prediction.risk === "medium"
                                  ? "bg-yellow-50 border-yellow-200"
                                  : "bg-green-50 border-green-200"
                                }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  {prediction.type === "heart" && (
                                    <Heart
                                      className={`w-6 h-6 ${prediction.risk === "high"
                                        ? "text-red-600"
                                        : prediction.risk === "medium"
                                          ? "text-yellow-600"
                                          : "text-green-600"
                                        }`}
                                    />
                                  )}
                                  {prediction.type === "diabetes" && (
                                    <Droplet
                                      className={`w-6 h-6 ${prediction.risk === "high"
                                        ? "text-red-600"
                                        : prediction.risk === "medium"
                                          ? "text-yellow-600"
                                          : "text-green-600"
                                        }`}
                                    />
                                  )}
                                  {prediction.type === "kidney" && (
                                    <Activity
                                      className={`w-6 h-6 ${prediction.risk === "high"
                                        ? "text-red-600"
                                        : prediction.risk === "medium"
                                          ? "text-yellow-600"
                                          : "text-green-600"
                                        }`}
                                    />
                                  )}
                                  {prediction.type === "sepsis" && (
                                    <AlertCircle
                                      className={`w-6 h-6 ${prediction.risk === "high"
                                        ? "text-red-600"
                                        : prediction.risk === "medium"
                                          ? "text-yellow-600"
                                          : "text-green-600"
                                        }`}
                                    />
                                  )}
                                  <div>
                                    <h5
                                      className="uppercase tracking-wide capitalize"
                                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                                    >
                                      {prediction.type === "heart"
                                        ? "Heart Disease"
                                        : prediction.type === "kidney"
                                          ? "Chronic Kidney Disease"
                                          : prediction.type}
                                    </h5>
                                    <p className="text-xs text-gray-500">
                                      {new Date(prediction.date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-lg text-xs uppercase ${prediction.risk === "high"
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

                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600 uppercase tracking-wider">
                                    Probability
                                  </span>
                                  <span className="text-sm font-semibold">{prediction.probability}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${prediction.risk === "high"
                                      ? "bg-red-600"
                                      : prediction.risk === "medium"
                                        ? "bg-yellow-600"
                                        : "bg-green-600"
                                      }`}
                                    style={{ width: `${prediction.probability}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg p-3 mb-3">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                  Recommendation
                                </p>
                                <p className="text-sm text-gray-700">{prediction.recommendation}</p>
                              </div>

                              <details className="group">
                                <summary className="cursor-pointer text-xs text-gray-600 hover:text-black transition-colors uppercase tracking-wider">
                                  View Input Parameters
                                </summary>
                                <div className="mt-2 bg-white rounded-lg p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {Object.entries(prediction.inputs).map(([key, value]: [string, any]) => (
                                    <div key={key} className="text-xs">
                                      <span className="text-gray-500 capitalize block">
                                        {key.replace(/([A-Z])/g, " $1").trim()}
                                      </span>
                                      <span className="font-medium">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medical Records */}
                    {selectedPatient.medicalRecords && selectedPatient.medicalRecords.length > 0 && (
                      <div className="mb-6">
                        <h4
                          className="text-lg mb-3 uppercase tracking-wide"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                        >
                          Medical Records & Documents
                        </h4>
                        <div className="space-y-3">
                          {selectedPatient.medicalRecords.map((record: MedicalRecord) => {
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
                              prescription: "bg-blue-50 border-blue-200",
                              report: "bg-green-50 border-green-200",
                              xray: "bg-purple-50 border-purple-200",
                              "ct-scan": "bg-purple-50 border-purple-200",
                              mri: "bg-indigo-50 border-indigo-200",
                              "lab-result": "bg-rose-50 border-rose-200",
                              other: "bg-gray-50 border-gray-200"
                            };

                            return (
                              <div
                                key={record.id}
                                className={`p-4 rounded-xl border-2 ${typeColors[record.type]}`}
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <TypeIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1" />
                                  <div className="flex-1 min-w-0">
                                    <h5
                                      className="uppercase tracking-wide mb-1"
                                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                                    >
                                      {record.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    </h5>
                                    <p className="text-xs text-gray-500 mb-2">
                                      {record.fileName} • {new Date(record.uploadDate).toLocaleDateString()}
                                    </p>

                                    {/* AI Summary */}
                                    {record.summary && (
                                      <div className="bg-white rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            AI Analysis
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed">{record.summary}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => window.open(record.fileUrl, '_blank')}
                                  className="w-full mt-2 px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                >
                                  View Document
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Previous Prescriptions */}
                    <div>
                      <h4
                        className="text-lg mb-3 uppercase tracking-wide"
                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                      >
                        Previous Prescriptions
                      </h4>
                      <div className="space-y-3">
                        {selectedPatient.prescriptions.map((rx) => (
                          <div key={rx.id} className="bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-600" />
                                <span className="text-sm text-gray-600">{rx.date}</span>
                              </div>
                              <span className="text-xs text-gray-500 uppercase tracking-wider">
                                {rx.id}
                              </span>
                            </div>
                            <p className="text-sm mb-2">
                              <span className="text-xs text-gray-500 uppercase tracking-wider">
                                Diagnosis:{" "}
                              </span>
                              <span className="text-gray-800">{rx.diagnosis}</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {rx.medicines.map((medicine, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-white rounded-lg text-sm text-gray-700"
                                >
                                  {medicine}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                    <p className="text-red-500">Failed to load patient history</p>
                  </div>
                )}
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md"
            >
              <div className="p-6">
                <h3
                  className="text-xl uppercase tracking-wide mb-4"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  Change Password
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-xs text-gray-600 uppercase tracking-wider mb-2"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs text-gray-600 uppercase tracking-wider mb-2"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs text-gray-600 uppercase tracking-wider mb-2"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowChangePasswordModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors uppercase tracking-wider text-sm"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Add password change logic here
                      toast.success("Password changed successfully!");
                      setShowChangePasswordModal(false);
                    }}
                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors uppercase tracking-wider text-sm"
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md"
            >
              <div className="p-6">
                <h3
                  className="text-xl uppercase tracking-wide mb-4"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  Update Profile
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-xs text-gray-600 uppercase tracking-wider mb-2"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs text-gray-600 uppercase tracking-wider mb-2"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs text-gray-600 uppercase tracking-wider mb-2"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Phone
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs text-gray-600 uppercase tracking-wider mb-2"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Consultation Fee
                    </label>
                    <input
                      type="text"
                      value={profileForm.consultationFee}
                      onChange={(e) => setProfileForm({ ...profileForm, consultationFee: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowUpdateProfileModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors uppercase tracking-wider text-sm"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Add profile update logic here
                      toast.success("Profile updated successfully!");
                      setShowUpdateProfileModal(false);
                    }}
                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors uppercase tracking-wider text-sm"
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
                onChange={handleFileUpload}
                className="hidden"
              />

              <p className="text-xs text-gray-500 mt-4 text-center">
                AI will analyze and generate a comprehensive summary of the medical document
              </p>
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
                  <div className="p-3 bg-yellow-100 rounded-2xl">
                    <Bell className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      New Notifications
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      You have {appointmentStats.pending} pending appointment{appointmentStats.pending > 1 ? 's' : ''}
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
                {appointments
                  .filter(apt => apt.status === "pending")
                  .slice(0, 5)
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 rounded-2xl border bg-gray-50 border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-blue-500">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                            {appointment.patientName}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {appointment.reason}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(appointment.scheduledTime).toLocaleString()}
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs uppercase" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowNotificationPopup(false);
                    setActiveTab("appointments");
                  }}
                  className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                >
                  View All
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
      <Chatbot userType="doctor" />
    </div>
  );
}