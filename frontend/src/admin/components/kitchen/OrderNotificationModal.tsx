import { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface Order {
  id?: string;
  _id?: string;
  orderNumber: string;
  tableNumber: number;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

interface OrderNotificationModalProps {
  order: Order | null;
  onAcknowledge: () => void;
}

export const OrderNotificationModal = ({ order, onAcknowledge }: OrderNotificationModalProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (order) {
      setVisible(true);
    }
  }, [order]);

  if (!order || !visible) return null;

  const handleAcknowledge = () => {
    setVisible(false);
    setTimeout(() => {
      onAcknowledge();
    }, 300); // Wait for animation
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header with pulsing animation */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          <div className="relative flex items-center gap-3">
            <div className="p-3 bg-white rounded-full animate-bounce">
              <Bell className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">New Order!</h2>
              <p className="text-orange-100 text-sm">Order #{order.orderNumber}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="text-sm text-gray-500">Table Number</p>
              <p className="text-3xl font-bold text-gray-900">{order.tableNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Items</p>
              <p className="text-3xl font-bold text-orange-500">{order.items.length}</p>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-sm font-medium text-gray-700 mb-2">Order Items:</p>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-semibold text-gray-900">x{item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Acknowledge Button */}
          <Button
            onClick={handleAcknowledge}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Acknowledge Order
          </Button>
        </div>
      </div>
    </div>
  );
};
