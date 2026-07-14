"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSocket } from "../../context/SocketContext";
import { Coffee, CheckCircle, Clock, Truck } from "lucide-react";

interface LiveOrderTrackerProps {
  orderId: string;
  initialStatus: string;
}

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = ({ orderId, initialStatus }) => {
  const { socket, isConnected } = useSocket();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (!socket) return;
    
    // Subscribe to this specific order's updates
    socket.emit("subscribe_order", { orderId });

    const handleUpdate = (data: { orderId: string; status: string }) => {
      if (data.orderId === orderId) {
        setStatus(data.status);
      }
    };

    socket.on("order_status_updated", handleUpdate);

    return () => {
      socket.off("order_status_updated", handleUpdate);
    };
  }, [socket, orderId]);

  const steps = [
    { key: "pending", label: "Received", icon: <Clock size={20} /> },
    { key: "preparing", label: "Preparing", icon: <Coffee size={20} /> },
    { key: "delivering", label: "On the way", icon: <Truck size={20} /> },
    { key: "completed", label: "Completed", icon: <CheckCircle size={20} /> },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status) >= 0 
    ? steps.findIndex((s) => s.key === status) 
    : 0;

  return (
    <div className="w-full max-w-md mx-auto bg-surface-container-low p-6 rounded-2xl border border-gold-leaf/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display-lg text-primary">Live Tracking</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          </span>
          <span className="text-xs text-on-surface-variant font-label-caps">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-surface-container-high" />
        
        <div className="flex flex-col gap-8">
          {steps.map((step, idx) => {
            const isActive = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            
            return (
              <div key={step.key} className="flex items-center gap-6 relative z-10">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isActive ? "#C5A028" : "#2d2a21",
                    color: isActive ? "#1A0F0A" : "#99907c",
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-gold-leaf/10"
                >
                  {step.icon}
                </motion.div>
                
                <div>
                  <motion.p
                    animate={{
                      color: isActive ? "#eae1d4" : "#99907c",
                      fontWeight: isActive ? 600 : 400,
                    }}
                    className="font-body-md text-lg"
                  >
                    {step.label}
                  </motion.p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
