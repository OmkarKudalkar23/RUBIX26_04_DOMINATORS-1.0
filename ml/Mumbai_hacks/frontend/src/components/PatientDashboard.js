'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, AlertCircle, Heart, Loader, ArrowLeft, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { estimateCityFromCoordinates } from '@/utils/locationUtils'

export default function PatientDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchPatientData()
  }, [])

  const fetchPatientData = async () => {
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

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'from-green-400 to-green-600'
    if (aqi <= 100) return 'from-yellow-400 to-yellow-600'
    if (aqi <= 150) return 'from-orange-400 to-orange-600'
    if (aqi <= 200) return 'from-red-400 to-red-600'
    if (aqi <= 300) return 'from-purple-400 to-purple-600'
    return 'from-red-600 to-red-800'
  }

  const getAQILabel = (aqi) => {
    if (aqi <= 50) return 'Good'
    if (aqi <= 100) return 'Moderate'
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
    if (aqi <= 200) return 'Unhealthy'
    if (aqi <= 300) return 'Very Unhealthy'
    return 'Hazardous'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            <ArrowLeft size={20} />
            Back
          </Link>
          <button
            onClick={fetchPatientData}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3">
          <Heart className="text-red-500" size={40} />
          Patient Health Dashboard
        </h1>
        <p className="text-gray-300 text-lg">Your personalized air quality and health recommendations</p>
      </div>

      {loading ? (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader size={48} className="animate-spin text-blue-400 mb-4" />
          <p className="text-xl text-gray-300">Detecting your location and fetching data...</p>
        </div>
      ) : error ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
              <p className="text-gray-300">{error}</p>
              <button
                onClick={fetchPatientData}
                className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : data ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="text-blue-400" size={28} />
              <h2 className="text-2xl font-bold">Your Location</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">City</p>
                <p className="text-3xl font-bold text-blue-300">{data.city}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">State</p>
                <p className="text-3xl font-bold text-blue-300">{data.state}</p>
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-br ${getAQIColor(data.aqi)} bg-opacity-20 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Air Quality Index</h2>
              <div className={`bg-gradient-to-br ${getAQIColor(data.aqi)} p-4 rounded-xl`}>
                <p className="text-4xl font-bold text-white">{Math.round(data.aqi)}</p>
              </div>
            </div>
            <p className="text-lg text-gray-200 mb-4">
              <span className="font-semibold">{getAQILabel(data.aqi)}</span>
            </p>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <p className="text-gray-300">PM2.5: <span className="font-bold text-white">{data.pm25.toFixed(2)} µg/m³</span></p>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <AlertCircle className="text-yellow-400" size={28} />
              Your Health Recommendations
            </h2>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-opacity-20 rounded-xl p-6 border border-blue-400 border-opacity-30">
              <p className="text-lg leading-relaxed text-gray-100">
                {data.patient_dashboard}
              </p>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="bg-green-500 bg-opacity-20 rounded-lg p-4 border border-green-400 border-opacity-30">
                <p className="text-sm text-gray-400 mb-1">Recommended Action</p>
                <p className="text-lg font-bold text-green-300">
                  {data.recommended_actions.mask_advisory ? '✓ Wear a mask when outdoors' : '✓ No mask required'}
                </p>
              </div>
              <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 border border-blue-400 border-opacity-30">
                <p className="text-sm text-gray-400 mb-1">Air Quality Status</p>
                <p className="text-lg font-bold text-blue-300">{getAQILabel(data.aqi)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
            <h2 className="text-2xl font-bold mb-6">Health Tips</h2>
            <div className="space-y-3">
              {data.aqi > 150 && (
                <div className="flex items-start gap-3 bg-orange-500 bg-opacity-10 rounded-lg p-4">
                  <span className="text-2xl">🏥</span>
                  <p className="text-gray-200">If you have respiratory conditions, consult your doctor before going out</p>
                </div>
              )}
              {data.aqi > 100 && (
                <div className="flex items-start gap-3 bg-yellow-500 bg-opacity-10 rounded-lg p-4">
                  <span className="text-2xl">😷</span>
                  <p className="text-gray-200">Use N95 or KN95 masks when outdoors for better protection</p>
                </div>
              )}
              <div className="flex items-start gap-3 bg-blue-500 bg-opacity-10 rounded-lg p-4">
                <span className="text-2xl">💧</span>
                <p className="text-gray-200">Stay hydrated and drink plenty of water throughout the day</p>
              </div>
              <div className="flex items-start gap-3 bg-green-500 bg-opacity-10 rounded-lg p-4">
                <span className="text-2xl">🏃</span>
                <p className="text-gray-200">Limit outdoor activities, especially for children and elderly</p>
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
