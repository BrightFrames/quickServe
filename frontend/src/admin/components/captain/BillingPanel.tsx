import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, Receipt, CreditCard, Banknote, CheckCircle, AlertCircle } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNumber: string;
  tableNumber: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

interface BillingPanelProps {
  tableNumber: number;
  onClose: () => void;
  onPaymentComplete: () => void;
}

const BillingPanel: React.FC<BillingPanelProps> = ({
  tableNumber,
  onClose,
  onPaymentComplete,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cash");

  useEffect(() => {
    fetchTableOrders();
  }, [tableNumber]);

  const fetchTableOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const restaurantSlug = user.restaurantSlug;

      const response = await axios.get(
        `${apiUrl}/api/captain/tables/${restaurantSlug}/orders/${tableNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Convert string values to numbers
      const ordersData = (response.data || []).map((order: any) => ({
        ...order,
        subtotal: parseFloat(order.subtotal) || 0,
        tax: parseFloat(order.tax) || 0,
        total: parseFloat(order.total) || 0,
        items: order.items?.map((item: any) => ({
          ...item,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 0,
        })) || []
      }));

      setOrders(ordersData);
    } catch (err: any) {
      console.error("[BILLING] Error fetching orders:", err);
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm(`Mark Table ${tableNumber} as paid and free the table?`)) {
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const restaurantSlug = user.restaurantSlug;

      await axios.post(
        `${apiUrl}/api/captain/tables/${restaurantSlug}/mark-paid/${tableNumber}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onPaymentComplete();
      onClose();
    } catch (err: any) {
      console.error("[BILLING] Error marking as paid:", err);
      alert(err.response?.data?.message || "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const cashOrders = orders.filter(o => o.paymentMethod === 'cash' && o.paymentStatus !== 'paid');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading billing details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Table {tableNumber} - Billing</h2>
              <p className="text-blue-100 text-sm">
                {orders.length} order(s) • Total: ₹{totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">{error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orders found for this table</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        {order.paymentMethod === 'cash' ? (
                          <Banknote className="w-4 h-4 text-green-600" />
                        ) : (
                          <CreditCard className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="text-sm font-medium capitalize">
                          {order.paymentMethod}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-700">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-300 pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">₹{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">₹{order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                      <span>Total</span>
                      <span className="text-blue-600">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        {orders.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
            {/* Payment Method Selection */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Select Payment Method
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedPaymentMethod("cash")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === "cash"
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="font-medium text-sm">Cash</span>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod("card")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === "card"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="font-medium text-sm">Card</span>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod("upi")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === "upi"
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="font-medium text-sm">UPI/Online</span>
                </button>
              </div>
            </div>

            {/* Total Amount */}
            <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Amount
                </h3>
                <p className="text-xs text-gray-600">
                  {orders.length} order(s) • {selectedPaymentMethod.toUpperCase()}
                </p>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                ₹{totalAmount.toFixed(2)}
              </div>
            </div>

            {/* Confirm Payment Button */}
            <button
              onClick={handleMarkAsPaid}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirm Payment & Free Table
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPanel;
