import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getHospitalAnalytics, type HospitalAnalytics } from '../services/analytics';
import { type DoctorSlot } from '../services/api';
import { Clock, Users, TrendingUp, Activity, Power, User } from 'lucide-react';

interface OpdQueueEntry {
    id: string;
    patientName: string;
    status: string;
    priority?: string;
}

interface OpdDashboardProps {
    opdQueue: OpdQueueEntry[];
    doctorSlots: DoctorSlot[];
    refreshKey?: number;
    onToggleDoctorActive: (slotId: string) => void;
}

export const OpdDashboard: React.FC<OpdDashboardProps> = ({ opdQueue, doctorSlots, refreshKey = 0, onToggleDoctorActive }) => {
    const [analytics, setAnalytics] = useState<HospitalAnalytics | null>(null);
    // doctorSlots is now a prop

    useEffect(() => {
        const fetchData = async () => {
            // Skip API calls when offline - analytics requires backend connectivity
            if (!navigator.onLine) {
                console.log('[OpdDashboard] Skipped analytics fetch - offline mode');
                return;
            }

            try {
                // Only fetch analytics, slots come from parent
                const analyticsData = await getHospitalAnalytics();
                setAnalytics(analyticsData);
            } catch (error) {
                // Only log errors if we're actually online
                if (navigator.onLine) {
                    console.error('Failed to fetch analytics:', error);
                }
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [refreshKey]);

    const handleToggleDoctorActive = (slotId: string) => {
        onToggleDoctorActive(slotId);
    };

    const waitingCount = opdQueue.filter(e => e.status === 'checked-in' || e.status === 'in-triage').length;
    const inConsultCount = opdQueue.filter(e => e.status === 'in-consult').length;
    const completedCount = opdQueue.filter(e => e.status === 'completed').length;

    const statusData = [
        { name: 'Waiting', value: waitingCount, color: '#3b82f6' },
        { name: 'Consult', value: inConsultCount, color: '#22c55e' },
        { name: 'Done', value: completedCount, color: '#9ca3af' }
    ].filter(d => d.value > 0);



    const getStatusDot = (status: string) => {
        switch (status) {
            case 'Free': return 'bg-green-500';
            case 'Busy': return 'bg-yellow-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold">{waitingCount}</p>
                            <p className="text-blue-100 text-xs font-medium uppercase">Waiting</p>
                        </div>
                        <Clock className="w-6 h-6 text-white/60" />
                    </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold">{analytics?.doctorAvailability?.free || 0}</p>
                            <p className="text-green-100 text-xs font-medium uppercase">Free Doctors</p>
                        </div>
                        <Users className="w-6 h-6 text-white/60" />
                    </div>
                </div>
            </div>

            {/* Compact Charts Row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Queue Trend Chart */}
                <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-semibold text-gray-700">Queue Trend</span>
                    </div>
                    <div className="h-20">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.queueTrend || [{ time: 'Now', queueLength: waitingCount }]}>
                                <defs>
                                    <linearGradient id="queueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="queueLength" stroke="#8b5cf6" strokeWidth={2} fill="url(#queueGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Overview */}
                <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-gray-700">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-14 h-14 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData.length > 0 ? statusData : [{ value: 1, color: '#e5e7eb' }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={16}
                                        outerRadius={24}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {(statusData.length > 0 ? statusData : [{ value: 1, color: '#e5e7eb' }]).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold">{waitingCount + inConsultCount}</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-1 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                <span className="text-gray-600">Wait</span>
                                <span className="font-bold ml-auto">{waitingCount}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                <span className="text-gray-600">Consult</span>
                                <span className="font-bold ml-auto">{inConsultCount}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                <span className="text-gray-600">Done</span>
                                <span className="font-bold ml-auto">{completedCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Doctor Status List */}
            <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">On-Duty Doctors</h4>
                    <span className="text-[10px] text-gray-400">{doctorSlots.length} total</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {doctorSlots.length === 0 ? (
                        <div className="col-span-2 text-center py-4 text-xs text-gray-400">
                            No doctors available today
                        </div>
                    ) : (
                        doctorSlots.map(doctor => (
                            <div
                                key={doctor.id}
                                className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-100/50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full bg-indigo-50 flex-shrink-0 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 truncate">{doctor.doctorName}</p>
                                    <p className="text-[9px] text-gray-500 truncate">{doctor.department}</p>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${getStatusDot(doctor.status || 'Off Duty')}`} title={doctor.status || 'Off Duty'}></div>
                                    <button
                                        onClick={() => handleToggleDoctorActive(doctor.id)}
                                        className={`p-1 rounded-md transition-colors ${doctor.isActive
                                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                            }`}
                                        title={doctor.isActive ? 'Go Off Duty' : 'Go On Duty'}
                                    >
                                        <Power className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
