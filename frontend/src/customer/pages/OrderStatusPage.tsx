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
          <Button onClick={() => navigate("../menu")}>
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  const isOrderComplete = currentOrder.status === "delivered";

  const handleDownloadInvoice = () => {
    if (!currentOrder) return;
    
    // Create a printable invoice HTML for download as PDF
    const invoiceNumber = currentOrder.orderNumber || currentOrder.id;
    const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${invoiceNumber}</title>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 3px solid #000; padding: 40px; background: white; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 32px; margin-bottom: 10px; font-weight: bold; }
    .header h2 { font-size: 24px; margin-bottom: 5px; }
    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
    .invoice-details strong { display: block; margin-bottom: 5px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background-color: #f5f5f5; border: 2px solid #000; padding: 12px; text-align: left; font-weight: bold; font-size: 14px; }
    .items-table td { border: 2px solid #000; padding: 12px; font-size: 14px; }
    .items-table tr:nth-child(even) { background-color: #fafafa; }
    .totals { margin-left: auto; width: 350px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid #ddd; }
    .totals .total-row { font-size: 20px; font-weight: bold; border-top: 3px solid #000; border-bottom: 3px double #000; padding: 15px 10px; margin-top: 10px; background-color: #f5f5f5; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000; font-size: 14px; }
    @media print { body { padding: 20px; } .invoice-container { border: 2px solid #000; } }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>TAX INVOICE</h1>
      <h2>QuickServe Restaurant</h2>
      <p style="margin-top: 10px; font-size: 12px;">GST Number: [Restaurant GST]</p>
    </div>
    <div class="invoice-details">
      <div>
        <strong>Invoice Number:</strong> ${invoiceNumber}<br>
        <strong>Date:</strong> ${new Date(currentOrder.createdAt).toLocaleString('en-IN')}<br>
        <strong>Table Number:</strong> ${currentOrder.tableNumber || 'N/A'}
      </div>
      <div style="text-align: right;">
        <strong>Payment Method:</strong> Cash<br>
        <strong>Payment Status:</strong> Pending
      </div>
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%;">Item Description</th>
          <th style="width: 10%; text-align: center;">Qty</th>
          <th style="width: 20%; text-align: right;">Price</th>
          <th style="width: 20%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${currentOrder.items.map(item => `<tr>
          <td>${item.name}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
          <td style="text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="totals">
      <div><span>Subtotal:</span><span><strong>₹${currentOrder.subtotal.toFixed(2)}</strong></span></div>
      <div><span>CGST (4.5%):</span><span>₹${(currentOrder.tax / 2).toFixed(2)}</span></div>
      <div><span>SGST (4.5%):</span><span>₹${(currentOrder.tax / 2).toFixed(2)}</span></div>
      ${currentOrder.discount > 0 ? `<div style="color: green;"><span>Discount:</span><span>-₹${currentOrder.discount.toFixed(2)}</span></div>` : ''}
      <div class="total-row"><span>TOTAL AMOUNT:</span><span>₹${currentOrder.total.toFixed(2)}</span></div>
    </div>
    <div class="footer">
      <p><strong>Thank you for your order!</strong></p>
      <p style="font-size: 12px; color: #666; margin-top: 10px;">This is a computer generated invoice.</p>
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    // Open in new window for print to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const handlePrintInvoice = () => {
    if (!currentOrder) return;
    handleDownloadInvoice(); // Same as download - opens print dialog
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

          {/* Food Rating - Show only when order is delivered */}
          {showRating && currentOrder.status === "delivered" && (
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
