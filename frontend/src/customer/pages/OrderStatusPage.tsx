import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, Download, Printer } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { formatCurrency } from "@/shared/lib/utils";
import { useOrder } from "../hooks/useOrder";
import { useCart } from "../context/CartContext";
import { OrderTrackingProgress } from "../components/OrderTrackingProgress";
import { FoodRating } from "../components/FoodRating";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export const OrderStatusPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { currentOrder, getOrderStatus } = useOrder();
  const { tableNumber } = useCart();
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
    } catch (error: any) {
      toast.dismiss();
      console.error('[INVOICE] Download error:', error);
      toast.error(`Failed to download invoice: ${error.message || 'Unknown error'}`);
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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Condensed Header Status */}
      <div className="bg-white border-b sticky top-0 z-40 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${currentOrder.status === 'completed' || currentOrder.status === 'served' ? 'bg-green-500' :
            currentOrder.status === 'cancelled' ? 'bg-red-500' : 'bg-primary'
            }`} />
          <span className="font-bold text-sm text-gray-700 capitalize">
            {currentOrder.status === 'pending' ? 'Order Placed' : currentOrder.status}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-400">#{currentOrder.orderNumber || currentOrder.id?.slice(-4)}</span>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <div className="space-y-6 animate-fade-in">

          {/* Hero Card */}
          <Card className="border-0 shadow-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            <div className="p-8 text-center relative z-10">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white shadow-md flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center animate-in zoom-in duration-500">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
              <p className="text-gray-500 text-sm">
                Sit back & relax! Your food is on its way.
              </p>
            </div>
          </Card>

          {/* Track Order */}
          <Card className="p-6 border-0 shadow-md bg-white">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Live Status</h2>
            <OrderTrackingProgress
              currentStatus={currentOrder.status}
              orderNumber={currentOrder.id}
            />
          </Card>

          {/* Food Rating */}
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Order Details
            </h2>
            {currentOrder.items.length > 0 ? (
              <div className="space-y-3">
                {currentOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-medium text-gray-600">
                        {item.quantity}x
                      </span>
                      <span className="text-gray-700 font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-dashed border-gray-200 my-4 pt-4">
                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <span>Total Paid</span>
                    <span>{formatCurrency(currentOrder.total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Order details will appear here</p>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownloadInvoice}
              variant="outline"
              className="h-12 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Download className="mr-2 w-4 h-4" />
              Download
            </Button>
            <Button
              onClick={handlePrintInvoice}
              variant="outline"
              className="h-12 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Printer className="mr-2 w-4 h-4" />
              Print Bill
            </Button>
          </div>

          {isOrderComplete && (
            <Button
              onClick={() => navigate(`../feedback?orderId=${currentOrder.id}`)}
              variant="ghost"
              className="w-full text-primary hover:text-primary/80"
            >
              Rate Your Experience <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          )}

        </div>
      </div>

      {/* Sticky Primary Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-30">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={() => {
              const targetTable = (currentOrder?.tableNumber || tableNumber || "t1").toString();
              navigate(`../menu/table/${targetTable}`);
            }}
            size="lg"
            className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            Order More Items
          </Button>
        </div>
      </div>

    </div>
  );
};
