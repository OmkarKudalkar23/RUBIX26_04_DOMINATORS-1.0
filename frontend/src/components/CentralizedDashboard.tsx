import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
    getCentralizedHospitalCapacity,
    type CentralizedHospitalData,
    type CentralizedCapacityResponse,
} from "../services/centralizedApi";
import {
    Bed,
    Users,
    Hospital,
    Calendar,
    Search,
    LogOut,
    Menu,
    X,
    Bell,
    MapPin,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { BedRequestModal } from "./BedRequestModal";
import {
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

interface CentralizedDashboardProps {
    onLogout: () => void;
}

export const CentralizedDashboard: React.FC<CentralizedDashboardProps> = ({
    onLogout,
}) => {
    const [capacityData, setCapacityData] = useState<CentralizedCapacityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<"all" | "high" | "medium" | "low">("all");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState<CentralizedHospitalData | null>(null);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [selectedBedType, setSelectedBedType] = useState<string>("General");

    const handleBedClick = (e: React.MouseEvent, type: string) => {
        e.stopPropagation();
        setSelectedBedType(type);
        setRequestModalOpen(true);
    };

    // Fetch data
    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getCentralizedHospitalCapacity();
            setCapacityData(data);
            toast.success("Data refreshed successfully");
        } catch (error) {
            console.error("Error fetching centralized data:", error);
            toast.error("Failed to fetch hospital data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Calculate occupancy rate
    const getOccupancyRate = (hospital: CentralizedHospitalData) => {
        if (hospital.bedSummary.totalBeds === 0) return 0;
        return (hospital.bedSummary.occupiedBeds / hospital.bedSummary.totalBeds) * 100;
    };

    // Get occupancy status
    const getOccupancyStatus = (rate: number): "high" | "medium" | "low" => {
        if (rate >= 80) return "high";
        if (rate >= 50) return "medium";
        return "low";
    };

    // Filter hospitals
    const filteredHospitals = capacityData?.hospitals.filter((hospital) => {
        const matchesSearch =
            hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hospital.address.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterType === "all") return matchesSearch;

        const occupancyRate = getOccupancyRate(hospital);
        const status = getOccupancyStatus(occupancyRate);
        return matchesSearch && status === filterType;
    });

    const occupancyData = capacityData?.hospitals.map((hospital) => ({
        name: hospital.name.substring(0, 15) + "...",
        occupancy: getOccupancyRate(hospital),
        available: hospital.bedSummary.availableBeds,
        totalBeds: hospital.bedSummary.totalBeds,
        occupiedBeds: hospital.bedSummary.occupiedBeds,
    }));

    const opdData = capacityData?.hospitals.map((hospital) => ({
        name: hospital.name.substring(0, 12) + "...",
        today: hospital.opdLoad.today.total,
        last7Days: hospital.opdLoad.last7Days?.total || 0,
    }));

    if (loading && !capacityData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-xl font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <h1 className="text-xl font-medium tracking-tight text-gray-800 uppercase">
                            City General Hospital
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500 hidden md:block">
                            Real-time capacity monitoring across all hospitals
                        </div>
                        <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
                        <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Beds - Purple Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-40 shadow-sm"
                        style={{ backgroundColor: '#F3E8FF' }}
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-white/60 rounded-xl backdrop-blur-sm">
                                <Bed className="text-purple-600" size={24} />
                            </div>
                            <span className="text-4xl font-light text-slate-800 tracking-tighter">
                                {capacityData?.citySummary.totalBeds.toLocaleString() || 779}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Beds</h3>
                            <p className="text-sm text-gray-600">
                                {capacityData?.citySummary.availableBeds || 208} available
                            </p>
                        </div>
                    </motion.div>

                    {/* OPD Today - White Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-40"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <Calendar className="text-gray-600" size={24} />
                            </div>
                            <span className="text-4xl font-light text-slate-800 tracking-tighter">
                                {capacityData?.citySummary.todayAppointments.toLocaleString() || 0}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">OPD Today</h3>
                            <p className="text-sm text-gray-500">
                                Last 7 days: {capacityData?.citySummary.last7DaysAppointments || 30}
                            </p>
                        </div>
                    </motion.div>

                    {/* Admissions Today - White Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-40"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <Users className="text-gray-600" size={24} />
                            </div>
                            <span className="text-4xl font-light text-slate-800 tracking-tighter">
                                {capacityData?.citySummary.todayAdmissions || 0}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Admissions Today</h3>
                            <p className="text-sm text-gray-500">
                                {capacityData?.citySummary.pendingAdmissions || 4} pending
                            </p>
                        </div>
                    </motion.div>

                    {/* Active Hospitals - White Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-40"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <Hospital className="text-gray-600" size={24} />
                            </div>
                            <span className="text-4xl font-light text-slate-800 tracking-tighter">
                                {capacityData?.hospitals.length || 9}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Hospitals</h3>
                            <p className="text-sm text-gray-500">
                                {((capacityData?.citySummary.occupiedBeds || 0) / (capacityData?.citySummary.totalBeds || 1) * 100).toFixed(1)}% Occupancy
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Hospital Occupancy Rates */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-800 mb-6 font-mono">Hospital Occupancy Rates</h3>
                        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                            {occupancyData && occupancyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={occupancyData} barSize={40}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                color: '#1f2937',
                                                fontFamily: 'monospace',
                                                fontSize: '12px'
                                            }}
                                            formatter={(value: any, name: any, props: any) => {
                                                if (name === 'occupancy') {
                                                    const { totalBeds, occupiedBeds } = props.payload;
                                                    return [`${Number(value).toFixed(1)}% (${occupiedBeds}/${totalBeds} Beds)`, 'Occupancy'];
                                                }
                                                return [value, name];
                                            }}
                                        />
                                        <Bar dataKey="occupancy" fill="#8b5cf6" radius={[6, 6, 6, 6]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    No occupancy data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* OPD Patient Load */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-800 mb-6 font-mono">OPD Patient Load</h3>
                        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                            {opdData && opdData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={opdData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                color: '#1f2937',
                                                fontFamily: 'monospace',
                                                fontSize: '12px'
                                            }}
                                            formatter={(value: number) => [value.toLocaleString(), undefined]}
                                            labelFormatter={(label) => <span className="font-bold text-gray-500 mb-2 block">{label}</span>}
                                        />
                                        <Legend
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: '20px', fontFamily: 'monospace', fontSize: '12px' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="today"
                                            name="today"
                                            stroke="#ec4899"
                                            strokeWidth={2}
                                            dot={{ fill: '#fff', stroke: '#ec4899', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, fill: '#ec4899' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="last7Days"
                                            name="last7Days"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            dot={{ fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, fill: '#8b5cf6' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    No OPD data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hospital Details Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6 mt-4">
                        <h2 className="text-xl font-medium text-gray-800 font-mono uppercase tracking-wide">Hospital Details</h2>

                        {/* Search and Filters */}
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search hospitals..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 hover:bg-white hover:border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-50/50 w-64 transition-all shadow-sm"
                                />
                            </div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="px-4 py-2.5 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-50/50 text-gray-600 cursor-pointer transition-all shadow-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="high">High Load</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low Load</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredHospitals?.map((hospital, index) => {
                            const occupancyRate = getOccupancyRate(hospital);
                            const allBeds = hospital.bedSummary.byType.reduce((acc, curr) => {
                                if (curr.beds) return [...acc, ...curr.beds];
                                return acc;
                            }, [] as any[]);

                            return (
                                <motion.div
                                    key={hospital.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedHospital(hospital)}
                                    className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group mb-6"
                                >
                                    {/* Header Row */}
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                                        <div>
                                            <h3 className="text-xl text-gray-800 uppercase tracking-widest font-mono mb-2">{hospital.name}</h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 font-mono">
                                                <MapPin size={14} />
                                                Lat: 19.2831, Lng: 72.8659 {/* Placeholder/Mock coords or use address */}
                                            </p>
                                        </div>
                                        <div className={`px-6 py-2.5 rounded-2xl text-sm font-bold tracking-wider uppercase shadow-sm min-w-[180px] flex items-center justify-center gap-2
                                            ${occupancyRate >= 80 ? 'bg-red-500 text-white shadow-red-200' :
                                                occupancyRate >= 50 ? 'bg-orange-500 text-white shadow-orange-200' :
                                                    'bg-green-500 text-white shadow-green-200'}`}>
                                            <span>{occupancyRate.toFixed(1)}%</span>
                                            <span className="opacity-80 text-[10px]">OCCUPIED</span>
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        {/* Total Beds */}
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col justify-between h-24">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Total Beds</span>
                                                <Bed size={16} className="text-blue-500" />
                                            </div>
                                            <span className="text-2xl font-light text-blue-900">{hospital.bedSummary.totalBeds}</span>
                                        </div>

                                        {/* Occupied */}
                                        <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex flex-col justify-between h-24">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Occupied</span>
                                                <XCircle size={16} className="text-red-500" />
                                            </div>
                                            <span className="text-2xl font-light text-red-900">{hospital.bedSummary.occupiedBeds}</span>
                                        </div>

                                        {/* Available */}
                                        <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col justify-between h-24">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Available</span>
                                                <CheckCircle size={16} className="text-green-500" />
                                            </div>
                                            <span className="text-2xl font-light text-green-900">{hospital.bedSummary.availableBeds}</span>
                                        </div>

                                        {/* OPD Today */}
                                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex flex-col justify-between h-24">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">OPD Today</span>
                                                <Calendar size={16} className="text-purple-500" />
                                            </div>
                                            <span className="text-2xl font-light text-purple-900">{hospital.opdLoad.today.total}</span>
                                        </div>
                                    </div>

                                    {/* Visual Tracker Header */}
                                    <div className="mb-8 p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-gray-400 font-mono uppercase tracking-widest">Visual Bed Occupancy Tracker</h4>
                                            <div className="flex items-center gap-4 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-sm bg-green-500"></div>
                                                    <span className="text-gray-500">Available</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-sm bg-red-500"></div>
                                                    <span className="text-gray-500">Occupied</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual Bed Grid (Seats) */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {allBeds.length > 0 ? (
                                                <>
                                                    {allBeds.slice(0, 40).map((b, i) => (
                                                        <div
                                                            key={`list-bed-${i}`}
                                                            onClick={(e) => b.status === 'available' && handleBedClick(e, 'General')}
                                                            className={`w-6 h-6 rounded flex items-center justify-center text-white shadow-sm border cursor-pointer hover:scale-110 transition-transform
                                                                ${b.status === 'occupied'
                                                                    ? "bg-red-500 border-red-500"
                                                                    : "bg-white border-green-500 text-green-600 hover:bg-green-50"}`}
                                                            title={b.status === 'available' ? "Click to Request" : "Occupied"}
                                                        >
                                                            <Bed size={12} fill={b.status === 'occupied' ? "white" : "none"} />
                                                        </div>
                                                    ))}
                                                    {allBeds.length > 40 && (
                                                        <div className="w-6 h-6 flex items-center justify-center text-gray-400 text-[10px] font-medium bg-gray-100 rounded">
                                                            +{allBeds.length - 40}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {/* Fallback Legacy Rendering */}
                                                    {/* Render Occupied Beds (Red) - Limit to 40 for list view */}
                                                    {Array.from({ length: Math.min(hospital.bedSummary.occupiedBeds, 20) }).map((_, i) => (
                                                        <div
                                                            key={`list-occ-${i}`}
                                                            className="w-6 h-6 rounded bg-red-500 flex items-center justify-center text-white shadow-sm"
                                                            style={{ backgroundColor: '#ef4444' }} // Force red
                                                        >
                                                            <Bed size={12} fill="white" />
                                                        </div>
                                                    ))}

                                                    {/* Render Available Beds (Green) - Limit remainder */}
                                                    {Array.from({ length: Math.min(hospital.bedSummary.availableBeds, 40 - Math.min(hospital.bedSummary.occupiedBeds, 20)) }).map((_, i) => (
                                                        <div
                                                            key={`list-avail-${i}`}
                                                            className="w-6 h-6 rounded border border-green-500 flex items-center justify-center text-green-600 bg-white"
                                                            style={{ borderColor: '#22c55e', color: '#16a34a' }} // Force green
                                                        >
                                                            <Bed size={12} />
                                                        </div>
                                                    ))}

                                                    {/* Overflow Indicator */}
                                                    {(hospital.bedSummary.totalBeds > 40) && (
                                                        <div className="w-6 h-6 flex items-center justify-center text-gray-400 text-[10px] font-medium bg-gray-100 rounded">
                                                            +{hospital.bedSummary.totalBeds - 40}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Panels */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* OPD Status */}
                                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest">OPD Status</h4>
                                                <Calendar size={16} className="text-purple-500" />
                                            </div>
                                            <div className="mb-4">
                                                <span className="text-3xl font-light text-purple-900">
                                                    {hospital.opdLoad.today.completed}/{hospital.opdLoad.today.total}
                                                </span>
                                                <span className="ml-2 text-sm text-purple-600 font-mono">Completed</span>
                                            </div>
                                            <div className="flex gap-4 text-xs font-mono text-purple-600/70 uppercase">
                                                <span>{hospital.opdLoad.today.scheduled} Scheduled</span>
                                                <span>{hospital.opdLoad.today.cancelled} Cancelled</span>
                                            </div>
                                        </div>

                                        {/* Admissions */}
                                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Admissions</h4>
                                                <Users size={16} className="text-gray-400" />
                                            </div>
                                            <div className="mb-4">
                                                <span className="text-3xl font-light text-gray-800">
                                                    {hospital.admissionsLoad.today}
                                                </span>
                                                <span className="ml-2 text-sm text-gray-500 font-mono">Today</span>
                                            </div>
                                            <div className="flex gap-4 text-xs font-mono text-gray-500 uppercase">
                                                <span>{hospital.admissionsLoad.pending} Pending</span>
                                                <span>{hospital.admissionsLoad.admitted} Admitted</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Modal */}
            <AnimatePresence>
                {selectedHospital && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedHospital(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col font-sans"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-gray-100 flex items-start justify-between bg-white relative">
                                <button
                                    onClick={() => setSelectedHospital(null)}
                                    className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>

                                <div className="w-full">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                                        <div>
                                            <h2 className="text-2xl text-gray-800 uppercase tracking-widest font-mono mb-2">{selectedHospital.name}</h2>
                                            <p className="text-sm text-gray-500 flex items-center gap-2 font-mono">
                                                <MapPin size={16} />
                                                123 Healthcare Blvd, Medical District {/* Mock Address */}
                                            </p>
                                        </div>
                                        {/* Recalculate occupancy for modal badge */}
                                        <div className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide uppercase self-start
                                            ${getOccupancyRate(selectedHospital) >= 80 ? 'bg-orange-500 text-white' :
                                                getOccupancyRate(selectedHospital) >= 50 ? 'bg-orange-500 text-white' :
                                                    'bg-green-500 text-white'}`}>
                                            {getOccupancyRate(selectedHospital).toFixed(1)}% OCCUPIED
                                        </div>
                                    </div>

                                    {/* Metrics Grid Reuse */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Total Beds */}
                                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex flex-col justify-between h-32">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Total Beds</span>
                                                <Bed size={20} className="text-blue-500" />
                                            </div>
                                            <span className="text-4xl font-light text-blue-900 tracking-tighter">{selectedHospital.bedSummary.totalBeds}</span>
                                        </div>

                                        {/* Occupied */}
                                        <div className="bg-red-50 rounded-xl p-6 border border-red-100 flex flex-col justify-between h-32">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Occupied</span>
                                                <XCircle size={20} className="text-red-500" />
                                            </div>
                                            <span className="text-4xl font-light text-red-900 tracking-tighter">{selectedHospital.bedSummary.occupiedBeds}</span>
                                        </div>

                                        {/* Available */}
                                        <div className="bg-green-50 rounded-xl p-6 border border-green-100 flex flex-col justify-between h-32">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Available</span>
                                                <CheckCircle size={20} className="text-green-500" />
                                            </div>
                                            <span className="text-4xl font-light text-green-900 tracking-tighter">{selectedHospital.bedSummary.availableBeds}</span>
                                        </div>

                                        {/* OPD Today */}
                                        <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 flex flex-col justify-between h-32">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">OPD Today</span>
                                                <Calendar size={20} className="text-purple-500" />
                                            </div>
                                            <span className="text-4xl font-light text-purple-900 tracking-tighter">{selectedHospital.opdLoad.today.total}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 overflow-y-auto bg-white flex-1">
                                <div className="border border-gray-200 rounded-3xl p-6">
                                    <div className="flex justify-between items-center mb-8">
                                        <h4 className="text-lg font-bold text-gray-500 font-mono uppercase tracking-widest">Visual Bed Occupancy Tracker</h4>
                                        <div className="flex items-center gap-6 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-green-500"></div>
                                                <span className="text-gray-600 font-medium">Available</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-red-600"></div>
                                                <span className="text-gray-600 font-medium">Occupied</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-12">
                                        {selectedHospital.bedSummary.byType.map((bed, idx) => (
                                            <div key={idx} className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <h5 className="text-sm font-bold text-gray-600 uppercase tracking-wider">{bed.type}</h5>
                                                    <span className="text-xs text-gray-500 italic font-mono">
                                                        {bed.occupied} Occupied • {bed.available} Available
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className="bg-orange-500 h-full rounded-full"
                                                        style={{ width: `${(bed.occupied / (bed.total || 1)) * 100}%` }}
                                                    ></div>
                                                </div>

                                                {/* Bed Icons Grid */}
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {bed.beds && bed.beds.length > 0 ? (
                                                        bed.beds.sort((a, b) => a.number - b.number).map((b) => (
                                                            <div
                                                                key={b.number}
                                                                onClick={(e) => b.status === "available" && handleBedClick(e, bed.type)}
                                                                className={`relative w-8 h-8 rounded flex items-center justify-center shadow-sm transition-all cursor-pointer hover:scale-110
                                                                    ${b.status === 'occupied'
                                                                        ? "bg-red-600 text-white"
                                                                        : "bg-white border border-green-500 text-green-600 hover:bg-green-50"
                                                                    }`}
                                                                title={`${b.status === 'available' ? "Click to Request " : ""}${bed.type} Bed ${b.number}`}
                                                            >
                                                                <Bed size={14} />
                                                                <span className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded-full border
                                                                    ${b.status === 'occupied' ? "bg-white text-red-600 border-red-100" : "bg-green-600 text-white border-green-600"}
                                                                `}>
                                                                    {b.number}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <>
                                                            {/* Fallback: Occupied Reds */}
                                                            {Array.from({ length: Math.min(bed.occupied, 50) }).map((_, i) => (
                                                                <div key={`occ-${i}`} className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white shadow-sm">
                                                                    <Bed size={16} />
                                                                </div>
                                                            ))}
                                                            {/* Fallback: Available Greens */}
                                                            {Array.from({ length: Math.min(bed.available, 50) }).map((_, i) => (
                                                                <div key={`avail-${i}`} className="w-8 h-8 rounded border border-green-500 flex items-center justify-center text-green-600 bg-white">
                                                                    <Bed size={16} />
                                                                </div>
                                                            ))}
                                                            {(bed.total > 100) && (
                                                                <div className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">
                                                                    +{bed.total - 100}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BedRequestModal
                isOpen={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
                hospitalName={selectedHospital?.name || "Hospital"}
                bedType={selectedBedType}
            />
        </div>
    );
};
