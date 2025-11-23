import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "../context/CartContext";
import { useOrder } from "../hooks/useOrder";
import { PaymentMethodSelector } from "../components/PaymentMethodSelector";
import { paymentService } from "../services/paymentService";
import { toast } from "sonner";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, setSplitBill, clearCart } = useCart();
  const { placeOrder, loading } = useOrder();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "upi" | null
  >(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const subtotal = getCartTotal();
  const tax = subtotal * 0.09; // 9% tax
  const total = subtotal + tax - discount;
  const splitAmount = splitEnabled ? total / splitCount : total;

  const tableNumber = localStorage.getItem("tableNumber") || undefined;

  const handleApplyPromo = () => {
    // Mock promo validation
    const promoCodes: Record<string, number> = {
      WELCOME10: 10,
      SAVE20: 20,
    };

    const discountPercent = promoCodes[promoCode.toUpperCase()];
    if (discountPercent) {
      const discountAmount = (subtotal * discountPercent) / 100;
      setDiscount(discountAmount);
      toast.success(`${discountPercent}% discount applied!`);
    } else {
      toast.error("Invalid promo code");
    }
  };

  const handlePlaceOrder = async () => {
    // Validate payment method selection
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      setProcessingPayment(true);

      const orderData = {
        items: cart,
        subtotal,
        tax,
        discount,
        total,
        tableNumber,
        splitBill: splitEnabled,
        splitCount: splitEnabled ? splitCount : undefined,
        promoCode: promoCode || undefined,
        paymentMethod,
        // Mark UPI orders as pending payment
        paymentStatus: paymentMethod === "upi" ? "pending" : undefined,
      };

      setSplitBill(splitEnabled, splitEnabled ? splitCount : undefined);

      // Handle different payment methods
      if (paymentMethod === "upi") {
        // For UPI: Don't place order yet, just initiate payment
        // We'll create a temporary order reference

        toast.info("Redirecting to UPI payment...", {
          description: "Complete payment to place your order",
          duration: 3000,
        });

        // Store order data temporarily
        sessionStorage.setItem("pendingOrder", JSON.stringify(orderData));

        // Navigate to UPI payment page
        navigate("/customer/upi-payment");
      } else if (paymentMethod === "cash") {
        // Place order immediately for cash payment
        const order = await placeOrder(orderData);

        // Update payment status to pending (will pay at counter)
        await paymentService.updatePaymentStatus(order.id, "cash", "pending");

        clearCart();
        toast.success("Order placed! Pay at the counter");
        navigate(`/customer/order-status?orderId=${order.id}`);
      } else if (paymentMethod === "card") {
        // Place order immediately for card payment
        const order = await placeOrder(orderData);

        // Update payment status to pending (will pay at counter)
        await paymentService.updatePaymentStatus(order.id, "card", "pending");

        clearCart();
        toast.success("Order placed! Pay with card at the counter");
        navigate(`/customer/order-status?orderId=${order.id}`);
      }
    } catch (error) {
      console.error("Order placement failed:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  /* WhatsApp modal handler - Currently disabled
  const handleWhatsAppSubmit = async (phoneNumber: string) => {
    try {
      setWhatsAppNumber(phoneNumber);
      setSplitBill(splitEnabled, splitEnabled ? splitCount : undefined);

      const order = await placeOrder({
        ...pendingOrder,
        whatsappNumber: phoneNumber,
      });

      clearCart();
      setShowWhatsAppModal(false);
      
      toast.success('Order placed successfully!');
      navigate(`/customer/order-status?orderId=${order.id}`);
    } catch (error) {
      console.error('Order placement failed:', error);
      toast.error('Failed to place order. Please try again.');
      setShowWhatsAppModal(false);
    }
  };
  */

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="text-muted-foreground">Add some items to get started</p>
          <Button onClick={() => navigate("/customer/menu")}>View Menu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customer/menu")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Order Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.name}
                  {item.variant && ` (${item.variant})`}
                </span>
                <span className="font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Promo Code */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Promo Code</h2>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="h-12"
            />
            <Button
              onClick={handleApplyPromo}
              variant="outline"
              className="h-12"
            >
              Apply
            </Button>
          </div>
          {discount > 0 && (
            <p className="text-sm text-success mt-2">
              Discount applied: -{formatCurrency(discount)}
            </p>
          )}
        </Card>

        {/* Split Bill */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <Label
                htmlFor="split-bill"
                className="text-lg font-bold cursor-pointer"
              >
                Split Bill
              </Label>
            </div>
            <Switch
              id="split-bill"
              checked={splitEnabled}
              onCheckedChange={(checked) => {
                setSplitEnabled(checked);
                setSplitBill(checked, checked ? splitCount : undefined);
              }}
            />
          </div>
          {splitEnabled && (
            <div className="space-y-2">
              <Label htmlFor="split-count">Number of People</Label>
              <Input
                id="split-count"
                type="number"
                min="2"
                max="10"
                value={splitCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 2;
                  setSplitCount(count);
                  setSplitBill(true, count);
                }}
                className="h-12"
              />
              <p className="text-sm text-muted-foreground">
                {formatCurrency(splitAmount)} per person
              </p>
            </div>
          )}
        </Card>

        {/* Payment Summary */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Payment Details</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (9%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            {splitEnabled && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Per Person ({splitCount} people)</span>
                <span>{formatCurrency(splitAmount)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Payment Method Selection */}
        <Card className="p-6">
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onSelect={setPaymentMethod}
          />
        </Card>

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          size="lg"
          className="w-full h-14 text-base"
          disabled={loading || processingPayment || !paymentMethod}
        >
          {processingPayment
            ? "Processing..."
            : paymentMethod === "upi"
            ? "Proceed to UPI Payment"
            : paymentMethod === "cash"
            ? "Place Order - Pay Cash"
            : paymentMethod === "card"
            ? "Place Order - Pay by Card"
            : "Select Payment Method"}
        </Button>
      </div>
    </div>
  );
};
