import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, Download, Printer } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { formatCurrency } from "@/shared/lib/utils";
import { useOrder } from "../hooks/useOrder";
import { OrderStatusBanner } from "../components/OrderStatusBanner";
import { OrderTrackingProgress } from "../components/OrderTrackingProgress";
import { FoodRating } from "../components/FoodRating";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export const OrderStatusPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { currentOrder, getOrderStatus } = useOrder();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showRating, setShowRating] = useState(false);

  // Restore order ID from localStorage if missing in URL
  useEffect(() => {
    if (!orderId) {
      const savedOrderId = localStorage.getItem('currentOrderId');
      if (savedOrderId) {
        console.log('[OrderStatus] Restoring order ID from localStorage:', savedOrderId);
        navigate(`?orderId=${savedOrderId}`, { replace: true });
      }
    }
  }, [orderId, navigate]);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    if (!orderId || !currentOrder?.restaurantId) {
      console.log("[OrderStatus] Waiting for order data before connecting socket");
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const newSocket = io(apiUrl, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("[OrderStatus] Socket connected:", newSocket.id);
      
      // Join restaurant-specific room to receive order updates
      const restaurantId = currentOrder.restaurantId;
      newSocket.emit("join-restaurant", restaurantId);
      console.log("[OrderStatus] Joined restaurant room:", restaurantId);
      
      // Join order-specific room for real-time updates
      newSocket.emit("join-order", orderId);
      console.log("[OrderStatus] Joined order room:", orderId);
    });

    newSocket.on("disconnect", () => {
      console.log("[OrderStatus] Socket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("[OrderStatus] Socket connection error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [orderId, currentOrder?.restaurantId]);

  // Listen for order status updates via WebSocket
  useEffect(() => {
    if (!socket || !orderId) return;

    console.log("[OrderStatus] Listening for order updates:", orderId);

    // Listen for order update events
    socket.on("order-updated", (updatedOrder) => {
      console.log("[OrderStatus] Order updated:", updatedOrder);
      if (updatedOrder._id === orderId || updatedOrder.id === orderId || String(updatedOrder.id) === orderId) {
        // Refresh order status
        console.log("[OrderStatus] Order ID matched, refreshing order status");
        getOrderStatus(orderId);
      }
    });

    return () => {
      socket.off("order-updated");
    };
  }, [socket, orderId, getOrderStatus]);

  // Polling fallback: Check order status every 15 seconds
  useEffect(() => {
    if (!orderId) return;

    const pollingInterval = setInterval(() => {
      console.log("[OrderStatus] Polling for order updates...");
      getOrderStatus(orderId);
    }, 15000); // Poll every 15 seconds

    return () => {
      clearInterval(pollingInterval);
    };
  }, [orderId, getOrderStatus]);

  // Fetch initial order status
  useEffect(() => {
    if (orderId) {
      getOrderStatus(orderId);
    }
  }, [orderId]);

  // Show rating form when order is completed or served
  useEffect(() => {
    if (currentOrder?.status === "completed" || currentOrder?.status === "served") {
      // Delay showing rating to give user time to see completion
      setTimeout(() => setShowRating(true), 2000);
    }
  }, [currentOrder?.status]);

  if (!orderId || !currentOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <Button onClick={() => navigate("../menu")}>
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  const isOrderComplete = currentOrder.status === "completed" || currentOrder.status === "served";

  const handleDownloadInvoice = async () => {
    if (!currentOrder) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const orderId = currentOrder.id || currentOrder._id;
      const invoiceNumber = currentOrder.orderNumber || orderId;
      
      if (!orderId) {
        toast.error('Order ID not found. Please try again.');
        console.error('[INVOICE] No order ID found:', currentOrder);
        return;
      }
      
      const url = `${apiUrl}/api/orders/${orderId}/invoice/pdf`;
      
      console.log('[INVOICE] Downloading from:', url);
      toast.loading('Generating invoice PDF...');
      
      // Call backend API to generate and download PDF
      const response = await fetch(url, {
        method: 'GET',
      });
      
      console.log('[INVOICE] Response status:', response.status);
      console.log('[INVOICE] Response headers:', response.headers.get('content-type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[INVOICE] Error response:', errorText);
        throw new Error(`Failed to download invoice: ${response.status}`);
      }
      
      // Get PDF blob
      const blob = await response.blob();
      console.log('[INVOICE] Blob size:', blob.size, 'bytes');
      console.log('[INVOICE] Blob type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice-${invoiceNumber}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      toast.dismiss();
      toast.success('Invoice downloaded successfully!');
      console.log('[INVOICE] PDF downloaded successfully');
    } catch (error) {
      toast.dismiss();
      console.error('[INVOICE] Download error:', error);
      toast.error(`Failed to download invoice: ${error.message}`);
    }
  };

  const handlePrintInvoice = async () => {
    if (!currentOrder) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const orderId = currentOrder.id || currentOrder._id;
      
      if (!orderId) {
        toast.error('Order ID not found. Please try again.');
        console.error('[INVOICE] No order ID found:', currentOrder);
        return;
      }
      
      // Open PDF in new tab for printing
      const url = `${apiUrl}/api/orders/${orderId}/invoice/pdf`;
      window.open(url, '_blank');
      
      console.log('[INVOICE] PDF opened for printing');
    } catch (error) {
      console.error('[INVOICE] Print error:', error);
      toast.error('Failed to open invoice. Please try again.');
    }
  };

  if (!orderId || !currentOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <Button onClick={() => navigate("../menu")}>
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

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
              Order #{currentOrder.orderNumber || currentOrder.id}
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

          {/* Food Rating - Show only when order is completed or served */}
          {showRating && (currentOrder.status === "completed" || currentOrder.status === "served") && (
            <FoodRating
              orderId={currentOrder.id || ""}
              orderNumber={currentOrder.orderNumber || currentOrder.id || ""}
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
            {/* Print Invoice Button - Primary action */}
            <Button
              onClick={handlePrintInvoice}
              size="lg"
              variant="default"
              className="w-full h-14 text-base"
            >
              <Printer className="mr-2 w-5 h-5" />
              Print Bill
            </Button>

            {/* Download Invoice Button */}
            <Button
              onClick={handleDownloadInvoice}
              size="lg"
              variant="outline"
              className="w-full h-14 text-base"
            >
              <Download className="mr-2 w-5 h-5" />
              Download Invoice
            </Button>

            {isOrderComplete && (
              <Button
                onClick={() =>
                  navigate(`../feedback?orderId=${currentOrder.id}`)
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
              onClick={() => navigate("../menu")}
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
