import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Bell, Clock, CheckCircle, Truck } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import OrderColumn from "../components/kitchen/OrderColumn";
import { useSocket } from "../hooks/useSocket";
import axios from "axios";
import { toast } from "sonner";
import { notificationSounds } from "../utils/notificationSounds";

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
  status: "preparing" | "prepared" | "delivered";
  createdAt: string;
  totalAmount: number;
}

const KitchenHome = () => {
  const { logout, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<"all" | Order["status"]>("all");
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    time: string;
    read: boolean;
  }>>([]);
  const socket = useSocket();
  const notificationRef = useRef<HTMLDivElement>(null);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on("new-order", (order: Order) => {
        setOrders((prev) => [...prev, order]);
        
        // Add notification
        const newNotification = {
          id: order.id || order._id || `${Date.now()}`,
          message: `New order #${order.orderNumber} from Table ${order.tableNumber}`,
          time: new Date().toLocaleTimeString(),
          read: false
        };
        setNotifications((prev) => [newNotification, ...prev].slice(0, 10)); // Keep last 10
        setUnreadCount((prev) => prev + 1);
        
        // Play notification sound
        notificationSounds.playNewOrderSound();
        
        // Show toast notification
        toast.success(`New order #${order.orderNumber} received!`, {
          description: `Table ${order.tableNumber} - ${order.items.length} items`,
          duration: 5000,
        });
      });

      socket.on("order-updated", (updatedOrder: Order) => {
        setOrders((prev) =>
          prev.map((order) =>
            (order.id || order._id) === (updatedOrder.id || updatedOrder._id) ? updatedOrder : order
          )
        );
      });

      return () => {
        socket.off("new-order");
        socket.off("order-updated");
      };
    }
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/orders/active");
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
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          (order.id || order._id) === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      // Play success sound when order is marked as delivered
      if (newStatus === "delivered") {
        notificationSounds.playSuccessSound();
      }
      
      toast.success(`Order moved to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const orderId = active.id as string;
    const newStatus = over.id as Order["status"];

    updateOrderStatus(orderId, newStatus);
  };

  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const preparedOrders = orders.filter((o) => o.status === "prepared");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  // Filter orders based on selected status
  const filteredOrders = selectedStatus === "all" 
    ? orders 
    : orders.filter((o) => o.status === selectedStatus);

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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🍳</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">QuickServe Kitchen</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={handleNotificationClick}
                className="p-2 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={logout}
              className="flex items-center space-x-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="bg-white px-4 py-3 border-b">
        <h2 className="text-xl font-bold text-gray-900">Kitchen Dashboard</h2>
      </div>

      {/* Status Tabs */}
      <div className="bg-white px-4 py-2 border-b flex space-x-2 overflow-x-auto">
        <button 
          onClick={() => setSelectedStatus("preparing")}
          className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
            selectedStatus === "preparing" 
              ? "bg-yellow-100 text-yellow-800" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          In Queue {preparingOrders.length}
        </button>
        <button 
          onClick={() => setSelectedStatus("prepared")}
          className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
            selectedStatus === "prepared" 
              ? "bg-green-100 text-green-800" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Preparing {preparedOrders.length}
        </button>
        <button 
          onClick={() => setSelectedStatus("delivered")}
          className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
            selectedStatus === "delivered" 
              ? "bg-blue-100 text-blue-800" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Prepared {deliveredOrders.length}
        </button>
      </div>

      {/* Orders List - Mobile View */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No orders in this status</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <MobileOrderCard
              key={order.id || order._id}
              order={order}
              onStatusChange={updateOrderStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface MobileOrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: Order["status"]) => void;
}

const MobileOrderCard = ({ order, onStatusChange }: MobileOrderCardProps) => {
  const orderId = order.id || order._id;
  
  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "preparing":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Takeaway</span>;
      case "prepared":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Dine-In</span>;
      case "delivered":
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Delivered</span>;
      default:
        return null;
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return `${minutes} min ago`;
  };

  const getNextStatus = (): Order["status"] | null => {
    if (order.status === "preparing") return "prepared";
    if (order.status === "prepared") return "delivered";
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      {/* Order Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">#{order.orderNumber}</h3>
          <p className="text-sm text-gray-500">{getTimeAgo(order.createdAt)}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
            {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)} min ago
          </span>
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-1 mb-3">
        {order.items.map((item, index) => (
          <div key={`${orderId}-item-${index}`} className="flex items-start">
            <span className="text-sm text-gray-900">
              <span className="font-medium">{item.quantity}×</span> {item.name}
            </span>
          </div>
        ))}
        {order.items.some(item => item.specialInstructions) && (
          <div className="mt-2">
            {order.items.filter(item => item.specialInstructions).map((item, index) => (
              <p key={`spec-${index}`} className="text-xs text-orange-600">• {item.specialInstructions}</p>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      {nextStatus && (
        <button
          onClick={() => onStatusChange(orderId, nextStatus)}
          className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
            nextStatus === "prepared" 
              ? "bg-blue-500 hover:bg-blue-600" 
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {nextStatus === "prepared" && "Start Preparing"}
          {nextStatus === "delivered" && "Mark as Prepared"}
        </button>
      )}
    </div>
  );
};

export default KitchenHome;
