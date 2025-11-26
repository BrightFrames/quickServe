import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "../context/CartContext";
import { useOrder } from "../hooks/useOrder";
import { paymentService } from "../services/paymentService";
import { toast } from "sonner";

export const UpiPaymentPage = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { placeOrder } = useOrder();
  const [paymentStatus, setPaymentStatus] = useState<
    "initiating" | "pending" | "success" | "failed"
  >("initiating");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [upiLink, setUpiLink] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    initiatePayment();
  }, []);

  const initiatePayment = async () => {
    try {
      // Get pending order data from session storage
      const pendingOrderData = sessionStorage.getItem("pendingOrder");
      if (!pendingOrderData) {
        toast.error("No order data found");
        navigate("/customer/checkout");
        return;
      }

      const orderData = JSON.parse(pendingOrderData);
      setPaymentStatus("initiating");

      // First, create the order with pending payment status
      const order = await placeOrder({
        ...orderData,
        paymentStatus: "pending",
      });

      setOrderId(order.id);

      // Initiate UPI payment
      const upiData = await paymentService.initiateUpiPayment(
        order.id,
        orderData.total
      );

      setUpiLink(upiData.upiLink);
      setPaymentStatus("pending");

      // Auto-open UPI app
      paymentService.openUpiApp(upiData.upiLink);

      toast.info("Complete payment in your UPI app", {
        description: "Click 'I've Paid' after completing payment",
        duration: 5000,
      });
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setPaymentStatus("failed");
      toast.error("Failed to initiate payment");
    }
  };

  const handlePaymentConfirmation = async () => {
    if (!orderId) return;

    try {
      setPaymentStatus("initiating");

      // Generate a transaction ID (in production, this would come from payment gateway)
      const transactionId = `TXN${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 9)
        .toUpperCase()}`;

      // Update payment status to paid (user confirmed payment)
      await paymentService.updatePaymentStatus(
        orderId,
        "upi",
        "paid",
        transactionId
      );

      setPaymentStatus("success");

      // Clear cart and session storage
      clearCart();
      sessionStorage.removeItem("pendingOrder");

      toast.success("Payment confirmed! Your order has been placed.");

      // Navigate to order status
      setTimeout(() => {
        navigate(`/customer/order-status?orderId=${orderId}`);
      }, 2000);
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      setPaymentStatus("pending");
      toast.error("Unable to confirm payment. Please try again.");
    }
  };

  const handleCancelPayment = () => {
    // Don't place order, just go back
    sessionStorage.removeItem("pendingOrder");
    toast.info("Payment cancelled");
    navigate("/customer/checkout");
  };

  const handleRetryPayment = () => {
    if (upiLink) {
      paymentService.openUpiApp(upiLink);
      toast.info("Redirecting to UPI app...");
    } else {
      initiatePayment();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center space-y-6">
          {/* Status Icon */}
          {paymentStatus === "initiating" && (
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
          )}
          {paymentStatus === "pending" && (
            <div className="flex justify-center">
              <Smartphone className="w-16 h-16 text-blue-600" />
            </div>
          )}
          {paymentStatus === "success" && (
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
          )}
          {paymentStatus === "failed" && (
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
          )}

          {/* Status Message */}
          <div>
            {paymentStatus === "initiating" && (
              <>
                <h2 className="text-2xl font-bold mb-2">
                  Initiating Payment...
                </h2>
                <p className="text-muted-foreground">
                  Please wait while we set up your payment
                </p>
              </>
            )}
            {paymentStatus === "pending" && (
              <>
                <h2 className="text-2xl font-bold mb-2">
                  Complete UPI Payment
                </h2>
                <p className="text-muted-foreground mb-4">
                  Open your UPI app to complete the payment
                </p>
                {retryCount > 0 && (
                  <p className="text-sm text-amber-600">
                    Verification attempt: {retryCount}
                  </p>
                )}
              </>
            )}
            {paymentStatus === "success" && (
              <>
                <h2 className="text-2xl font-bold mb-2 text-green-600">
                  Payment Successful!
                </h2>
                <p className="text-muted-foreground">
                  Your order has been placed successfully
                </p>
              </>
            )}
            {paymentStatus === "failed" && (
              <>
                <h2 className="text-2xl font-bold mb-2 text-red-600">
                  Payment Failed
                </h2>
                <p className="text-muted-foreground">
                  Unable to process your payment. Please try again.
                </p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {paymentStatus === "pending" && (
              <>
                <Button
                  onClick={handlePaymentConfirmation}
                  size="lg"
                  className="w-full"
                >
                  I've Completed Payment
                </Button>
                <Button
                  onClick={handleRetryPayment}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Open UPI App Again
                </Button>
                <Button
                  onClick={handleCancelPayment}
                  variant="ghost"
                  size="lg"
                  className="w-full"
                >
                  Cancel Payment
                </Button>
              </>
            )}

            {paymentStatus === "failed" && (
              <>
                <Button onClick={initiatePayment} size="lg" className="w-full">
                  Retry Payment
                </Button>
                <Button
                  onClick={handleCancelPayment}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Go Back
                </Button>
              </>
            )}

            {paymentStatus === "success" && (
              <Button
                onClick={() =>
                  navigate(`/customer/order-status?orderId=${orderId}`)
                }
                size="lg"
                className="w-full"
              >
                View Order Status
              </Button>
            )}
          </div>

          {/* Help Text */}
          {paymentStatus === "pending" && (
            <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
              <p className="font-semibold">Payment Instructions:</p>
              <ol className="text-left space-y-1 pl-4">
                <li>1. Open your UPI app (GPay, PhonePe, Paytm, etc.)</li>
                <li>2. Complete the payment</li>
                <li>3. Return here and click "I've Completed Payment"</li>
              </ol>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
