import { useState } from 'react';
import { authApi, profilesApi, User, PatientProfile, DoctorProfile, HospitalProfile } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null as User | null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null as string | null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      return response;
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.signup(name, email, password, role);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      return response;
    } catch (err) {
      setError('Signup failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createPatientProfile = async (profile: PatientProfile) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await profilesApi.createPatientProfile(profile);
      return response;
    } catch (err) {
      setError('Failed to create patient profile.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createDoctorProfile = async (profile: DoctorProfile) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await profilesApi.createDoctorProfile(profile);
      return response;
    } catch (err) {
      setError('Failed to create doctor profile.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createHospitalProfile = async (profile: HospitalProfile) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await profilesApi.createHospitalProfile(profile);
      return response;
    } catch (err) {
      setError('Failed to create hospital profile.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    createPatientProfile,
    createDoctorProfile,
    createHospitalProfile,
    logout,
  };
};