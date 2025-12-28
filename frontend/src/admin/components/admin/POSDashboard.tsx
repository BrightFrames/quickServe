import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    Smartphone,
    Receipt,
    ShoppingBag,
    History,
    Printer
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import NumberFlow from '@number-flow/react';

interface MenuItem {
    id: number;
    name: string;
    price: number;
    category: string;
    isVegetarian: boolean;
    isAvailable: boolean;
}

interface CartItem extends MenuItem {
    quantity: number;
}

interface Bill {
    id: number;
    billNumber: string;
    grandTotal: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    customerName?: string;
}

const POSDashboard = () => {
    const { restaurantSlug } = useRestaurant();
    const { user } = useAuth();
    const [activeMode, setActiveMode] = useState<'create' | 'history'>('create');

    // Data
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Checkout State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
    const [isProcessing, setIsProcessing] = useState(false);

    // Constants
    const TAX_RATE = 0.05; // 5% default
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchMenu();
        if (activeMode === 'history') {
            fetchBills();
        }
    }, [activeMode]);

    const getAxiosConfig = () => {
        const token = localStorage.getItem('token') || localStorage.getItem('restaurantToken');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-restaurant-slug': restaurantSlug || '',
            }
        };
    };

    const fetchMenu = async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/menu`, getAxiosConfig());
            setMenuItems(response.data);
            const uniqueCats = Array.from(new Set(response.data.map((item: MenuItem) => item.category))) as string[];
            setCategories(['All', ...uniqueCats]);
        } catch (error) {
            console.error('Error fetching menu:', error);
            toast.error('Failed to load menu');
        }
    };

    const fetchBills = async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/pos`, getAxiosConfig());
            setBills(response.data.bills);
        } catch (error) {
            console.error('Error fetching bills:', error);
        }
    };

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: number) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId: number, delta: number) => {
        setCart(prev => {
            return prev.map(i => {
                if (i.id === itemId) {
                    const newQty = i.quantity + delta;
                    return newQty > 0 ? { ...i, quantity: newQty } : i;
                }
                return i;
            });
        });
    };

    const calculateTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        const { subtotal, tax, total } = calculateTotals();

        try {
            const payload = {
                items: cart.map(i => ({
                    id: i.id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    total: i.price * i.quantity
                })),
                subtotal,
                taxAmount: tax,
                discountAmount: 0,
                grandTotal: total,
                paymentMethod,
                customerName,
                customerPhone,
                tableNumber: tableNumber ? parseInt(tableNumber) : null,
                status: 'paid' // Auto-pay for POS for now
            };

            await axios.post(`${apiUrl}/api/pos/create`, payload, getAxiosConfig());

            toast.success('Bill created successfully!');
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setTableNumber('');
            setActiveMode('history'); // Switch to history to show the new bill
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Failed to create bill');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredMenu = menuItems.filter(item =>
        (selectedCategory === 'All' || item.category === selectedCategory) &&
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        item.isAvailable
    );

    const { subtotal, tax, total } = calculateTotals();

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Header Tabs */}
            <div className="flex items-center space-x-4 mb-6">
                <button
                    onClick={() => setActiveMode('create')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeMode === 'create' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-gray-200'
                        }`}
                >
                    <Receipt className="w-4 h-4" />
                    <span>New Bill</span>
                </button>
                <button
                    onClick={() => setActiveMode('history')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeMode === 'history' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-gray-200'
                        }`}
                >
                    <History className="w-4 h-4" />
                    <span>Bill History</span>
                </button>
            </div>

            {activeMode === 'create' ? (
                <div className="flex h-full gap-6 overflow-hidden">
                    {/* Menu Selection Section */}
                    <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Search & Filter */}
                        <div className="p-4 border-b border-gray-100 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                            </div>
                            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Menu Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredMenu.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => addToCart(item)}
                                        className="flex flex-col items-start p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
                                    >
                                        <div className="flex items-start justify-between w-full mb-2">
                                            <div className={`w-3 h-3 rounded-full ${item.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-xs font-bold text-slate-900">{formatCurrency(item.price)}</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-slate-50">
                            <h2 className="font-semibold text-slate-800 flex items-center">
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Current Order
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
                                    <p className="text-sm">Cart is empty</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="p-1 text-red-400 hover:text-red-500 ml-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Checkout Area */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                            {/* Customer Details Inputs */}
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Table No. (Opt)"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                                <input
                                    type="text"
                                    placeholder="Phone (Opt)"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                            </div>

                            {/* Payment Method */}
                            <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-colors ${paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <Banknote className="w-3 h-3 mr-1" />
                                    Cash
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-colors ${paymentMethod === 'upi' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <Smartphone className="w-3 h-3 mr-1" />
                                    UPI
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-colors ${paymentMethod === 'card' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    Card
                                </button>
                            </div>

                            {/* Totals */}
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Tax (5%)</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-gray-200 mt-2">
                                    <span>Total</span>
                                    <NumberFlow value={total} format={{ style: 'currency', currency: 'INR' }} />
                                </div>
                            </div>

                            <button
                                disabled={cart.length === 0 || isProcessing}
                                onClick={handleCheckout}
                                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isProcessing ? 'Processing...' : `Pay ${formatCurrency(total)}`}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* History Mode */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Recent Bills</h2>
                    </div>
                    <div className="overflow-x-auto flex-1 p-0">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Bill No</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Payment</th>
                                    <th className="px-6 py-3">Total</th>
                                    <th className="px-6 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {bills.map(bill => (
                                    <tr key={bill.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{bill.billNumber}</td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(bill.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-500">{bill.customerName || '-'}</td>
                                        <td className="px-6 py-4 uppercase text-xs font-semibold text-gray-600">{bill.paymentMethod}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(bill.grandTotal)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {bill.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {bills.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                            No bills found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSDashboard;
