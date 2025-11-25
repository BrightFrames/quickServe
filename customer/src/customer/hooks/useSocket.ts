import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

interface UseSocketOptions {
  onOrderStatusUpdate?: (data: {
    orderId: string;
    status: string;
    orderNumber: string;
  }) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to socket server
    const socketUrl = import.meta.env.VITE_API_URL || undefined;
    socketRef.current = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Order status updates - listen for both events for compatibility
    socket.on("order-updated", (data) => {
      console.log("[Socket] Order updated:", data);
      if (options.onOrderStatusUpdate) {
        options.onOrderStatusUpdate({
          orderId: data.id || data._id,
          status: data.status,
          orderNumber: data.orderNumber
        });
      }
    });
    
    socket.on("orderStatusUpdated", (data) => {
      console.log("[Socket] Order status updated:", data);
      if (options.onOrderStatusUpdate) {
        options.onOrderStatusUpdate(data);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off("order-updated");
      socket.off("orderStatusUpdated");
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, isConnected };
};
