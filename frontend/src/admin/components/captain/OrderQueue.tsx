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
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 p-4 bg-white border-b sticky top-16 z-10 no-scrollbar">
                {[
                    { id: 'new', label: 'New', count: newOrders.length, color: 'text-blue-600 bg-blue-50' },
                    { id: 'preparing', label: 'Preparing', count: preparingOrders.length, color: 'text-orange-600 bg-orange-50' },
                    { id: 'ready', label: 'Ready', count: readyOrders.length, color: 'text-green-600 bg-green-50' },
                    { id: 'served', label: 'Served', count: servedOrders.length, color: 'text-gray-600 bg-gray-50' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
              flex-shrink-0 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all
              ${activeTab === tab.id
                                ? 'border-black bg-black text-white shadow-lg'
                                : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'}
            `}
                    >
                        <div className="flex items-center gap-2">
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white text-black' : 'bg-gray-300 text-gray-700'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {activeList.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-semibold text-gray-500">No {activeTab} orders</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {activeList.map((order) => (
                            <motion.div
                                key={order.id || order._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
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
        <div className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${isUrgent ? 'border-red-200 bg-red-50/10' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Table</span>
                    <div className="text-4xl font-black text-gray-900 leading-none mt-1">
                        {order.tableNumber}
                    </div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg font-mono font-bold text-sm flex items-center gap-2 ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    <Clock className="w-4 h-4" />
                    {elapsed}m
                </div>
            </div>

            <div className="space-y-3 mb-4">
                {order.items.map((item, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                        <div className="font-bold text-gray-500 w-6">{item.quantity}x</div>
                        <div className="flex-1 font-medium text-gray-900">
                            {item.name}
                            {item.specialInstructions && (
                                <div className="text-orange-600 text-xs mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {item.specialInstructions}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {action ? (
                <button
                    onClick={() => onAction(orderId, action.status)}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 ${action.color}`}
                >
                    <action.icon className="w-6 h-6" />
                    {action.label}
                </button>
            ) : (
                <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-center border-2 border-transparent">
                    {order.status === 'preparing' ? (
                        <span className="flex items-center justify-center gap-2">
                            <ChefHat className="w-5 h-5" /> In Kitchen
                        </span>
                    ) : (
                        <span className="capitalize">{order.status}</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrderQueue;
