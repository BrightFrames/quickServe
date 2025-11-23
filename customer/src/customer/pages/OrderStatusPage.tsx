import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useOrder } from "../hooks/useOrder";
import { OrderStatusBanner } from "../components/OrderStatusBanner";
import { OrderTrackingProgress } from "../components/OrderTrackingProgress";
import { FoodRating } from "../components/FoodRating";
import { io, Socket } from "socket.io-client";

export const OrderStatusPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { currentOrder, getOrderStatus } = useOrder();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showRating, setShowRating] = useState(false);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const apiUrl =
      import.meta.env.VITE_API_URL || "https://project0-f2hv.onrender.com";
    const newSocket = io(apiUrl, {
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Listen for order status updates via WebSocket
  useEffect(() => {
    if (!socket || !orderId) return;

    console.log("[OrderStatus] Listening for order updates:", orderId);

    // Listen for order update events
    socket.on("order-updated", (updatedOrder) => {
      console.log("[OrderStatus] Order updated:", updatedOrder);
      if (updatedOrder._id === orderId || updatedOrder.id === orderId) {
        // Refresh order status
        getOrderStatus(orderId);
      }
    });

    return () => {
      socket.off("order-updated");
    };
  }, [socket, orderId]);

  // Fetch initial order status
  useEffect(() => {
    if (orderId) {
      getOrderStatus(orderId);
    }
  }, [orderId]);

  // Show rating form when order is delivered
  useEffect(() => {
    if (currentOrder?.status === "delivered") {
      // Delay showing rating to give user time to see completion
      setTimeout(() => setShowRating(true), 2000);
    }
  }, [currentOrder?.status]);

  if (!orderId || !currentOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <Button onClick={() => navigate("/customer/menu")}>
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  const isOrderComplete = currentOrder.status === "delivered";

  return (
    <div className="min-h-screen bg-background">
      {/* Status Banner */}
      <OrderStatusBanner
        status={currentOrder.status}
        orderId={currentOrder.id}
      />

      {/* Content */}
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        <div className="space-y-6 animate-fade-in">
          {/* Success Message */}
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg mb-1">
              Order #{currentOrder.id}
            </p>
          </Card>

          {/* Order Tracking Progress */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Track Your Order</h2>
            <OrderTrackingProgress
              currentStatus={currentOrder.status}
              orderNumber={currentOrder.id}
            />
          </Card>

          {/* Food Rating - Show only when order is delivered */}
          {showRating && currentOrder.status === "delivered" && (
            <FoodRating
              orderId={currentOrder.id}
              orderNumber={currentOrder.id}
              onRatingSubmitted={() => {
                console.log("Rating submitted successfully");
              }}
            />
          )}

          {/* Order Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            {currentOrder.items.length > 0 ? (
              <div className="space-y-3">
                {currentOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Order details will appear here
              </p>
            )}
          </Card>

          {/* Payment Details */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Payment Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(currentOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(currentOrder.tax)}</span>
              </div>
              {currentOrder.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(currentOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrency(currentOrder.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            {isOrderComplete && (
              <Button
                onClick={() =>
                  navigate(`/customer/feedback?orderId=${currentOrder.id}`)
                }
                size="lg"
                variant="outline"
                className="w-full h-14 text-base"
              >
                Rate Your Experience
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            )}
            <Button
              onClick={() => navigate("/customer/menu")}
              size="lg"
              className="w-full h-14 text-base"
            >
              Order More Items
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
