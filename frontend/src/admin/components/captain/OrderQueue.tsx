import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Truck, AlertCircle, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Order {
    id?: string;
    _id?: string;
    orderNumber: string;
    tableId: string;
    tableNumber: number;
    items: Array<{
        name: string;
        quantity: number;
        specialInstructions?: string;
    }>;
    status: "pending" | "preparing" | "prepared" | "ready" | "served" | "completed" | "cancelled";
    createdAt: string;
}

interface OrderQueueProps {
    orders: Order[];
    onStatusUpdate: (orderId: string, newStatus: string) => void;
}

const OrderQueue: React.FC<OrderQueueProps> = ({ orders, onStatusUpdate }) => {
    const [activeTab, setActiveTab] = useState<'new' | 'preparing' | 'ready' | 'served'>('new');

    // Filter orders
    const newOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing' || o.status === 'prepared');
    const readyOrders = orders.filter(o => o.status === 'ready');
    const servedOrders = orders.filter(o => o.status === 'served');

    const getActiveList = () => {
        switch (activeTab) {
            case 'new': return newOrders;
            case 'preparing': return preparingOrders;
            case 'ready': return readyOrders;
            case 'served': return servedOrders;
            default: return [];
        }
    };

    const activeList = getActiveList();

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Massive Filtering Tabs */}
            <div className="grid grid-cols-4 gap-1 p-2 bg-white shadow-sm z-10">
                {[
                    { id: 'new', label: 'NEW', count: newOrders.length, activeClass: 'bg-blue-600 text-white', inactiveClass: 'bg-gray-100 text-gray-600' },
                    { id: 'preparing', label: 'PREP', count: preparingOrders.length, activeClass: 'bg-orange-500 text-white', inactiveClass: 'bg-gray-100 text-gray-600' },
                    { id: 'ready', label: 'READY', count: readyOrders.length, activeClass: 'bg-green-600 text-white', inactiveClass: 'bg-gray-100 text-gray-600' },
                    { id: 'served', label: 'DONE', count: servedOrders.length, activeClass: 'bg-gray-800 text-white', inactiveClass: 'bg-gray-100 text-gray-600' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex flex-col items-center justify-center col-span-1 py-3 rounded-lg font-black text-xs transition-all active:scale-95
                            ${activeTab === tab.id ? tab.activeClass : tab.inactiveClass}
                        `}
                    >
                        <span className="text-lg leading-none mb-1">{tab.count}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3 pb-24">
                {activeList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <CheckCircle className="w-12 h-12 mb-2 opacity-20" />
                        <span className="font-bold uppercase tracking-widest text-sm opacity-50">No Orders</span>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {activeList.map((order) => (
                            <motion.div
                                key={order.id || order._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CaptainOrderCard order={order} onAction={onStatusUpdate} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

const CaptainOrderCard = ({ order, onAction }: { order: Order, onAction: (id: string, status: string) => void }) => {
    const orderId = order.id || order._id || "";
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const updateTime = () => {
            const diff = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            setElapsed(diff);
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [order.createdAt]);

    const getAction = () => {
        switch (order.status) {
            case 'pending':
                return { label: 'Accept Order', status: 'preparing', color: 'bg-blue-600', icon: CheckCircle };
            case 'preparing':
                // Optional: Captains usually don't mark ready, but can if needed. 
                // For now, let's allow them to "Mark Ready" if kitchen forgets, or just show "In Kitchen"
                // Plan said "New -> Accept" and "Ready -> Serve".
                return null;
            case 'ready':
                return { label: 'Serve Order', status: 'served', color: 'bg-green-600', icon: Truck };
            default:
                return null;
        }
    };

    const action = getAction();
    const isUrgent = elapsed > 20;

    return (
        <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${isUrgent ? 'ring-2 ring-red-500' : ''}`}>
            {/* Card Header - Table & Time */}
            <div className="flex items-stretch border-b border-gray-100">
                <div className="bg-gray-900 text-white px-4 py-3 flex flex-col items-center justify-center min-w-[80px]">
                    <span className="text-[10px] uppercase font-bold text-gray-400">TABLE</span>
                    <span className="text-3xl font-black leading-none">{order.tableNumber}</span>
                </div>
                <div className="flex-1 p-3 flex justify-between items-center bg-white">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase">ORDER #{order.orderNumber?.slice(-4) || '....'}</span>
                        <div className={`flex items-center gap-1 font-bold text-sm ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {elapsed} min ago
                        </div>
                    </div>
                </div>
            </div>

            {/* Items List - Ultra Compact */}
            <div className="p-3">
                {order.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <div className="font-black text-gray-900 text-lg w-6 text-center bg-gray-100 rounded">{item.quantity}</div>
                        <div className="flex-1 leading-snug">
                            <div className="font-bold text-gray-800 text-base">{item.name}</div>
                            {item.specialInstructions && (
                                <div className="text-red-500 text-xs font-bold mt-0.5 uppercase flex items-center gap-1 bg-red-50 inline-block px-1 rounded">
                                    <AlertCircle className="w-3 h-3" />
                                    {item.specialInstructions}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Huge Action Button */}
            {action ? (
                <button
                    onClick={() => onAction(orderId, action.status)}
                    className={`w-full py-4 text-white font-black uppercase tracking-widest text-lg flex items-center justify-center gap-2 active:opacity-90 ${action.color}`}
                >
                    <action.icon className="w-6 h-6" />
                    {action.label}
                </button>
            ) : (
                <div className="bg-gray-100 py-3 text-center border-t border-gray-200">
                    <span className="text-gray-500 font-bold text-sm uppercase flex items-center justify-center gap-2">
                        {order.status === 'preparing' ? <ChefHat className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        Status: {order.status}
                    </span>
                </div>
            )}
        </div>
    );
};

export default OrderQueue;
