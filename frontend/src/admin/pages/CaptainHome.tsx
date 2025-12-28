import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import OrderQueue from "../components/captain/OrderQueue";
import TableView from "../components/captain/TableView";

const CaptainHome: React.FC = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [view, setView] = useState<'orders' | 'tables'>('orders');
  const [orders, setOrders] = useState<any[]>([]);

  // Sound & Socket Logic similar to Kitchen but simplified
  useEffect(() => {
    if (socket && user?.restaurantId) {
      socket.emit("join-captain", user.restaurantId);

      socket.on("new-order", (newOrder: any) => {
        setOrders(prev => [newOrder, ...prev]);
        toast.info(`New Order Table ${newOrder.tableNumber}`);
      });

      socket.on("order-updated", (updatedOrder: any) => {
        setOrders(prev => prev.map(o => (o.id || o._id) === (updatedOrder.id || updatedOrder._id) ? updatedOrder : o));
      });
    }
  }, [socket, user]);

  // Initial Fetch
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Optimistic update
      setOrders(prev => prev.map(o => (o.id || o._id) === orderId ? { ...o, status } : o));
      toast.success(`Order marked as ${status}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleTableSelect = (tableNumber: number) => {
    const safeUser = user as any;
    if (safeUser?.restaurantSlug) {
      // Logic to open customer menu for this table
      // We use window.location.href to do a full refresh/redirect so it loads the customer app cleanly
      // Store necessary data for the customer app to know it's a captain session?
      // Actually, the customer app just needs the URL. Captain session persistence might be needed if we want to "go back" easily.
      // For now, let's just open it.

      const restaurantData = {
        restaurantName: safeUser.restaurantName || 'Restaurant',
        restaurantSlug: safeUser.restaurantSlug,
        token: localStorage.getItem('token') || ''
      };
      localStorage.setItem('customer_restaurant_data', JSON.stringify(restaurantData));

      window.location.href = `/${safeUser.restaurantSlug}/customer/menu/table/${tableNumber}`;
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header - Minimal info */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm z-10">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">KOT Display</h1>
        <button onClick={logout} className="p-2 bg-red-50 text-red-600 rounded-lg">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative pb-16">
        {view === 'orders' ? (
          <OrderQueue orders={orders} onStatusUpdate={handleStatusUpdate} />
        ) : (
          <TableView onTableClick={handleTableSelect} />
        )}
      </div>

      {/* Bottom Navigation - THUMB FRIENDLY */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
        <button
          onClick={() => setView('orders')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-sm ${view === 'orders' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
            }`}
        >
          <span className="text-lg">📋</span>
          ORDERS
        </button>
        <div className="w-[1px] bg-gray-200"></div>
        <button
          onClick={() => setView('tables')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-sm ${view === 'tables' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
            }`}
        >
          <span className="text-lg">🪑</span>
          TABLES
        </button>
      </div>
    </div>
  );
};

export default CaptainHome;
