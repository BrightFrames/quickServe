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
    <div className="w-full space-y-6">
      {/* Order Number Badge */}
      {orderNumber && (
        <div className="flex items-center justify-center">
          <div className="px-4 py-2 bg-primary/10 rounded-full">
            <p className="text-sm font-semibold text-primary">
              Order #{orderNumber}
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Track */}
        <div className="absolute top-8 left-0 right-0 h-2 bg-gray-200 rounded-full mx-8" />

        {/* Animated Progress Fill */}
        <motion.div
          className="absolute top-8 left-0 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-green-600 rounded-full mx-8"
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
                className="flex flex-col items-center"
                style={{ width: `${100 / stages.length}%` }}
              >
                {/* Icon Circle */}
                <motion.div
                  className={cn(
                    "relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                    isActive || isCompleted ? stage.activeBg : stage.bgColor,
                    isActive && "ring-4 ring-primary/20 scale-110"
                  )}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                >
                  <Icon
                    className={cn(
                      "w-7 h-7 transition-colors duration-300",
                      isActive || isCompleted ? stage.activeColor : stage.color
                    )}
                  />

                  {/* Pulse Animation for Active Stage */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      animate={{
                        scale: [1, 1.3, 1],
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
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CheckCircle2 className="w-6 h-6 text-green-600 absolute top-0 right-0" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Stage Label */}
                <motion.p
                  className={cn(
                    "mt-3 text-sm font-medium text-center transition-colors duration-300",
                    isActive || isCompleted ? "text-gray-900" : "text-gray-500"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {stage.label}
                </motion.p>

                {/* Active Status Indicator */}
                {isActive && (
                  <motion.div
                    className="mt-1 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    />
                    <span className="text-xs text-primary font-semibold">
                      In Progress
                    </span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Message */}
      <motion.div
        className="text-center p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-sm text-gray-600">
          {currentStatus === "pending" &&
            "Your order has been received and is being processed"}
          {currentStatus === "preparing" &&
            "Our chef is preparing your delicious meal"}
          {currentStatus === "ready" &&
            "Your order is ready! Please collect from the counter"}
          {(currentStatus === "served" || currentStatus === "completed") &&
            "Enjoy your meal! Hope you loved it ✨"}
        </p>
      </motion.div>
    </div>
  );
};
