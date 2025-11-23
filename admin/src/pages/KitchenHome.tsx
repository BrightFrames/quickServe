import { useEffect, useState } from "react";
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

export interface Order {
  _id: string;
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
  const socket = useSocket();

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
        toast.success(`New order #${order.orderNumber} received!`, {
          description: `Table ${order.tableNumber}`,
        });
        playNotificationSound();
      });

      socket.on("order-updated", (updatedOrder: Order) => {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
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

  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {});
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-green-900 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Kitchen Dashboard</h1>
            <div className="flex items-center space-x-2 bg-green-800 px-3 py-1 rounded-full">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">
                {orders.length} Active Orders
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, {user?.username}!</span>
            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Columns */}
      <div className="flex-1 overflow-auto p-6">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <OrderColumn
              title="Preparing / In Queue"
              status="preparing"
              orders={preparingOrders}
              icon={Clock}
              color="yellow"
              onStatusChange={updateOrderStatus}
            />
            <OrderColumn
              title="Prepared / Ready"
              status="prepared"
              orders={preparedOrders}
              icon={CheckCircle}
              color="green"
              onStatusChange={updateOrderStatus}
            />
            <OrderColumn
              title="Delivered / Out"
              status="delivered"
              orders={deliveredOrders}
              icon={Truck}
              color="blue"
              onStatusChange={updateOrderStatus}
            />
          </div>
        </DndContext>
      </div>
    </div>
  );
};

export default KitchenHome;
