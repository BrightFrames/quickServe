import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Store, TrendingUp } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { formatCurrency } from '../lib/utils';
import {
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { toast } from 'sonner';

const OrgDashboard = () => {
    const { restaurantSlug } = useRestaurant();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    const fetchOrgStats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/api/organization/dashboard-stats`, getAxiosConfig());
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load Organization data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgStats();
    }, [restaurantSlug]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) return <div className="p-8 text-center">Loading Enterprise View...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Access Denied or No Data</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Organization Overview</h2>
                    <p className="text-sm text-gray-500">Multi-Outlet Performance</p>
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded text-sm text-slate-600 font-mono">
                    Enterprise View
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-purple-900 text-white p-6 rounded-xl border border-purple-800 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-purple-200">Total Org Revenue</p>
                        <h3 className="text-3xl font-bold mt-2">
                            {formatCurrency(data.totalRevenue)}
                        </h3>
                    </div>
                    <DollarSign className="absolute right-4 bottom-4 w-12 h-12 text-purple-800 opacity-50" />
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Outlets</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">
                                {data.activeOutlets}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Store className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Org Orders</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">
                                {data.totalOrders}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Table */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Outlet Performance</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3 text-left">Outlet Name</th>
                                <th className="px-6 py-3 text-right">Orders</th>
                                <th className="px-6 py-3 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.breakdown.map((item: any) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-600">{item.orders}</td>
                                    <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">{formatCurrency(item.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Revenue Share</h3>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.breakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="revenue"
                                >
                                    {data.breakdown.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrgDashboard;
