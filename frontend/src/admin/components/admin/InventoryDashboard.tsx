import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, AlertTriangle, ArrowUp, Search, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '../../context/RestaurantContext';

interface InventoryItem {
    id: number;
    menuItemId: number;
    currentStock: number;
    lowStockThreshold: number;
    unit: string;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    menuItem: {
        name: string;
        category: string;
        image: string;
    };
}

const InventoryDashboard = () => {
    const { restaurantSlug } = useRestaurant();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
    const [searchQuery, setSearchQuery] = useState("");

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const getAxiosConfig = () => {
        const token = localStorage.getItem('token') || localStorage.getItem('restaurantToken');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-restaurant-slug': restaurantSlug || '',
            }
        };
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiUrl}/api/inventory`, getAxiosConfig());
            if (response.data.success) {
                setItems(response.data.inventory);
            }
        } catch (error) {
            toast.error('Failed to fetch inventory');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const syncInventory = async () => {
        try {
            setSyncing(true);
            const response = await axios.post(`${apiUrl}/api/inventory/sync`, {}, getAxiosConfig());
            if (response.data.success) {
                toast.success(response.data.message);
                fetchInventory();
            }
        } catch (error) {
            toast.error('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [restaurantSlug]);

    const updateStock = async (menuItemId: number, quantity: number, type: 'add' | 'remove' | 'set') => {
        try {
            await axios.post(`${apiUrl}/api/inventory/update`, { menuItemId, quantity, type }, getAxiosConfig());
            toast.success('Stock updated');
            fetchInventory(); // Refresh to ensure backend consistency
        } catch (error) {
            toast.error('Failed to update stock');
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.menuItem?.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (filter === 'low') return matchesSearch && item.status === 'low_stock';
        if (filter === 'out') return matchesSearch && item.status === 'out_of_stock';
        return matchesSearch;
    });

    if (loading) return <div className="p-8 text-center">Loading Inventory...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Inventory Dashboard</h2>
                    <p className="text-sm text-gray-500">Manage stock levels (Phase 2 Module)</p>
                </div>
                <button
                    onClick={syncInventory}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync from Menu'}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Total Items</p>
                        <p className="text-2xl font-bold">{items.length}</p>
                    </div>
                    <Package className="text-gray-400 w-8 h-8" />
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Low Stock</p>
                        <p className="text-2xl font-bold text-orange-600">{items.filter(i => i.status === 'low_stock').length}</p>
                    </div>
                    <AlertTriangle className="text-orange-200 w-8 h-8" />
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Out of Stock</p>
                        <p className="text-2xl font-bold text-red-600">{items.filter(i => i.status === 'out_of_stock').length}</p>
                    </div>
                    <AlertTriangle className="text-red-200 w-8 h-8" />
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex gap-2">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-gray-100'}`}>All</button>
                    <button onClick={() => setFilter('low')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'low' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}>Low Stock</button>
                    <button onClick={() => setFilter('out')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'out' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>Out of Stock</button>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Item</th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Category</th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                            <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="py-4 px-6 font-medium text-gray-900">{item.menuItem?.name || 'Unknown Item'}</td>
                                <td className="py-4 px-6 text-gray-500">{item.menuItem?.category}</td>
                                <td className="py-4 px-6">
                                    {item.status === 'in_stock' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> In Stock</span>}
                                    {item.status === 'low_stock' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" /> Low</span>}
                                    {item.status === 'out_of_stock' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Out</span>}
                                </td>
                                <td className="py-4 px-6 text-right font-mono font-bold text-gray-700">{item.currentStock}</td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => updateStock(item.menuItemId, 1, 'add')} className="p-1 hover:bg-gray-100 rounded border border-gray-200" title="Add 1">
                                            <ArrowUp className="w-4 h-4 text-green-600" />
                                        </button>
                                        {/* More actions can be added here */}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredItems.length === 0 && <div className="p-8 text-center text-gray-500">No items found. Try syncing inventory.</div>}
            </div>
        </div>
    );
};

export default InventoryDashboard;
