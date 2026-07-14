"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../lib/store/authStore";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    // Only connect if the user is authenticated, or if we want public live updates we can just connect.
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const socketInstance = io(url, {
      path: "/socket.io",
      auth: { token: accessToken },
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => setIsConnected(true));
    socketInstance.on("disconnect", () => setIsConnected(false));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
