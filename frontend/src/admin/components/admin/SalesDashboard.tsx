import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingBag, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../lib/utils';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { toast } from 'sonner';

const SalesDashboard = () => {
    const { restaurantSlug } = useRestaurant();
    const [salesData, setSalesData] = useState<any>(null);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('today'); // today, week, month

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

    const fetchReports = async () => {
        setLoading(true);
        try {
            // Calculate dates based on range
            const end = new Date();
            const start = new Date();

            if (dateRange === 'week') start.setDate(start.getDate() - 7);
            if (dateRange === 'month') start.setDate(start.getDate() - 30);
            // if today, start is today start of day (handled by backend default if not sent, or send explicitly)

            const params = new URLSearchParams();
            if (dateRange !== 'today') {
                params.append('startDate', start.toISOString());
                params.append('endDate', end.toISOString());
            }

            const [salesRes, trendRes] = await Promise.all([
                axios.get(`${apiUrl}/api/reports/daily-sales?${params.toString()}`, getAxiosConfig()),
                axios.get(`${apiUrl}/api/reports/sales-trend`, getAxiosConfig())
            ]);

            if (salesRes.data.success) {
                setSalesData(salesRes.data.data);
            }
            if (trendRes.data.success) {
                setTrendData(trendRes.data.data.map((d: any) => ({
                    date: new Date(d.date).toLocaleDateString(),
                    revenue: parseFloat(d.revenue)
                })));
            }

        } catch (error) {
            console.error(error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [restaurantSlug, dateRange]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading && !salesData) return <div className="p-8 text-center">Loading Reports...</div>;

    const paymentData = salesData?.paymentSplit ? Object.entries(salesData.paymentSplit).map(([name, value]) => ({ name, value })) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Sales Reports</h2>
                    <p className="text-sm text-gray-500">Financial Insights & Analytics</p>
                </div>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                    <button
                        onClick={() => setDateRange('today')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === 'today' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setDateRange('week')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === 'week' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => setDateRange('month')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === 'month' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Last 30 Days
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">
                                {salesData ? formatCurrency(salesData.totalSales) : '-'}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Orders</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">
                                {salesData?.totalOrders || 0}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Average Order Value</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">
                                {salesData ? formatCurrency(salesData.averageOrderValue) : '-'}
                            </h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Sales Trend (Last 7 Days)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Bar dataKey="revenue" fill="#0F172A" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Split */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Payment Methods</h3>
                    <div className="h-64 flex items-center justify-center">
                        {paymentData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {paymentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                                <CreditCard className="w-8 h-8 mb-2" />
                                No payment data
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;
