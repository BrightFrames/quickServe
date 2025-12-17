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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* TableFlow Header */}
      <div className="bg-white border-b sticky top-0 z-20 px-4 py-3 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tight text-gray-900">TableFlow</h1>

        {/* View Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('orders')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'orders' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
          >
            Orders
          </button>
          <button
            onClick={() => setView('tables')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'tables' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
          >
            Tables
          </button>
        </div>

        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-600">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {view === 'orders' ? (
          <OrderQueue orders={orders} onStatusUpdate={handleStatusUpdate} />
        ) : (
          <TableView onTableClick={handleTableSelect} />
        )}
      </div>
    </div>
  );
};

export default CaptainHome;
