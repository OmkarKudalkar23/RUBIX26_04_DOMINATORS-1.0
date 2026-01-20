import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
    getCentralizedHospitalCapacity,
    type CentralizedHospitalData,
    type CentralizedCapacityResponse,
} from "../services/centralizedApi";
import {
    Activity,
    Bed,
    Users,
    Hospital,
    TrendingUp,
    TrendingDown,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    RefreshCw,
    BarChart3,
    PieChart as PieChartIcon,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
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

    // Prepare chart data
    const bedTypeData = capacityData?.hospitals.flatMap((hospital) =>
        hospital.bedSummary.byType.map((bed) => ({
            hospital: hospital.name.substring(0, 15) + "...",
            type: bed.type,
            available: bed.available,
            occupied: bed.occupied,
        }))
    );

    const occupancyData = capacityData?.hospitals.map((hospital) => ({
        name: hospital.name.substring(0, 15) + "...",
        occupancy: getOccupancyRate(hospital),
        available: hospital.bedSummary.availableBeds,
    }));

    const opdData = capacityData?.hospitals.map((hospital) => ({
        name: hospital.name.substring(0, 12) + "...",
        today: hospital.opdLoad.today.total,
        last7Days: hospital.opdLoad.last7Days.total,
    }));

    const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

    if (loading && !capacityData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                {sidebarOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Hospital className="text-white" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">City Health Dashboard</h1>
                                    <p className="text-sm text-gray-400">Real-time Hospital Capacity Monitor</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={20} className={`text-white ${loading ? "animate-spin" : ""}`} />
                            </button>
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* City Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 p-6 shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Bed className="text-white/80" size={32} />
                                <TrendingUp className="text-white/60" size={20} />
                            </div>
                            <h3 className="text-white/80 text-sm font-medium mb-1">Total Beds</h3>
                            <p className="text-4xl font-bold text-white mb-2">
                                {capacityData?.citySummary.totalBeds.toLocaleString() || 0}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-white/70">
                                <span className="px-2 py-1 bg-white/20 rounded-full">
                                    {capacityData?.citySummary.availableBeds || 0} Available
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-pink-700 p-6 shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Calendar className="text-white/80" size={32} />
                                <Activity className="text-white/60" size={20} />
                            </div>
                            <h3 className="text-white/80 text-sm font-medium mb-1">OPD Today</h3>
                            <p className="text-4xl font-bold text-white mb-2">
                                {capacityData?.citySummary.todayAppointments.toLocaleString() || 0}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-white/70">
                                <span className="px-2 py-1 bg-white/20 rounded-full">
                                    Last 7 days: {capacityData?.citySummary.last7DaysAppointments || 0}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 p-6 shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Users className="text-white/80" size={32} />
                                <TrendingUp className="text-white/60" size={20} />
                            </div>
                            <h3 className="text-white/80 text-sm font-medium mb-1">Admissions Today</h3>
                            <p className="text-4xl font-bold text-white mb-2">
                                {capacityData?.citySummary.todayAdmissions || 0}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-white/70">
                                <span className="px-2 py-1 bg-white/20 rounded-full">
                                    Pending: {capacityData?.citySummary.pendingAdmissions || 0}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 p-6 shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Hospital className="text-white/80" size={32} />
                                <CheckCircle className="text-white/60" size={20} />
                            </div>
                            <h3 className="text-white/80 text-sm font-medium mb-1">Active Hospitals</h3>
                            <p className="text-4xl font-bold text-white mb-2">
                                {capacityData?.hospitals.length || 0}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-white/70">
                                <span className="px-2 py-1 bg-white/20 rounded-full">
                                    {((capacityData?.citySummary.occupiedBeds || 0) / (capacityData?.citySummary.totalBeds || 1) * 100).toFixed(1)}% Occupancy
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Hospital Occupancy Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <BarChart3 className="text-purple-400" />
                                Hospital Occupancy Rates
                            </h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={occupancyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                <XAxis dataKey="name" stroke="#ffffff80" style={{ fontSize: "12px" }} />
                                <YAxis stroke="#ffffff80" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1e293b",
                                        border: "1px solid #ffffff20",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                />
                                <Bar dataKey="occupancy" fill="url(#colorOccupancy)" radius={[8, 8, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* OPD Load Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="text-pink-400" />
                                OPD Patient Load
                            </h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={opdData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                <XAxis dataKey="name" stroke="#ffffff80" style={{ fontSize: "12px" }} />
                                <YAxis stroke="#ffffff80" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1e293b",
                                        border: "1px solid #ffffff20",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="today"
                                    stroke="#ec4899"
                                    strokeWidth={3}
                                    dot={{ fill: "#ec4899", r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="last7Days"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ fill: "#8b5cf6", r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search hospitals by name or address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilterType("all")}
                                className={`px-4 py-3 rounded-lg transition-colors ${filterType === "all"
                                        ? "bg-purple-500 text-white"
                                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterType("high")}
                                className={`px-4 py-3 rounded-lg transition-colors ${filterType === "high"
                                        ? "bg-red-500 text-white"
                                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                                    }`}
                            >
                                High Load
                            </button>
                            <button
                                onClick={() => setFilterType("medium")}
                                className={`px-4 py-3 rounded-lg transition-colors ${filterType === "medium"
                                        ? "bg-orange-500 text-white"
                                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                                    }`}
                            >
                                Medium
                            </button>
                            <button
                                onClick={() => setFilterType("low")}
                                className={`px-4 py-3 rounded-lg transition-colors ${filterType === "low"
                                        ? "bg-green-500 text-white"
                                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                                    }`}
                            >
                                Low Load
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hospital List */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4">Hospital Details</h2>
                    {filteredHospitals?.map((hospital, index) => {
                        const occupancyRate = getOccupancyRate(hospital);
                        const status = getOccupancyStatus(occupancyRate);

                        return (
                            <motion.div
                                key={hospital.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all cursor-pointer"
                                onClick={() => setSelectedHospital(hospital)}
                            >
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Hospital Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{hospital.name}</h3>
                                                <p className="text-gray-400 text-sm">{hospital.address}</p>
                                            </div>
                                            <div
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${status === "high"
                                                        ? "bg-red-500/20 text-red-300"
                                                        : status === "medium"
                                                            ? "bg-orange-500/20 text-orange-300"
                                                            : "bg-green-500/20 text-green-300"
                                                    }`}
                                            >
                                                {occupancyRate.toFixed(1)}% Occupied
                                            </div>
                                        </div>

                                        {/* Bed Summary */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="text-gray-400 text-xs mb-1">Total Beds</p>
                                                <p className="text-white text-2xl font-bold">{hospital.bedSummary.totalBeds}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="text-gray-400 text-xs mb-1">Occupied</p>
                                                <p className="text-red-400 text-2xl font-bold">{hospital.bedSummary.occupiedBeds}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="text-gray-400 text-xs mb-1">Available</p>
                                                <p className="text-green-400 text-2xl font-bold">{hospital.bedSummary.availableBeds}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="text-gray-400 text-xs mb-1">OPD Today</p>
                                                <p className="text-purple-400 text-2xl font-bold">{hospital.opdLoad.today.total}</p>
                                            </div>
                                        </div>

                                        {/* Bed Types */}
                                        <div className="flex flex-wrap gap-2">
                                            {hospital.bedSummary.byType.map((bed) => (
                                                <div
                                                    key={bed.type}
                                                    className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg px-3 py-2 border border-white/10"
                                                >
                                                    <p className="text-white text-xs font-semibold">{bed.type}</p>
                                                    <p className="text-gray-300 text-xs">
                                                        {bed.available}/{bed.total} available
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="lg:w-64 space-y-3">
                                        <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 rounded-lg p-4 border border-purple-500/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-purple-300 text-sm">OPD Status</span>
                                                <Calendar size={16} className="text-purple-400" />
                                            </div>
                                            <p className="text-white text-lg font-bold">
                                                {hospital.opdLoad.today.completed}/{hospital.opdLoad.today.total} Completed
                                            </p>
                                            <p className="text-purple-300 text-xs mt-1">
                                                {hospital.opdLoad.today.scheduled} Scheduled
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-br from-pink-500/20 to-pink-700/20 rounded-lg p-4 border border-pink-500/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-pink-300 text-sm">Admissions</span>
                                                <Users size={16} className="text-pink-400" />
                                            </div>
                                            <p className="text-white text-lg font-bold">
                                                {hospital.admissionsLoad.today} Today
                                            </p>
                                            <p className="text-pink-300 text-xs mt-1">
                                                {hospital.admissionsLoad.pending} Pending
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* No Results */}
                {filteredHospitals?.length === 0 && (
                    <div className="text-center py-12">
                        <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-400 text-lg">No hospitals found matching your criteria</p>
                    </div>
                )}
            </div>

            {/* Hospital Detail Modal */}
            <AnimatePresence>
                {selectedHospital && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedHospital(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedHospital.name}</h2>
                                    <p className="text-gray-400">{selectedHospital.address}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedHospital(null)}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="text-white" size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {selectedHospital.bedSummary.byType.map((bed, index) => (
                                    <div
                                        key={bed.type}
                                        className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-white/10"
                                    >
                                        <h4 className="text-white font-semibold mb-4 text-lg">{bed.type} Beds</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Total:</span>
                                                <span className="text-white font-bold">{bed.total}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Occupied:</span>
                                                <span className="text-red-400 font-bold">{bed.occupied}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">Available:</span>
                                                <span className="text-green-400 font-bold">{bed.available}</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                                                <div
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${bed.total > 0 ? (bed.occupied / bed.total) * 100 : 0}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/10 rounded-xl p-6 border border-white/10">
                                    <h4 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                                        <Calendar className="text-purple-400" />
                                        OPD Statistics
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Today Total:</span>
                                            <span className="text-white font-bold">{selectedHospital.opdLoad.today.total}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Scheduled:</span>
                                            <span className="text-blue-400 font-bold">{selectedHospital.opdLoad.today.scheduled}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Completed:</span>
                                            <span className="text-green-400 font-bold">{selectedHospital.opdLoad.today.completed}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Cancelled:</span>
                                            <span className="text-red-400 font-bold">{selectedHospital.opdLoad.today.cancelled}</span>
                                        </div>
                                        <div className="flex justify-between pt-3 border-t border-white/10">
                                            <span className="text-gray-300">Last 7 Days:</span>
                                            <span className="text-purple-400 font-bold">{selectedHospital.opdLoad.last7Days.total}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-xl p-6 border border-white/10">
                                    <h4 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                                        <Users className="text-pink-400" />
                                        Admission Statistics
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Today:</span>
                                            <span className="text-white font-bold">{selectedHospital.admissionsLoad.today}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Pending:</span>
                                            <span className="text-orange-400 font-bold">{selectedHospital.admissionsLoad.pending}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Admitted:</span>
                                            <span className="text-green-400 font-bold">{selectedHospital.admissionsLoad.admitted}</span>
                                        </div>
                                        <div className="flex justify-between pt-3 border-t border-white/10">
                                            <span className="text-gray-300">Last 7 Days:</span>
                                            <span className="text-purple-400 font-bold">{selectedHospital.admissionsLoad.last7Days}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
