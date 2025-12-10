import { CheckCircle2, Clock, Flame, Bell, Check } from "lucide-react";
import { OrderStatus } from "../services/orderService";
import { cn } from "@/shared/lib/utils";

interface OrderStatusBannerProps {
  status: OrderStatus;
  orderId?: string;
}

const statusConfig: Record<string, {
  icon: any;
  label: string;
  description: string;
  color: string;
  textColor: string;
  bgColor: string;
}> = {
  pending: {
    icon: Clock,
    label: "Order Placed",
    description: "Your order has been received",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  preparing: {
    icon: Flame,
    label: "Preparing",
    description: "Your food is being prepared",
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
  },
  ready: {
    icon: Bell,
    label: "Ready",
    description: "Your order is ready!",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
  },
  served: {
    icon: Check,
    label: "Served",
    description: "Your order has been served",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    description: "Thank you! Enjoy your meal!",
    color: "bg-green-600",
    textColor: "text-green-800",
    bgColor: "bg-green-100",
  },
  cancelled: {
    icon: CheckCircle2,
    label: "Cancelled",
    description: "Order has been cancelled",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
  },
};

export const OrderStatusBanner = ({
  status,
  orderId,
}: OrderStatusBannerProps) => {
  const config = statusConfig[status] || statusConfig.pending; // Fallback to pending if status not found
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-40 animate-slide-down",
        config.bgColor,
        "border-b shadow-sm"
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <div className={cn("p-2 rounded-full", config.color, "text-white")}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn("font-bold text-base", config.textColor)}>
                {config.label}
              </h3>
              {orderId && (
                <span className="text-xs text-muted-foreground">
                  #{orderId}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>

          {/* Status Progress Dots */}
          <div className="flex gap-2">
            {Object.keys(statusConfig).map((s, index) => (
              <div
                key={s}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  Object.keys(statusConfig).indexOf(status) >= index
                    ? config.color
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
