import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ChefHat, BellRing, Star } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface OrderStatus {
  status: "pending" | "preparing" | "ready" | "served" | "completed";
  timestamp?: Date;
}

interface OrderTrackingProgressProps {
  currentStatus:
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";
  orderNumber?: string;
}

export const OrderTrackingProgress = ({
  currentStatus,
  orderNumber,
}: OrderTrackingProgressProps) => {
  const [progress, setProgress] = useState(0);

  // Define order stages
  const stages = [
    {
      id: "pending",
      label: "Order Placed",
      icon: CheckCircle2,
      color: "text-gray-500",
      bgColor: "bg-gray-100",
      activeColor: "text-green-600",
      activeBg: "bg-green-100",
    },
    {
      id: "preparing",
      label: "Preparing",
      icon: ChefHat,
      color: "text-gray-500",
      bgColor: "bg-gray-100",
      activeColor: "text-yellow-600",
      activeBg: "bg-yellow-100",
    },
    {
      id: "ready",
      label: "Ready to Serve",
      icon: BellRing,
      color: "text-gray-500",
      bgColor: "bg-gray-100",
      activeColor: "text-blue-600",
      activeBg: "bg-blue-100",
    },
    {
      id: "served",
      label: "Served",
      icon: Star,
      color: "text-gray-500",
      bgColor: "bg-gray-100",
      activeColor: "text-green-600",
      activeBg: "bg-green-100",
    },
  ];

  // Calculate progress percentage based on current status
  useEffect(() => {
    if (currentStatus === "cancelled") {
      setProgress(0);
      return;
    }

    const statusIndex = stages.findIndex((stage) => stage.id === currentStatus);
    const progressPercentage = ((statusIndex + 1) / stages.length) * 100;
    setProgress(progressPercentage);
  }, [currentStatus]);

  // Handle cancelled orders
  if (currentStatus === "cancelled") {
    return (
      <div className="w-full space-y-6">
        {orderNumber && (
          <div className="flex items-center justify-center">
            <div className="px-4 py-2 bg-red-100 rounded-full">
              <p className="text-sm font-semibold text-red-600">
                Order #{orderNumber} - Cancelled
              </p>
            </div>
          </div>
        )}
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-700 font-medium">
            This order has been cancelled. Please contact staff for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Check if a stage is active or completed
  const getStageStatus = (stageId: string) => {
    const currentIndex = stages.findIndex((s) => s.id === currentStatus);
    const stageIndex = stages.findIndex((s) => s.id === stageId);

    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="w-full space-y-8">
      {/* Order Number Badge */}
      {orderNumber && (
        <div className="flex items-center justify-center">
          <div className="px-6 py-2 bg-gray-900 rounded-full shadow-sm">
            <p className="text-sm font-bold text-white tracking-widest uppercase">
              Order #{orderNumber}
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Track */}
        <div className="absolute top-10 left-0 right-0 h-3 bg-gray-100 rounded-full mx-8" />

        {/* Animated Progress Fill */}
        <motion.div
          className="absolute top-10 left-0 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full mx-8 shadow-sm"
          initial={{ width: 0 }}
          animate={{ width: `calc(${progress}% - 4rem)` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Stage Indicators */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const stageStatus = getStageStatus(stage.id);
            const Icon = stage.icon;
            const isActive = stageStatus === "active";
            const isCompleted = stageStatus === "completed";

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center group"
                style={{ width: `${100 / stages.length}%` }}
              >
                {/* Icon Circle */}
                <motion.div
                  className={cn(
                    "relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-300 border-4",
                    isActive || isCompleted ? "border-white bg-green-50" : "border-white bg-gray-50",
                    isActive && "ring-4 ring-green-100 scale-110 bg-white"
                  )}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                >
                  <Icon
                    className={cn(
                      "w-8 h-8 transition-colors duration-300",
                      isActive ? "text-green-600" : isCompleted ? "text-green-600" : "text-gray-300"
                    )}
                  />

                  {/* Pulse Animation for Active Stage */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-green-500/10"
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  {/* Checkmark for Completed Stages */}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </motion.div>

                {/* Stage Label */}
                <motion.p
                  className={cn(
                    "mt-4 text-xs font-bold text-center uppercase tracking-wider transition-colors duration-300 px-1",
                    isActive ? "text-green-700 scale-110" : isCompleted ? "text-gray-900" : "text-gray-400"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {stage.label === 'Preparing' ? 'Cooking' : stage.label}
                </motion.p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Message - Unambiguous */}
      <motion.div
        className={cn(
          "text-center p-6 rounded-xl border-2",
          currentStatus === 'ready' ? "bg-green-50 border-green-100" :
            currentStatus === 'preparing' ? "bg-orange-50 border-orange-100" :
              "bg-gray-50 border-gray-100"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className={cn(
          "text-lg font-black uppercase tracking-tight mb-1",
          currentStatus === 'ready' ? "text-green-700" : "text-gray-900"
        )}>
          {currentStatus === "pending" && "Order Sent to Kitchen"}
          {currentStatus === "preparing" && "Chef is Cooking"}
          {currentStatus === "ready" && "Ready for Pickup!"}
          {(currentStatus === "served" || currentStatus === "completed") && "Enjoy Your Meal"}
        </h3>
        <p className="text-sm font-medium text-gray-500">
          {currentStatus === "pending" && "Waiting for chef to accept..."}
          {currentStatus === "preparing" && "Preparing your delicious food now."}
          {currentStatus === "ready" && "Head to the counter to collect your order."}
          {(currentStatus === "served" || currentStatus === "completed") && "Thank you for dining with us!"}
        </p>
      </motion.div>
    </div>
  );
};
