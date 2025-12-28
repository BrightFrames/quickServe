import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Bell, Clock, CheckCircle, Truck, ChefHat, AlertCircle, Volume2, VolumeX } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import { OrderNotificationModal } from "../components/kitchen/OrderNotificationModal";
import { KitchenSettings } from "../components/kitchen/KitchenSettings";
// import { useSocket } from "../hooks/useSocket"; // Socket disabled for now to rely on polling if needed or re-enable
import { useSocket } from "../hooks/useSocket";
import { toast } from "sonner";
import { notificationSounds } from "../utils/notificationSounds";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface Order {
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
  totalAmount: number;
}

const KitchenHome = () => {
  const { logout, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<"preparing" | "prepared" | "ready" | "history">("preparing");
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    time: string;
    read: boolean;
  }>>([]);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);

  // Clear notifications and orders when user logs out
  useEffect(() => {
    if (!user) {
      console.log('[KITCHEN] User logged out, clearing state');
      setOrders([]);
      setNotifications([]);
      setUnreadCount(0);
      setPendingOrder(null);
    }
  }, [user]);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('kitchenSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const socket = useSocket();
  const notificationRef = useRef<HTMLDivElement>(null);

  // Persist sound settings
  useEffect(() => {
    localStorage.setItem('kitchenSoundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);


  useEffect(() => {
    fetchOrders();

    // Set up polling as backup for real-time updates (every 30 seconds)
    const pollingInterval = setInterval(() => {
      if (user && user.restaurantId) {
        console.log('[KITCHEN] Polling for order updates...');
        fetchOrders();
      }
    }, 30000); // Poll every 30 seconds

    if (socket && user?.restaurantId) {
      // Join kitchen-specific room
      socket.emit("join-kitchen", user.restaurantId);
      console.log(`[KITCHEN] Joined kitchen room for restaurant ${user.restaurantId}`);

      socket.on("new-order", (order: Order) => {
        console.log('[KITCHEN] Received new order, user authenticated:', !!user);

        // Double-check user is still authenticated before showing notification
        if (!user || !user.restaurantId) {
          console.log('[KITCHEN] User not authenticated, ignoring notification');
          return;
        }

        setOrders((prev) => [order, ...prev]);

        // Add notification
        const newNotification = {
          id: order.id || order._id || `${Date.now()}`,
          message: `New order #${order.orderNumber} from Table ${order.tableNumber}`,
          time: new Date().toLocaleTimeString(),
          read: false
        };
        setNotifications((prev) => [newNotification, ...prev].slice(0, 10)); // Keep last 10
        setUnreadCount((prev) => prev + 1);

        // Play notification sound if enabled
        if (soundEnabled) {
          notificationSounds.playNewOrderSound();
        }

        // Show modal notification (always visible)
        setPendingOrder(order);

        // Show toast notification as backup
        toast.success(`New order #${order.orderNumber} received!`, {
          description: `Table ${order.tableNumber} - ${order.items.length} items`,
          duration: 5000,
        });
      });

      socket.on("order-updated", (updatedOrder: Order) => {
        console.log('[KITCHEN] Received order update:', updatedOrder);
        setOrders((prev) =>
          prev.map((order) =>
            (order.id || order._id) === (updatedOrder.id || updatedOrder._id) ? updatedOrder : order
          )
        );
      });

      return () => {
        socket.off("new-order");
        socket.off("order-updated");
        clearInterval(pollingInterval);
      };
    }

    return () => {
      clearInterval(pollingInterval);
    };
  }, [socket, user, soundEnabled]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${apiUrl}/api/orders/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${apiUrl}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) =>
        prev.map((order) =>
          (order.id || order._id) === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Play success sound when order is marked as ready
      if (newStatus === "ready") {
        notificationSounds.playSuccessSound();
      }

      toast.success(`Order moved to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const preparingOrders = orders.filter((o) => o.status === "preparing" || o.status === "pending");
  const preparedOrders = orders.filter((o) => o.status === "prepared");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const historyOrders = orders.filter((o) => o.status === "served" || o.status === "completed");

  // Filter based on active tab
  const activeOrders = selectedStatus === "preparing"
    ? preparingOrders
    : selectedStatus === "prepared"
      ? preparedOrders
      : selectedStatus === "ready"
        ? readyOrders
        : historyOrders;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Mark all as read when opening
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Loading Kitchen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Kitchen Display</h1>
              <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">QUICKSERVE PRO</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-100'
                }`}
              title="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleNotificationClick}
                className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 origin-top-right z-50"
                  >
                    {/* Notification content same as before but styled professionally */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-50">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={clearNotifications} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No new alerts</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                            <p className="text-sm text-gray-800">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => logout()}
              className="ml-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="px-4 border-t border-gray-100">
          <div className="max-w-7xl mx-auto flex gap-6 overflow-x-auto">
            {(["preparing", "prepared", "ready", "history"] as const).map((status) => {
              const isActive = selectedStatus === status;
              const count = status === "preparing"
                ? preparingOrders.length
                : status === "prepared"
                  ? preparedOrders.length
                  : status === "ready"
                    ? readyOrders.length
                    : historyOrders.length;

              const label = status === "preparing" ? "Processing" : status === "history" ? "Completed" : status;

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`relative py-4 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {label}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}>
                    {count}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No {selectedStatus} orders</h3>
              <p className="text-gray-500 mt-1 max-w-sm">
                Orders will appear here once customers place them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {activeOrders.map((order) => (
                  <motion.div
                    key={order.id || order._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="h-full"
                  >
                    <OrderCard order={order} onStatusChange={updateOrderStatus} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Modal Notification */}
      {pendingOrder && (
        <OrderNotificationModal
          order={pendingOrder}
          onAcknowledge={() => setPendingOrder(null)}
        />
      )}
    </div>
  );
};

const OrderCard = ({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, status: Order["status"]) => void }) => {
  const orderId = order.id || order._id || "";

  // Calculate time elapsed
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const diff = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
      setElapsed(diff);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const isUrgent = elapsed > 20;

  // Define State Visuals Aggressively
  const isNew = order.status === 'pending';
  const isCooking = order.status === 'preparing';
  const isReady = order.status === 'ready';

  const nextStatus =
    isNew ? "preparing" :
      isCooking ? "ready" :
        isReady ? "served" : null;

  return (
    <div className={`bg-white rounded-xl shadow-md border-2 h-full flex flex-col overflow-hidden ${isUrgent ? 'border-red-500 shadow-red-100' : 'border-gray-200'
      }`}>
      {/* Massive Status Header */}
      <div className={`p-4 text-white flex justify-between items-center ${isNew ? 'bg-blue-600 animate-pulse' :
          isCooking ? 'bg-orange-500' :
            isReady ? 'bg-green-600' : 'bg-gray-600'
        }`}>
        <div>
          <h3 className="text-sm font-bold uppercase opacity-90 tracking-widest">
            {isNew ? '⚠️ NEW ORDER' : isCooking ? '👨‍🍳 COOKING' : isReady ? '✅ READY' : 'COMPLETE'}
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black">{order.tableNumber}</span>
            <span className="text-sm font-medium opacity-80">Table</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-3 py-1 rounded-lg font-mono font-bold text-lg ${isUrgent ? 'bg-red-600 text-white' : 'bg-white/20 text-white'
            }`}>
            {elapsed}m
          </div>
          <div className="text-[10px] font-mono mt-1 opacity-70">#{order.orderNumber.slice(-4)}</div>
        </div>
      </div>

      {/* Items List - Large & Clear */}
      <div className="p-4 flex-1 space-y-3 bg-white">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-start border-b border-gray-100 last:border-0 pb-3 last:pb-0">
            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-lg font-black text-gray-800">
              {item.quantity}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900 leading-tight">
                {item.name}
              </p>
              {item.specialInstructions && (
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 text-xs font-bold uppercase rounded border border-red-100">
                  <AlertCircle className="w-3 h-3" />
                  {item.specialInstructions}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer - HUGE TARGETS */}
      {nextStatus && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          {isNew ? (
            <button
              onClick={() => onStatusChange(orderId, 'preparing')}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ChefHat className="w-6 h-6" />
              Start Cooking
            </button>
          ) : isCooking ? (
            <button
              onClick={() => onStatusChange(orderId, 'ready')}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-green-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-6 h-6" />
              Mark Ready
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(orderId, 'served')}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xl uppercase tracking-wider shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Truck className="w-6 h-6" />
              Served
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KitchenHome;
