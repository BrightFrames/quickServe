import { useState } from 'react';
import { Minus, Plus, Trash2, ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

interface CaptainCartProps {
  tableId: number;
  items: CartItem[];
  onUpdateCart: (items: CartItem[]) => void;
  onBack: () => void;
  onOrderPlaced: () => void;
}

const CaptainCart = ({ tableId, items, onUpdateCart, onBack, onOrderPlaced }: CaptainCartProps) => {
  const [loading, setLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const updateQuantity = (itemId: number, change: number) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    onUpdateCart(updatedItems);
  };

  const updateNotes = (itemId: number, notes: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, notes } : item
    );
    onUpdateCart(updatedItems);
  };

  const removeItem = (itemId: number) => {
    onUpdateCart(items.filter((item) => item.id !== itemId));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('captainToken');
      const user = JSON.parse(localStorage.getItem('captainUser') || '{}');

      const orderData = {
        restaurantId: user.restaurantId,
        tableNumber: tableId.toString(),
        items: items.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.notes || '',
        })),
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod: 'cash',
        customerEmail: customerEmail || undefined,
        orderedBy: 'captain',
        captainId: user.id,
      };

      await axios.post(`${apiUrl}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Order placed successfully!');
      onOrderPlaced();
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Cart is empty</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Menu
      </button>

      {/* Cart Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">₹{item.price} each</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="ml-auto font-semibold">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>

              <textarea
                placeholder="Add special instructions (optional)"
                value={item.notes}
                onChange={(e) => updateNotes(item.id, e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Customer Email (Optional) */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Email (Optional)</h3>
        <input
          type="email"
          placeholder="customer@example.com"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (5%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Place Order Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              'Placing Order...'
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send to Kitchen (₹{total.toFixed(2)})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaptainCart;
