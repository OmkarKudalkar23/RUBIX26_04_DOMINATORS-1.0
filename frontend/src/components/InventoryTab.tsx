import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
    Package,
    Plus,
    AlertTriangle,
    TrendingUp,
    Search,
    Filter,
    Edit,
    Trash2,
    ArrowUp,
    ArrowDown,
    Activity,
    Pill,
    X
} from 'lucide-react';
import {
    getInventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    recordInventoryTransaction,
    getLowStockItems,
    getConsumptionTrends,
    type InventoryItem,
    type ConsumptionTrend
} from '../services/inventoryApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface InventoryTabProps {
    // No props needed - hospitalId is extracted from JWT token on backend
}

export const InventoryTab: React.FC<InventoryTabProps> = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
    const [consumptionTrends, setConsumptionTrends] = useState<ConsumptionTrend[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Get hospitalId from localStorage
    const getHospitalId = (): string | null => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.hospitalId || null;
        } catch {
            return null;
        }
    };

    const hospitalId = getHospitalId();

    // Form states
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Medicine',
        unit: 'units',
        currentStock: 0,
        minStock: 0,
        reorderQty: 0
    });

    const [stockAction, setStockAction] = useState<{
        type: 'consume' | 'restock' | 'adjust';
        qty: number;
        reason: string;
    }>({
        type: 'restock',
        qty: 0,
        reason: ''
    });

    useEffect(() => {
        if (hospitalId) {
            fetchData();
        }
    }, [hospitalId]);

    const fetchData = async () => {
        if (!hospitalId) {
            toast.error('Hospital ID not found. Please log in again.');
            return;
        }

        try {
            setLoading(true);
            const [items, lowStock, trends] = await Promise.all([
                getInventoryItems(hospitalId),
                getLowStockItems(hospitalId),
                getConsumptionTrends(hospitalId, 7)
            ]);
            setInventory(items);
            setLowStockItems(lowStock);
            setConsumptionTrends(trends);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hospitalId) {
            toast.error('Hospital ID not found');
            return;
        }
        try {
            await addInventoryItem(hospitalId, newItem);
            toast.success('Medicine added successfully!');
            setShowAddModal(false);
            setNewItem({
                name: '',
                category: 'Medicine',
                unit: 'units',
                currentStock: 0,
                minStock: 0,
                reorderQty: 0
            });
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add medicine');
        }
    };

    const handleStockUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !hospitalId) {
            if (!hospitalId) toast.error('Hospital ID not found');
            return;
        }

        try {
            await recordInventoryTransaction(hospitalId, {
                itemId: selectedItem._id,
                type: stockAction.type,
                qty: stockAction.qty,
                reason: stockAction.reason
            });
            toast.success(`Stock ${stockAction.type}ed successfully!`);
            setShowStockModal(false);
            setSelectedItem(null);
            setStockAction({ type: 'restock', qty: 0, reason: '' });
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update stock');
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        if (!hospitalId) {
            toast.error('Hospital ID not found');
            return;
        }

        try {
            await deleteInventoryItem(hospitalId, itemId);
            toast.success('Item deleted successfully!');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete item');
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...Array.from(new Set(inventory.map(item => item.category)))];

    const getStockColor = (item: InventoryItem) => {
        if (item.currentStock === 0) return 'text-red-600 bg-red-50';
        if (item.currentStock <= item.minStock) return 'text-orange-600 bg-orange-50';
        return 'text-green-600 bg-green-50';
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.currentStock === 0) return 'Out of Stock';
        if (item.currentStock <= item.minStock) return 'Low Stock';
        return 'In Stock';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl md:text-3xl uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}>
                    Inventory Management
                </h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
                    style={{ fontFamily: "'Doto', sans-serif" }}
                >
                    <Plus size={20} />
                    Add Medicine
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <Package className="text-blue-600" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-blue-900" style={{ fontFamily: "'Doto', sans-serif" }}>
                        {inventory.length}
                    </p>
                    <p className="text-sm text-blue-700 uppercase tracking-wide">Total Items</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border-2 border-red-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="text-red-600" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-red-900" style={{ fontFamily: "'Doto', sans-serif" }}>
                        {lowStockItems.length}
                    </p>
                    <p className="text-sm text-red-700 uppercase tracking-wide">Low Stock Alerts</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <Pill className="text-green-600" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-green-900" style={{ fontFamily: "'Doto', sans-serif" }}>
                        {categories.length - 1}
                    </p>
                    <p className="text-sm text-green-700 uppercase tracking-wide">Categories</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="text-purple-600" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-purple-900" style={{ fontFamily: "'Doto', sans-serif" }}>
                        {consumptionTrends.reduce((sum, t) => sum + t.totalConsumed, 0)}
                    </p>
                    <p className="text-sm text-purple-700 uppercase tracking-wide">7-Day Consumption</p>
                </motion.div>
            </div>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-red-600" size={24} />
                        <h3 className="text-lg font-bold uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif" }}>
                            Low Stock Alerts
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lowStockItems.map(item => (
                            <div key={item._id} className="bg-white rounded-xl p-4 border border-red-200">
                                <p className="font-semibold text-sm">{item.name}</p>
                                <p className="text-xs text-gray-600">{item.category}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-lg font-bold text-red-600">{item.currentStock} {item.unit}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setShowStockModal(true);
                                        }}
                                        className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Restock
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search medicines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>
                            {cat === 'all' ? 'All Categories' : cat}
                        </option>
                    ))}
                </select>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Medicine Name</th>
                                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Category</th>
                                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Current Stock</th>
                                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Min Stock</th>
                                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredInventory.map((item, index) => (
                                <motion.tr
                                    key={item._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.unit}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-lg font-bold">{item.currentStock}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600">{item.minStock}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockColor(item)}`}>
                                            {getStockStatus(item)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setShowStockModal(true);
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Manage Stock"
                                            >
                                                <Activity size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Consumption Trends Chart */}
            {consumptionTrends.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold uppercase tracking-wide mb-4" style={{ fontFamily: "'Doto', sans-serif" }}>
                        7-Day Consumption Trends
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={consumptionTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="totalConsumed" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Add Medicine Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif" }}>
                                    Add New Medicine
                                </h3>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Medicine Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                                        placeholder="e.g., Paracetamol"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Category</label>
                                    <select
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                                    >
                                        <option value="Medicine">Medicine</option>
                                        <option value="Oxygen">Oxygen</option>
                                        <option value="PPE">PPE</option>
                                        <option value="Consumables">Consumables</option>
                                        <option value="Equipment">Equipment</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Unit</label>
                                    <input
                                        type="text"
                                        required
                                        value={newItem.unit}
                                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                                        placeholder="e.g., tablets, bottles, boxes"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Current Stock</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={newItem.currentStock}
                                            onChange={(e) => setNewItem({ ...newItem, currentStock: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Min Stock</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={newItem.minStock}
                                            onChange={(e) => setNewItem({ ...newItem, minStock: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Reorder Qty</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={newItem.reorderQty}
                                            onChange={(e) => setNewItem({ ...newItem, reorderQty: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-semibold"
                                    >
                                        Add Medicine
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stock Management Modal */}
            <AnimatePresence>
                {showStockModal && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowStockModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold uppercase tracking-wide" style={{ fontFamily: "'Doto', sans-serif" }}>
                                    Manage Stock
                                </h3>
                                <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                <p className="font-semibold text-lg">{selectedItem.name}</p>
                                <p className="text-sm text-gray-600">Current Stock: <span className="font-bold">{selectedItem.currentStock} {selectedItem.unit}</span></p>
                            </div>

                            <form onSubmit={handleStockUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Action</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['restock', 'consume', 'adjust'] as const).map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setStockAction({ ...stockAction, type })}
                                                className={`px-4 py-2 rounded-xl font-semibold capitalize ${stockAction.type === type
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        {stockAction.type === 'adjust' ? 'New Stock Level' : 'Quantity'}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={stockAction.qty}
                                        onChange={(e) => setStockAction({ ...stockAction, qty: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Reason (Optional)</label>
                                    <textarea
                                        value={stockAction.reason}
                                        onChange={(e) => setStockAction({ ...stockAction, reason: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                                        rows={3}
                                        placeholder="e.g., Patient admission, Expired stock, etc."
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowStockModal(false)}
                                        className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-semibold"
                                    >
                                        Update Stock
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
