import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHospitalAnalytics, type HospitalAnalytics } from '../services/analytics';
import { Activity, Users, TrendingUp, Clock } from 'lucide-react';

const COLORS = {
    free: '#10b981',
    occupied: '#f59e0b',
    offline: '#6b7280',
    emergency: '#ef4444'
};

export const AnalyticsTab: React.FC = () => {
    const [analytics, setAnalytics] = useState<HospitalAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const data = await getHospitalAnalytics();
                setAnalytics(data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30s

        return () => clearInterval(interval);
    }, []);

    if (loading || !analytics) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    // Prepare data for pie chart
    const availabilityData = [
        { name: 'Free', value: analytics.doctorAvailability.free, color: COLORS.free },
        { name: 'Occupied', value: analytics.doctorAvailability.occupied, color: COLORS.occupied },
        { name: 'Offline', value: analytics.doctorAvailability.offline, color: COLORS.offline }
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Free Doctors</p>
                            <p className="text-3xl font-bold text-green-700">{analytics.doctorAvailability.free}</p>
                        </div>
                        <Users className="w-10 h-10 text-green-500 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Occupied</p>
                            <p className="text-3xl font-bold text-amber-700">{analytics.doctorAvailability.occupied}</p>
                        </div>
                        <Activity className="w-10 h-10 text-amber-500 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Offline</p>
                            <p className="text-3xl font-bold text-gray-700">{analytics.doctorAvailability.offline}</p>
                        </div>
                        <Clock className="w-10 h-10 text-gray-500 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total Doctors</p>
                            <p className="text-3xl font-bold text-blue-700">{analytics.doctorAvailability.total}</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-blue-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Doctor Availability Pie Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Doctor Availability
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={availabilityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {availabilityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Department Workload Bar Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Department Workload
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.departmentWorkload}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="free" stackId="a" fill={COLORS.free} name="Free Doctors" />
                            <Bar dataKey="occupied" stackId="a" fill={COLORS.occupied} name="Occupied Doctors" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Doctors Ranking */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Top Doctors by Workload
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.topDoctors} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="activePatients" fill="#3b82f6" name="Active Patients" />
                            <Bar dataKey="inConsult" fill="#f59e0b" name="In Consultation" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Queue Trend Line Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        Queue Trend (Last 6 Hours)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.queueTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="queueLength" stroke="#8b5cf6" strokeWidth={2} name="Queue Length" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="text-center text-sm text-gray-500">
                <Clock className="w-4 h-4 inline mr-1" />
                Auto-refreshing every 30 seconds
            </div>
        </div>
    );
};
