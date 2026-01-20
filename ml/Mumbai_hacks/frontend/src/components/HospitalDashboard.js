'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, AlertCircle, TrendingUp, Loader, ArrowLeft, RefreshCw, Zap } from 'lucide-react'
import axios from 'axios'
import { estimateCityFromCoordinates } from '@/utils/locationUtils'

export default function HospitalDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchHospitalData()
  }, [])

  const fetchHospitalData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            const estimatedCity = estimateCityFromCoordinates(latitude, longitude)

            const response = await axios.get(`${API_BASE_URL}/predict/${estimatedCity}`)
            setData(response.data)
            setLoading(false)
          },
          (err) => {
            setError('Unable to access location. Please enable location services.')
            setLoading(false)
          }
        )
      } else {
        setError('Geolocation not supported by your browser')
        setLoading(false)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch prediction data')
      setLoading(false)
    }
  }

  const getAlertColor = (aqi) => {
    if (aqi <= 50) return 'from-green-400 to-green-600'
    if (aqi <= 100) return 'from-yellow-400 to-yellow-600'
    if (aqi <= 150) return 'from-orange-400 to-orange-600'
    if (aqi <= 200) return 'from-red-400 to-red-600'
    if (aqi <= 300) return 'from-purple-400 to-purple-600'
    return 'from-red-600 to-red-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors">
            <ArrowLeft size={20} />
            Back
          </Link>
          <button
            onClick={fetchHospitalData}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3">
          <Building2 className="text-orange-400" size={40} />
          Hospital Operations Dashboard
        </h1>
        <p className="text-gray-300 text-lg">Resource management and capacity planning</p>
      </div>

      {loading ? (
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader size={48} className="animate-spin text-orange-400 mb-4" />
          <p className="text-xl text-gray-300">Detecting your location and fetching operational data...</p>
        </div>
      ) : error ? (
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
              <p className="text-gray-300">{error}</p>
              <button
                onClick={fetchHospitalData}
                className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : data ? (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
              <p className="text-gray-400 text-sm mb-2">City</p>
              <p className="text-2xl font-bold text-orange-300">{data.city}</p>
            </div>

            <div className={`bg-gradient-to-br ${getAlertColor(data.aqi)} bg-opacity-20 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20`}>
              <p className="text-gray-400 text-sm mb-2">Air Quality</p>
              <p className="text-2xl font-bold text-white">{Math.round(data.aqi)}</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
              <p className="text-gray-400 text-sm mb-2">Expected Patients</p>
              <p className="text-2xl font-bold text-blue-300">{data.expected_patients_next_24h}</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
              <p className="text-gray-400 text-sm mb-2">Surge Risk</p>
              <p className="text-2xl font-bold text-red-300">{Math.round(data.surge_probability)}%</p>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <AlertCircle className="text-yellow-400" size={28} />
              Operational Alert
            </h2>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 bg-opacity-20 rounded-xl p-6 border border-orange-400 border-opacity-30">
              <p className="text-lg leading-relaxed text-gray-100">
                {data.hospital_dashboard}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="text-yellow-400" size={24} />
                Recommended Actions
              </h3>
              <div className="space-y-4">
                <div className="bg-yellow-500 bg-opacity-10 rounded-lg p-4 border border-yellow-400 border-opacity-30">
                  <p className="text-gray-400 text-sm mb-1">Oxygen Cylinder Increase</p>
                  <p className="text-3xl font-bold text-yellow-300">{data.recommended_actions.oxygen_cylinder_increase_percent}%</p>
                </div>
                <div className="bg-red-500 bg-opacity-10 rounded-lg p-4 border border-red-400 border-opacity-30">
                  <p className="text-gray-400 text-sm mb-1">Emergency Beds to Open</p>
                  <p className="text-3xl font-bold text-red-300">{data.recommended_actions.emergency_beds_to_open}</p>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
              <h3 className="text-xl font-bold mb-4">Alert Status</h3>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-4 rounded-lg ${data.recommended_actions.staff_alert_required ? 'bg-red-500 bg-opacity-10 border border-red-400 border-opacity-30' : 'bg-green-500 bg-opacity-10 border border-green-400 border-opacity-30'}`}>
                  <span className="font-semibold">Staff Alert Required</span>
                  <span className={data.recommended_actions.staff_alert_required ? 'text-red-300 text-xl' : 'text-green-300 text-xl'}>
                    {data.recommended_actions.staff_alert_required ? '⚠️ YES' : '✓ NO'}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-4 rounded-lg ${data.recommended_actions.mask_advisory ? 'bg-orange-500 bg-opacity-10 border border-orange-400 border-opacity-30' : 'bg-green-500 bg-opacity-10 border border-green-400 border-opacity-30'}`}>
                  <span className="font-semibold">Mask Advisory</span>
                  <span className={data.recommended_actions.mask_advisory ? 'text-orange-300 text-xl' : 'text-green-300 text-xl'}>
                    {data.recommended_actions.mask_advisory ? '😷 YES' : '✓ NO'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
            <h3 className="text-xl font-bold mb-4">Environmental Data</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-500 bg-opacity-10 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">PM2.5 Level</p>
                <p className="text-2xl font-bold text-blue-300">{data.pm25.toFixed(2)} µg/m³</p>
              </div>
              <div className="bg-purple-500 bg-opacity-10 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Air Quality Index</p>
                <p className="text-2xl font-bold text-purple-300">{Math.round(data.aqi)}</p>
              </div>
              <div className="bg-green-500 bg-opacity-10 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">State</p>
                <p className="text-2xl font-bold text-green-300">{data.state}</p>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-400 text-sm">
            <p>Last updated: {new Date(data.timestamp).toLocaleString()}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
