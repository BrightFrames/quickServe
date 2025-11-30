import React, { useState } from "react";
import axios from "axios";
import { Minus, Plus, Trash2, Send, AlertCircle } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

interface CaptainCartProps {
  items: CartItem[];
  tableNumber: number;
  onUpdateQuantity: (itemId: number, change: number) => void;
  onUpdateNotes: (itemId: number, notes: string) => void;
  onRemoveItem: (itemId: number) => void;
  onOrderPlaced: () => void;
}

const CaptainCart: React.FC<CaptainCartProps> = ({
  items,
  tableNumber,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem,
  onOrderPlaced,
}) => {
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setError("Cart is empty");
      return;
    }

    setPlacing(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const restaurantCode = user.restaurantCode;

      // Get restaurant slug from code
      const restaurantResponse = await axios.get(
        `${apiUrl}/api/restaurant/info/code/${restaurantCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const slug = restaurantResponse.data.restaurant.slug;

      // Prepare order data
      const orderData = {
        tableNumber,
        items: items.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.notes || "",
        })),
        slug,
        paymentMethod: "cash", // Captain orders default to cash
        customerEmail: `captain-order-table${tableNumber}@restaurant.com`,
      };

      await axios.post(`${apiUrl}/api/orders`, orderData);

      setSuccess("Order sent to kitchen successfully!");
      setTimeout(() => {
        onOrderPlaced();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm sticky top-20">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-900">
          Order for Table {tableNumber}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </div>

      {/* Cart Items */}
      <div className="p-4 max-h-[calc(100vh-400px)] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No items added yet</p>
            <p className="text-sm mt-2">Add items from the menu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-blue-600 mt-1">
                      ₹{item.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold min-w-[2rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 ml-auto">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                {/* Notes */}
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                  placeholder="Add notes (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="p-4 border-t space-y-4">
          {/* Total */}
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-blue-600">₹{subtotal.toFixed(2)}</span>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium text-center">
              {success}
            </div>
          )}

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={placing || items.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {placing ? "Sending to Kitchen..." : "Send to Kitchen"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CaptainCart;
