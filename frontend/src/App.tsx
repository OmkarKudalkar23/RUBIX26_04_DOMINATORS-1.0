import { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { PatientDashboard } from "./components/PatientDashboard";
import { DoctorDashboard } from "./components/DoctorDashboard";
import { HospitalDashboard } from "./components/HospitalDashboard";
import { CentralizedDashboard } from "./components/CentralizedDashboard";
import { HeartbeatLoader } from "./components/HeartbeatLoader";
import { Toaster } from "./components/ui/sonner";
import "./styles/bubbles.css";

export default function App() {
  const [userType, setUserType] = useState<"patient" | "doctor" | "hospital" | "admin" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in from localStorage and URL on mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const urlParams = new URLSearchParams(window.location.search);
        const urlPatientId = urlParams.get('id');

        // If URL has patient ID and user is a patient, ensure they match
        if (urlPatientId && user.role === 'patient') {
          // If patientId in localStorage doesn't match URL, update localStorage
          if (user.patientId && user.patientId !== urlPatientId) {
            // URL takes precedence - update localStorage
            const updatedUser = { ...user, patientId: urlPatientId };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else if (!user.patientId && urlPatientId) {
            // URL has ID but localStorage doesn't - update localStorage
            const updatedUser = { ...user, patientId: urlPatientId };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }

          // Auto-login if URL has patient ID
          setUserType(user.role);
          setIsLoggedIn(true);
          setIsLoading(false);
          return;
        } else if (user.role && !urlPatientId && user.patientId) {
          // User is logged in but URL doesn't have ID - update URL
          const newUrl = `${window.location.origin}${window.location.pathname}?id=${user.patientId}`;
          window.history.pushState({}, '', newUrl);
          setUserType(user.role);
          setIsLoggedIn(true);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log('Error checking user state:', e);
    }

    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds loading time
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (type: "patient" | "doctor" | "hospital" | "admin") => {
    setIsLoading(true);
    setTimeout(() => {
      setUserType(type);
      setIsLoggedIn(true);
      setIsLoading(false);
    }, 2000); // 2 seconds loading time on login
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoggedIn(false);
      setUserType(null);
      setIsLoading(false);
    }, 1500); // 1.5 seconds loading time on logout
  };

  // Show loader
  if (isLoading) {
    return <HeartbeatLoader />;
  }

  // If logged in as patient, show only the dashboard
  if (isLoggedIn && userType === "patient") {
    return (
      <>
        <PatientDashboard onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  // If logged in as doctor, show doctor dashboard
  if (isLoggedIn && userType === "doctor") {
    return (
      <>
        <DoctorDashboard onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  // If logged in as hospital
  if (isLoggedIn && userType === "hospital") {
    return (
      <>
        <HospitalDashboard onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  // If logged in as admin (city health dashboard)
  if (isLoggedIn && userType === "admin") {
    return (
      <>
        <CentralizedDashboard onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  // Otherwise, show the landing page
  return <LandingPage onLogin={handleLogin} />;
}
