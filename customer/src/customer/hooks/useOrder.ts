import { useState, useEffect, useCallback } from 'react';
import { orderService, Order, OrderStatus } from '../services/orderService';
import { useSocket } from './useSocket';

export const useOrder = () => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = async (orderData: Partial<Order>) => {
    try {
      setLoading(true);
      setError(null);
      const order = await orderService.createOrder(orderData);
      setCurrentOrder(order);
      return order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place order';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatus = async (orderId: string) => {
    try {
      const order = await orderService.getOrderById(orderId);
      setCurrentOrder(order);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order status');
      return null;
    }
  };

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setCurrentOrder((prev) => {
      if (prev && (prev.id === orderId || prev._id === orderId)) {
        return { ...prev, status };
      }
      return prev;
    });
  }, []);

  // Real-time status updates via Socket.IO
  const handleOrderStatusUpdate = useCallback((data: { orderId: string; status: string; orderNumber: string }) => {
    console.log('Received order status update:', data);
    updateOrderStatus(data.orderId, data.status as OrderStatus);
  }, [updateOrderStatus]);

  useSocket({ onOrderStatusUpdate: handleOrderStatusUpdate });

  const fetchOrderHistory = async () => {
    try {
      const history = await orderService.getOrderHistory();
      setOrderHistory(history);
    } catch (err) {
      console.error('Failed to fetch order history:', err);
    }
  };

  return {
    currentOrder,
    orderHistory,
    loading,
    error,
    placeOrder,
    getOrderStatus,
    updateOrderStatus,
    fetchOrderHistory,
  };
};
