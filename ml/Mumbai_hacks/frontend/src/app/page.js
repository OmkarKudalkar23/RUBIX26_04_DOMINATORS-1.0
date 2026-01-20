'use client'

import Link from 'next/link'
import { Activity, Stethoscope, Building2, ArrowRight } from 'lucide-react'

export default function Home() {
  const dashboards = [
    {
      title: 'Patient Dashboard',
      description: 'Check air quality and health recommendations for your location',
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
      href: '/patient',
    },
    {
      title: 'Doctor Dashboard',
      description: 'Monitor patient surge predictions and clinical alerts',
      icon: Stethoscope,
      color: 'from-green-500 to-emerald-500',
      href: '/doctor',
    },
    {
      title: 'Hospital Dashboard',
      description: 'Manage resources and prepare for patient influx',
      icon: Building2,
      color: 'from-orange-500 to-red-500',
      href: '/hospital',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="pt-20 pb-10 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Healthcare Risk & Resource Prediction
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Real-time air quality monitoring and healthcare resource management powered by AI
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {dashboards.map((dashboard, index) => {
            const Icon = dashboard.icon
            return (
              <Link key={index} href={dashboard.href}>
                <div className="group cursor-pointer h-full">
                  <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transform hover:scale-105 transition-all duration-300 border border-white border-opacity-20 hover:border-opacity-40 h-full">
                    <div className={`bg-gradient-to-br ${dashboard.color} p-4 rounded-xl w-fit mb-6 group-hover:shadow-2xl transition-all`}>
                      <Icon size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">{dashboard.title}</h2>
                    <p className="text-gray-300 mb-6">{dashboard.description}</p>
                    <div className="flex items-center text-blue-400 group-hover:text-blue-300 font-semibold">
                      <span>Access Dashboard</span>
                      <ArrowRight size={20} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-10">
            <h3 className="text-xl font-bold mb-3 text-blue-400">📍 Real-time Location Detection</h3>
            <p className="text-gray-300">Automatically detects your location and provides city-specific predictions</p>
          </div>
          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-10">
            <h3 className="text-xl font-bold mb-3 text-green-400">🔍 Accurate City Estimation</h3>
            <p className="text-gray-300">Uses coordinates to identify your city and fetch relevant data</p>
          </div>
          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-10">
            <h3 className="text-xl font-bold mb-3 text-purple-400">📊 Real-time Predictions</h3>
            <p className="text-gray-300">Get instant predictions for patient surge and resource requirements</p>
          </div>
          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-10">
            <h3 className="text-xl font-bold mb-3 text-orange-400">🎯 Role-specific Insights</h3>
            <p className="text-gray-300">Tailored information for patients, doctors, and hospital administrators</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-400 border-t border-white border-opacity-10">
        <p>© 2025 Healthcare Risk & Resource Prediction System. All rights reserved.</p>
      </div>
    </div>
  )
}
