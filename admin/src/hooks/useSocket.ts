import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || undefined;
    const socketInstance = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return socket;
};
