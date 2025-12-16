import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LogOut,
  DollarSign,
  Users,
  Clock,
  Check,
  X,
  CreditCard,
  Wallet,
  Smartphone,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface TableStatus {
  id: number;
  tableId: string;
  tableName: string;
  seats: number;
  location: string;
  activeOrders: number;
  hasActiveOrders: boolean;
  latestOrderTime: string | null;
}

interface Order {
  id: number;
  orderNumber: string;
  tableId: string;
  tableNumber: number;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

const ReceptionHome: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableStatus | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (user?.restaurantId) {
      fetchTables();
      const interval = setInterval(fetchTables, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (selectedTable) {
      fetchTableOrders(selectedTable.tableId);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/api/reception/tables/${user?.restaurantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTables(response.data);
    } catch (error: any) {
      console.error("Failed to fetch tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const fetchTableOrders = async (tableId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/api/reception/table-orders/${user?.restaurantId}/${tableId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTableOrders(response.data);

      // Auto-select pending/ready orders
      const pendingOrders = response.data
        .filter((order: Order) => ['pending', 'preparing', 'ready'].includes(order.status))
        .map((order: Order) => order.id);
      setSelectedOrders(pendingOrders);
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    }
  };

  const handleProcessPayment = async (paymentMethod: string) => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders to process");
      return;
    }

    setProcessingPayment(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${apiUrl}/api/reception/process-payment`,
        {
          orderIds: selectedOrders,
          paymentMethod,
          restaurantId: user?.restaurantId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(`Payment processed via ${paymentMethod.toUpperCase()}!`);
      setSelectedOrders([]);
      setSelectedTable(null);
      fetchTables();
    } catch (error: any) {
      console.error("Payment processing failed:", error);
      toast.error(error.response?.data?.message || "Failed to process payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const calculateSelectedTotal = () => {
    return tableOrders
      .filter(order => selectedOrders.includes(order.id))
      .reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                Reception Desk
              </h1>
              <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchTables}
                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Tables ({tables.length})
              </h2>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedTable?.id === table.id
                        ? "border-green-500 bg-green-50"
                        : table.hasActiveOrders
                          ? "border-orange-200 bg-orange-50 hover:border-orange-300"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {table.tableName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {table.location || "No location"}
                        </div>
                      </div>
                      {table.hasActiveOrders && (
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                          {table.activeOrders} active
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Billing Section */}
          <div className="lg:col-span-2">
            {selectedTable ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedTable.tableName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedTable.location || "No location"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTable(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {tableOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders for this table</p>
                  </div>
                ) : (
                  <>
                    {/* Orders List */}
                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                      {tableOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`border rounded-lg p-4 ${selectedOrders.includes(order.id)
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200"
                            }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedOrders.includes(order.id)}
                                  onChange={() => toggleOrderSelection(order.id)}
                                  className="w-4 h-4 text-green-600 rounded"
                                  disabled={order.status === 'completed'}
                                />
                                <span className="font-semibold text-gray-900">
                                  Order #{order.orderNumber}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 ml-6">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${order.status === 'completed'
                                  ? 'bg-gray-100 text-gray-700'
                                  : order.status === 'ready'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-1 ml-6 mb-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.quantity}x {item.name}
                                  {item.notes && (
                                    <span className="text-gray-500 text-xs ml-1">
                                      ({item.notes})
                                    </span>
                                  )}
                                </span>
                                <span className="font-medium">
                                  ₹{(item.quantity * item.price).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t pt-2 ml-6">
                            <div className="flex justify-between text-lg font-semibold">
                              <span>Total:</span>
                              <span className="text-green-600">
                                ₹{parseFloat(order.totalAmount.toString()).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Section */}
                    {selectedOrders.length > 0 && (
                      <div className="border-t pt-6">
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold text-gray-900">
                              Total Amount:
                            </span>
                            <span className="text-2xl font-bold text-green-600">
                              ₹{calculateSelectedTotal().toFixed(2)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedOrders.length} order(s) selected
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => handleProcessPayment('cash')}
                            disabled={processingPayment}
                            className="flex flex-col items-center gap-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Wallet className="w-6 h-6" />
                            <span className="font-medium">Cash</span>
                          </button>
                          <button
                            onClick={() => handleProcessPayment('card')}
                            disabled={processingPayment}
                            className="flex flex-col items-center gap-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <CreditCard className="w-6 h-6" />
                            <span className="font-medium">Card</span>
                          </button>
                          <button
                            onClick={() => handleProcessPayment('upi')}
                            disabled={processingPayment}
                            className="flex flex-col items-center gap-2 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                          >
                            <Smartphone className="w-6 h-6" />
                            <span className="font-medium">UPI</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Table
                </h3>
                <p className="text-gray-600">
                  Choose a table from the list to view orders and process billing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionHome;
