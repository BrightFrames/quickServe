import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || undefined;
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.log('[SOCKET] No token found, skipping socket connection');
      return;
    }
    
    const socketInstance = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: {
        token: token, // Send token for authentication
      },
    });

    socketInstance.on("connect", () => {
      console.log("[SOCKET] Connected successfully");
    });

    socketInstance.on("disconnect", () => {
      console.log("[SOCKET] Disconnected");
    });
    
    socketInstance.on("error", (error) => {
      console.error("[SOCKET] Error:", error);
    });
    
    socketInstance.on("connect_error", (error) => {
      console.error("[SOCKET] Connection error:", error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return socket;
};
