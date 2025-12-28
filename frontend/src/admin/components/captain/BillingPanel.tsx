import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, Receipt, CreditCard, Banknote, CheckCircle, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Spinner } from "@/shared/ui/spinner";
import { toast } from "sonner";

const apiUrl = import.meta.env.VITE_API_URL;

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  const handlePaymentComplete = async () => {
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

      toast.success(`Table ${tableNumber} marked as paid and released`);
      onPaymentComplete();
      onClose();
    } catch (err: any) {
      console.error("[BILLING] Error marking as paid:", err);
      toast.error(err.response?.data?.message || "Failed to process payment");
    } finally {
      setProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
          <div className="text-center flex flex-col items-center justify-center">
            <Spinner size={48} className="text-blue-600 mb-4" />
            <p className="text-gray-600">Loading billing details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Table {tableNumber}</h2>
              <p className="text-gray-500 text-sm font-medium">
                Billing Details • {orders.length} Order{orders.length !== 1 && 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold text-lg">No orders found</p>
              <p className="text-gray-500 text-sm">This table currently has no active orders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-3">
                      <span className="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}
                    >
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm group">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                              {item.quantity}
                            </span>
                            <span className="text-gray-700 font-medium">{item.name}</span>
                          </div>
                          <span className="text-gray-900 font-semibold group-hover:text-blue-600 transition-colors">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-3 space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Subtotal</span>
                        <span>₹{order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Tax</span>
                        <span>₹{order.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-gray-900 pt-2">
                        <span>Total</span>
                        <span className="text-blue-600">₹{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        {orders.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col md:flex-row gap-6">

              {/* Payment Methods */}
              <div className="flex-1">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Payment Method
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote, color: 'green' },
                    { id: 'card', label: 'Card', icon: CreditCard, color: 'blue' },
                    { id: 'upi', label: 'UPI', icon: CreditCard, color: 'purple' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${selectedPaymentMethod === method.id
                        ? `border-${method.color}-500 bg-${method.color}-50 text-${method.color}-700 shadow-sm scale-[1.02]`
                        : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      <method.icon className={`w-5 h-5 ${selectedPaymentMethod === method.id ? '' : 'text-gray-400'}`} />
                      <span className="font-semibold text-xs">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Total & Action */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Payable</p>
                    <p className="text-xs text-gray-400 mt-1">Including all taxes</p>
                  </div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight">
                    ₹{totalAmount.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={processing}
                  className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-gray-200 hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <>
                      <Spinner size={20} className="text-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Mark as Paid & Release Table
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Table {tableNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all orders as paid and free up the table for new customers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePaymentComplete();
              }}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? <Spinner size={16} className="mr-2" /> : null}
              Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};

export default BillingPanel;
