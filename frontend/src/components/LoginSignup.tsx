import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, Eye, EyeOff, UserCircle, Stethoscope, Building2, Droplet, Calendar, Phone, MapPin, FileText, Upload, GraduationCap, IdCard, Briefcase, Plus, Trash2, BedDouble } from "lucide-react";

interface LoginSignupProps {
  onClose: () => void;
  onLogin: (userType: "patient" | "doctor" | "hospital") => void;
}

interface DoctorData {
  id: string;
  name: string;
  specialization: string;
  certificateFile: File | null;
  aadhaarFile: File | null;
}

interface BedTypeData {
  id: string;
  type: string;
  count: number;
}

export function LoginSignup({ onClose, onLogin }: LoginSignupProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"patient" | "doctor" | "hospital">("patient");
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bloodGroup: "",
    dob: "",
    gender: "",
    phone: "",
    address: "",
    medicalHistory: "",
    age: "",
    education: "",
    certificateFile: null as File | null,
    aadhaarFile: null as File | null,
    // Doctor specific fields
    specialization: "",
    // Hospital specific fields
    hospitalName: "",
    registrationFile: null as File | null,
  });

  // Add state for login/signup error messages
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");

  // Hospital specific states
  const [doctors, setDoctors] = useState([
    { id: "1", name: "", specialization: "", certificateFile: null, aadhaarFile: null },
  ]);
  const [bedTypes, setBedTypes] = useState([
    { id: "1", type: "ICU", count: 0 },
    { id: "2", type: "General", count: 0 },
    { id: "3", type: "Private", count: 0 },
    { id: "4", type: "Emergency", count: 0 },
  ]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Handle login
    if (isLogin) {
      // Validate input
      if (!formData.email || !formData.password) {
        setLoginError("Please enter both email and password");
        return;
      }

      setLoginError(""); // Clear previous errors

      try {
        console.log('Attempting login with:', formData.email);
        const response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
          }),
        });

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          setLoginError("Server returned invalid response. Please try again.");
          return;
        }

        console.log('Login response status:', response.status);
        console.log('Login response data:', data);

        if (response.ok && data.token && data.user) {
          // Clear any previous error
          setLoginError("");
          // Store user data and token in localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('Login successful, user data:', data.user);
          console.log('Stored in localStorage:', JSON.parse(localStorage.getItem('user') || '{}'));

          // Update URL with patient ID if user is a patient
          if (data.user.role === 'patient' && data.user.patientId) {
            const newUrl = `${window.location.origin}${window.location.pathname}?id=${data.user.patientId}`;
            window.history.pushState({}, '', newUrl);
            console.log('Updated URL with patient ID:', data.user.patientId);
          }

          // Check if user has a profile (patientId or doctorId)
          // If not, show additional info form to complete profile
          if (data.user.role === 'patient' && !data.user.patientId) {
            console.log('Patient login successful but no profile found. Prompting for profile creation.');
            setShowAdditionalInfo(true);
          } else if (data.user.role === 'doctor' && !data.user.doctorId) {
            console.log('Doctor login successful but no profile found. Prompting for profile creation.');
            setShowAdditionalInfo(true);
          } else {
            // Call the onLogin callback with the user's role
            onLogin(data.user.role);
          }
        } else {
          // Set error message for invalid credentials
          const errorMsg = data.message || data.error || "Invalid email or password. Please try again.";
          setLoginError(errorMsg);
          console.error('Login failed:', errorMsg);
        }
      } catch (error: any) {
        console.error('Login network error:', error);
        // Set error message for network issues
        setLoginError("Failed to connect to server. Please check if the backend is running on http://localhost:5000");
      }
    } else {
      // Handle signup
      // Validate input
      if (!formData.name || !formData.email || !formData.password) {
        setSignupError("Please fill in all required fields");
        return;
      }

      if (formData.password.length < 6) {
        setSignupError("Password must be at least 6 characters long");
        return;
      }

      setSignupError(""); // Clear previous errors

      try {
        console.log('Attempting signup with:', formData.email);
        const response = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            role: userType,
          }),
        });

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          setSignupError("Server returned invalid response. Please try again.");
          return;
        }

        console.log('Signup response status:', response.status);
        console.log('Signup response data:', data);

        if (response.ok && data.token && data.user) {
          // Clear any previous error
          setSignupError("");
          // Store user data and token in localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('Signup successful, user data:', data.user);

          // For patient or doctor signup, show additional info form to create profile
          if (userType === "patient" || userType === "doctor") {
            setShowAdditionalInfo(true);
          } else {
            // For hospital, directly login after signup (or show its own flow if needed)
            onLogin(userType);
          }
        } else {
          // Set error message for signup issues
          const errorMsg = data.message || data.error || "Signup failed. Please try again.";
          setSignupError(errorMsg);
          console.error('Signup failed:', errorMsg);
        }
      } catch (error: any) {
        console.error('Signup network error:', error);
        // Set error message for network issues
        setSignupError("Failed to connect to server. Please check if the backend is running on http://localhost:5000");
      }
    }
  };

  const handleAdditionalInfoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate required fields
    // Validate required fields
    if (!formData.age || !formData.gender || !formData.dob) {
      setSignupError("Please fill in all required fields (Age, Gender, Date of Birth)");
      return;
    }

    if (userType === 'patient' && !formData.bloodGroup) {
      setSignupError("Please select a Blood Group");
      return;
    }

    if (userType === 'doctor' && !formData.specialization) {
      setSignupError("Please enter Specialization");
      return;
    }

    setSignupError(""); // Clear previous errors

    try {
      // Get user from localStorage (stored during signup)
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setSignupError("Session expired. Please sign up again.");
        return;
      }

      const user = JSON.parse(userStr);
      console.log('Creating patient profile for user:', user.id);

      // Create patient profile
      // Create profile based on user role
      let endpoint = "http://localhost:5000/api/profiles/patient";
      let body: any = {
        userId: user.id,
        age: parseInt(formData.age),
        gender: formData.gender,
        dob: formData.dob,
        phone: formData.phone || "",
        address: formData.address || "",
        education: formData.education || "",
        certificateUrl: "", // File upload would be handled separately
        aadhaarUrl: "", // File upload would be handled separately
      };

      if (userType === 'patient') {
        body.bloodGroup = formData.bloodGroup;
        body.medicalHistory = formData.medicalHistory ? formData.medicalHistory.split(',').map((h: string) => h.trim()) : [];
      } else if (userType === 'doctor') {
        endpoint = "http://localhost:5000/api/profiles/doctor";
        body.name = user.name; // Include name for doctor profile
        body.specialization = formData.specialization;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        setSignupError("Server returned invalid response. Please try again.");
        return;
      }

      console.log('Profile creation response:', response.status, data);

      if (response.ok) {
        if (data.patient) {
          // Update user with patientId
          const patientId = data.patient._id || data.patient.id;
          const updatedUser = {
            ...user,
            patientId: patientId
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Patient profile created, updated user:', updatedUser);

          // Update URL with patient ID
          const newUrl = `${window.location.origin}${window.location.pathname}?id=${patientId}`;
          window.history.pushState({}, '', newUrl);
          console.log('Updated URL with patient ID:', patientId);

          // Clear any previous error
          setSignupError("");
          // Call the onLogin callback with the user's role
          onLogin("patient");
        } else if (data.doctor) {
          // Update user with doctorId
          const doctorId = data.doctor._id || data.doctor.id;
          const updatedUser = {
            ...user,
            doctorId: doctorId
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Doctor profile created, updated user:', updatedUser);

          setSignupError("");
          onLogin("doctor");
        }
      } else {
        const errorMsg = data.message || data.error || "Failed to create profile. Please try again.";
        setSignupError(errorMsg);
        console.error('Profile creation failed:', errorMsg);
      }
    } catch (error: any) {
      console.error('Profile creation network error:', error);
      setSignupError("Failed to connect to server. Please check if the backend is running.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        [e.target.name]: file,
      });
    }
  };

  // Handle doctor data changes
  const handleDoctorChange = (id: string, field: keyof DoctorData, value: string) => {
    setDoctors(doctors.map(doc =>
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  const handleDoctorFileChange = (id: string, field: "certificateFile" | "aadhaarFile", file: File) => {
    setDoctors(doctors.map(doc =>
      doc.id === id ? { ...doc, [field]: file } : doc
    ));
  };

  const addDoctor = () => {
    setDoctors([...doctors, {
      id: Date.now().toString(),
      name: "",
      specialization: "",
      certificateFile: null,
      aadhaarFile: null
    }]);
  };

  const removeDoctor = (id: string) => {
    if (doctors.length > 1) {
      setDoctors(doctors.filter(doc => doc.id !== id));
    }
  };

  // Handle bed type changes
  const handleBedTypeChange = (id: string, count: number) => {
    setBedTypes(bedTypes.map(bed =>
      bed.id === id ? { ...bed, count: Math.max(0, count) } : bed
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-4"
    >
      <div className="w-full h-full flex items-start justify-center pt-4 md:pt-12 overflow-y-auto scrollbar-hide">
        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onClose}
          className="fixed top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors z-50 shadow-lg"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>

        {/* Main Content */}
        <div className="w-full max-w-md flex flex-col justify-start pb-10">
          {/* Show Additional Info Form for Patient/Doctor Signup */}
          {showAdditionalInfo ? (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Title */}
                <div className="text-center">
                  <h2
                    className="text-3xl md:text-4xl mb-2 uppercase tracking-wide"
                    style={{
                      fontFamily: "'Doto', sans-serif",
                      fontWeight: "785",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Complete Your Profile
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Help us personalize your healthcare experience
                  </p>
                </div>

                {/* Additional Info Form */}
                <form onSubmit={handleAdditionalInfoSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {/* Error Message for Signup */}
                  {signupError && (
                    <div className="text-red-500 text-sm text-center py-2">
                      {signupError}
                    </div>
                  )}

                  {/* Hospital Name (Hospital Only) */}
                  {userType === "hospital" && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                        Hospital Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="hospitalName"
                          value={formData.hospitalName}
                          onChange={handleInputChange}
                          placeholder="City General Hospital"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Registration Document (Hospital Only) */}
                  {userType === "hospital" && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                        Hospital Registration Document
                      </label>
                      <div className="relative">
                        <div className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formData.registrationFile ? formData.registrationFile.name : "Upload Registration"}
                            </span>
                            <input
                              type="file"
                              name="registrationFile"
                              onChange={handleFileChange}
                              accept="image/*,.pdf"
                              className="hidden"
                              required
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Doctors List (Hospital Only) */}
                  {userType === "hospital" && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs text-gray-600 uppercase tracking-wider">
                          Doctors ({doctors.length})
                        </label>
                        <button
                          type="button"
                          onClick={addDoctor}
                          className="flex items-center gap-1 px-3 py-1 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                      <div className="space-y-3">
                        {doctors.map((doctor) => (
                          <div key={doctor.id} className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-gray-600 uppercase tracking-wide">Doctor #{doctors.indexOf(doctor) + 1}</span>
                              {doctors.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeDoctor(doctor.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={doctor.name}
                                onChange={(e) => handleDoctorChange(doctor.id, "name", e.target.value)}
                                placeholder="Doctor Name"
                                className="w-full px-3 py-2 bg-gray-50 rounded-lg outline-none text-sm"
                                required
                              />
                              <input
                                type="text"
                                value={doctor.specialization}
                                onChange={(e) => handleDoctorChange(doctor.id, "specialization", e.target.value)}
                                placeholder="Specialization (e.g., Cardiology)"
                                className="w-full px-3 py-2 bg-gray-50 rounded-lg outline-none text-sm"
                                required
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-600 truncate">
                                      {doctor.certificateFile ? doctor.certificateFile.name : "Certificate"}
                                    </span>
                                    <input
                                      type="file"
                                      onChange={(e) => e.target.files && handleDoctorFileChange(doctor.id, "certificateFile", e.target.files[0])}
                                      accept="image/*,.pdf"
                                      className="hidden"
                                      required
                                    />
                                  </label>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <IdCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-600 truncate">
                                      {doctor.aadhaarFile ? doctor.aadhaarFile.name : "Aadhaar"}
                                    </span>
                                    <input
                                      type="file"
                                      onChange={(e) => e.target.files && handleDoctorFileChange(doctor.id, "aadhaarFile", e.target.files[0])}
                                      accept="image/*,.pdf"
                                      className="hidden"
                                      required
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bed Types (Hospital Only) */}
                  {userType === "hospital" && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-2 uppercase tracking-wider">
                        Bed Capacity by Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {bedTypes.map((bed) => (
                          <div key={bed.id} className="bg-white rounded-xl p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <BedDouble className="w-4 h-4 text-gray-600" />
                              <span className="text-xs" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                                {bed.type}
                              </span>
                            </div>
                            <input
                              type="number"
                              value={bed.count}
                              onChange={(e) => handleBedTypeChange(bed.id, parseInt(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              className="w-full px-3 py-2 bg-gray-50 rounded-lg outline-none text-sm"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fields for Patient and Doctor */}
                  {userType !== "hospital" && (
                    <>
                      {/* Age & Gender Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                            Age
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="number"
                              name="age"
                              value={formData.age}
                              onChange={handleInputChange}
                              placeholder="25"
                              min="1"
                              max="150"
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                            Gender
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                              name="gender"
                              value={formData.gender}
                              onChange={handleInputChange}
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none text-sm appearance-none"
                              required
                            >
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Specialization (Doctor Only) */}
                      {userType === "doctor" && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                            Specialization
                          </label>
                          <div className="relative">
                            <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              name="specialization"
                              value={formData.specialization}
                              onChange={handleInputChange}
                              placeholder="Cardiology, Pediatrics..."
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                              required
                            />
                          </div>
                        </div>
                      )}

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                            required
                          />
                        </div>
                      </div>

                      {/* Education */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                          Education
                        </label>
                        <div className="relative">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="education"
                            value={formData.education}
                            onChange={handleInputChange}
                            placeholder={userType === "doctor" ? "MBBS, MD" : userType === "hospital" ? "Healthcare Administration" : "Bachelor's Degree"}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+1 (555) 000-0000"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                            required
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                          Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="123 Main St, City, State, ZIP"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                            required
                          />
                        </div>
                      </div>

                      {/* Blood Group (Patient Only) */}
                      {userType === "patient" && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                            Blood Group
                          </label>
                          <div className="relative">
                            <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                              name="bloodGroup"
                              value={formData.bloodGroup}
                              onChange={handleInputChange}
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none text-sm appearance-none"
                              required
                            >
                              <option value="">Select</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Certificate Upload */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                          {userType === "doctor" ? "Medical Certificate" : userType === "hospital" ? "Hospital License" : "Educational Certificate"}
                        </label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <Upload className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formData.certificateFile ? formData.certificateFile.name : "Upload Certificate"}
                              </span>
                              <input
                                type="file"
                                name="certificateFile"
                                onChange={handleFileChange}
                                accept="image/*,.pdf"
                                className="hidden"
                                required
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Aadhaar Card Upload */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                          Aadhaar Card Photo
                        </label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <IdCard className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formData.aadhaarFile ? formData.aadhaarFile.name : "Upload Aadhaar Card"}
                              </span>
                              <input
                                type="file"
                                name="aadhaarFile"
                                onChange={handleFileChange}
                                accept="image/*,.pdf"
                                className="hidden"
                                required
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Medical History (Patient Only) */}
                      {userType === "patient" && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                            Medical History (Optional)
                          </label>
                          <div className="relative">
                            <FileText className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                            <textarea
                              name="medicalHistory"
                              value={formData.medicalHistory}
                              onChange={handleInputChange}
                              placeholder="Any existing conditions, allergies, or medications..."
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none resize-none"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdditionalInfo(false)}
                      className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wide"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Back
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-black text-white py-3.5 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide shadow-lg"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Complete
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>
          ) : (
            <>
              {/* Logo/Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-6"
              >
                <h1
                  className="text-4xl md:text-5xl mb-2 uppercase tracking-wide"
                  style={{
                    fontFamily: "'Doto', sans-serif",
                    fontWeight: "785",
                    letterSpacing: "0.05em",
                  }}
                >
                  HEALTH SYNC
                </h1>
                <p className="text-gray-500 text-xs tracking-widest uppercase">
                  Healthcare Reimagined
                </p>
              </motion.div>

              {/* Tab Switcher */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-2 mb-6 bg-gray-100 rounded-2xl p-1.5"
              >
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-xl transition-all uppercase text-sm tracking-wide ${isLogin
                    ? "bg-black text-white shadow-lg"
                    : "bg-transparent text-gray-600 hover:text-black"
                    }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-xl transition-all uppercase text-sm tracking-wide ${!isLogin
                    ? "bg-black text-white shadow-lg"
                    : "bg-transparent text-gray-600 hover:text-black"
                    }`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  Sign Up
                </button>
              </motion.div>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={isLogin ? "login" : "signup"}
                  initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* Name Field (Sign Up Only) */}
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                          required={!isLogin}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* User Type Selector (Sign Up Only) */}
                  {!isLogin && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-2 uppercase tracking-wider">
                        I am a
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setUserType("patient")}
                          className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${userType === "patient"
                            ? "bg-black text-white border-black"
                            : "bg-gray-50 text-gray-600 border-transparent hover:border-gray-200"
                            }`}
                        >
                          <UserCircle className="w-5 h-5" />
                          <span className="text-xs uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                            Patient
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserType("doctor")}
                          className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${userType === "doctor"
                            ? "bg-black text-white border-black"
                            : "bg-gray-50 text-gray-600 border-transparent hover:border-gray-200"
                            }`}
                        >
                          <Stethoscope className="w-5 h-5" />
                          <span className="text-xs uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                            Doctor
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserType("hospital")}
                          className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${userType === "hospital"
                            ? "bg-black text-white border-black"
                            : "bg-gray-50 text-gray-600 border-transparent hover:border-gray-200"
                            }`}
                        >
                          <Building2 className="w-5 h-5" />
                          <span className="text-xs uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                            Hospital
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message for Login */}
                  {isLogin && loginError && (
                    <div className="text-red-500 text-sm text-center py-2">
                      {loginError}
                    </div>
                  )}

                  {/* Forgot Password (Login Only) */}
                  {isLogin && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs text-gray-600 hover:text-black transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-black text-white py-3.5 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide shadow-lg mt-6"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    {isLogin ? "Login" : (userType === "patient" ? "Continue" : "Create Account")}
                  </motion.button>

                  {/* Terms (Sign Up Only) */}
                  {!isLogin && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xs text-center text-gray-500 mt-3"
                    >
                      By signing up, you agree to our{" "}
                      <button type="button" className="text-black hover:underline">
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button type="button" className="text-black hover:underline">
                        Privacy Policy
                      </button>
                    </motion.p>
                  )}

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-4 bg-white text-gray-500 uppercase tracking-wider">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Social Login Button - Google Only */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-sm">Continue with Google</span>
                  </motion.button>
                </motion.form>
              </AnimatePresence>

              {/* Additional Info Form */}
              {showAdditionalInfo ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Title */}
                    <div className="text-center">
                      <h2
                        className="text-3xl md:text-4xl mb-2 uppercase tracking-wide"
                        style={{
                          fontFamily: "'Doto', sans-serif",
                          fontWeight: "785",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Complete Your Profile
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Help us personalize your healthcare experience
                      </p>
                    </div>

                    {/* Additional Info Form */}
                    <form onSubmit={handleAdditionalInfoSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                      {/* Error Message for Signup */}
                      {signupError && (
                        <div className="text-red-500 text-sm text-center py-2">
                          {signupError}
                        </div>
                      )}

                      {/* Hospital Name (Hospital Only) */}
                      {userType === "hospital" && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                            Hospital Name
                          </label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              name="hospitalName"
                              value={formData.hospitalName}
                              onChange={handleInputChange}
                              placeholder="City General Hospital"
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                              required
                            />
                          </div>
                        </div>
                      )}

                      {/* Registration Document (Hospital Only) */}
                      {userType === "hospital" && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                            Hospital Registration Document
                          </label>
                          <div className="relative">
                            <div className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {formData.registrationFile ? formData.registrationFile.name : "Upload Registration"}
                                </span>
                                <input
                                  type="file"
                                  name="registrationFile"
                                  onChange={handleFileChange}
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  required
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Doctors List (Hospital Only) */}
                      {userType === "hospital" && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs text-gray-600 uppercase tracking-wider">
                              Doctors ({doctors.length})
                            </label>
                            <button
                              type="button"
                              onClick={addDoctor}
                              className="flex items-center gap-1 px-3 py-1 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          </div>
                          <div className="space-y-3">
                            {doctors.map((doctor) => (
                              <div key={doctor.id} className="bg-white rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs text-gray-600 uppercase tracking-wide">Doctor #{doctors.indexOf(doctor) + 1}</span>
                                  {doctors.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeDoctor(doctor.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={doctor.name}
                                    onChange={(e) => handleDoctorChange(doctor.id, "name", e.target.value)}
                                    placeholder="Doctor Name"
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg outline-none text-sm"
                                    required
                                  />
                                  <input
                                    type="text"
                                    value={doctor.specialization}
                                    onChange={(e) => handleDoctorChange(doctor.id, "specialization", e.target.value)}
                                    placeholder="Specialization (e.g., Cardiology)"
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg outline-none text-sm"
                                    required
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gray-50 rounded-lg p-2">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-xs text-gray-600 truncate">
                                          {doctor.certificateFile ? doctor.certificateFile.name : "Certificate"}
                                        </span>
                                        <input
                                          type="file"
                                          onChange={(e) => e.target.files && handleDoctorFileChange(doctor.id, "certificateFile", e.target.files[0])}
                                          accept="image/*,.pdf"
                                          className="hidden"
                                          required
                                        />
                                      </label>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <IdCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-xs text-gray-600 truncate">
                                          {doctor.aadhaarFile ? doctor.aadhaarFile.name : "Aadhaar"}
                                        </span>
                                        <input
                                          type="file"
                                          onChange={(e) => e.target.files && handleDoctorFileChange(doctor.id, "aadhaarFile", e.target.files[0])}
                                          accept="image/*,.pdf"
                                          className="hidden"
                                          required
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bed Types (Hospital Only) */}
                      {userType === "hospital" && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-2 uppercase tracking-wider">
                            Bed Capacity by Type
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {bedTypes.map((bed) => (
                              <div key={bed.id} className="bg-white rounded-xl p-3 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <BedDouble className="w-4 h-4 text-gray-600" />
                                  <span className="text-xs" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                                    {bed.type}
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  value={bed.count}
                                  onChange={(e) => handleBedTypeChange(bed.id, parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  min="0"
                                  className="w-full px-3 py-2 bg-gray-50 rounded-lg outline-none text-sm"
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fields for Patient and Doctor */}
                      {userType !== "hospital" && (
                        <>
                          {/* Age & Gender Row */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                                Age
                              </label>
                              <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="number"
                                  name="age"
                                  value={formData.age}
                                  onChange={handleInputChange}
                                  placeholder="25"
                                  min="1"
                                  max="150"
                                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                                Gender
                              </label>
                              <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                  name="gender"
                                  value={formData.gender}
                                  onChange={handleInputChange}
                                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none text-sm appearance-none"
                                  required
                                >
                                  <option value="">Select</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Date of Birth */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                              Date of Birth
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleInputChange}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                                required
                              />
                            </div>
                          </div>

                          {/* Education */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                              Education
                            </label>
                            <div className="relative">
                              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                name="education"
                                value={formData.education}
                                onChange={handleInputChange}
                                placeholder={userType === "doctor" ? "MBBS, MD" : userType === "hospital" ? "Healthcare Administration" : "Bachelor's Degree"}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                                required
                              />
                            </div>
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                              Phone Number
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+1 (555) 000-0000"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                                required
                              />
                            </div>
                          </div>

                          {/* Address */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                              Address
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="123 Main St, City, State, ZIP"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none"
                                required
                              />
                            </div>
                          </div>

                          {/* Blood Group (Patient Only) */}
                          {userType === "patient" && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                                Blood Group
                              </label>
                              <div className="relative">
                                <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                  name="bloodGroup"
                                  value={formData.bloodGroup}
                                  onChange={handleInputChange}
                                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none text-sm appearance-none"
                                  required
                                >
                                  <option value="">Select</option>
                                  <option value="A+">A+</option>
                                  <option value="A-">A-</option>
                                  <option value="B+">B+</option>
                                  <option value="B-">B-</option>
                                  <option value="AB+">AB+</option>
                                  <option value="AB-">AB-</option>
                                  <option value="O+">O+</option>
                                  <option value="O-">O-</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Certificate Upload */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                              {userType === "doctor" ? "Medical Certificate" : userType === "hospital" ? "Hospital License" : "Educational Certificate"}
                            </label>
                            <div className="relative">
                              <div className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <Upload className="w-5 h-5 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {formData.certificateFile ? formData.certificateFile.name : "Upload Certificate"}
                                  </span>
                                  <input
                                    type="file"
                                    name="certificateFile"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    required
                                  />
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Aadhaar Card Upload */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                              Aadhaar Card Photo
                            </label>
                            <div className="relative">
                              <div className="w-full px-4 py-3 bg-gray-50 rounded-xl transition-all outline-none">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <IdCard className="w-5 h-5 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {formData.aadhaarFile ? formData.aadhaarFile.name : "Upload Aadhaar Card"}
                                  </span>
                                  <input
                                    type="file"
                                    name="aadhaarFile"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    required
                                  />
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Medical History (Patient Only) */}
                          {userType === "patient" && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-wider">
                                Medical History (Optional)
                              </label>
                              <div className="relative">
                                <FileText className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <textarea
                                  name="medicalHistory"
                                  value={formData.medicalHistory}
                                  onChange={handleInputChange}
                                  placeholder="Any existing conditions, allergies, or medications..."
                                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl transition-all outline-none resize-none"
                                  rows={3}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAdditionalInfo(false)}
                          className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wide"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          Back
                        </button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-black text-white py-3.5 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide shadow-lg"
                          style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                        >
                          Complete
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                </AnimatePresence>
              ) : null}

            </>
          )}
        </div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: [1, 1.1, 1],
            y: [0, -20, 0]
          }}
          transition={{
            delay: 0.5,
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full opacity-30 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: [1, 1.15, 1],
            y: [0, 20, 0]
          }}
          transition={{
            delay: 0.6,
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full opacity-30 blur-3xl"
        />
      </div>
    </motion.div>
  );
}