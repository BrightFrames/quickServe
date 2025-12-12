import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Mail } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { formatCurrency } from "@/shared/lib/utils";
import { useCart } from "../context/CartContext";
import { useOrder } from "../hooks/useOrder";
import { PaymentMethodSelector } from "../components/PaymentMethodSelector";
import { paymentService } from "../services/paymentService";
import { toast } from "sonner";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart, tableNumber } = useCart();
  const { placeOrder, loading } = useOrder();
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "upi" | null
  >(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(5.0);
  const [loadingTax, setLoadingTax] = useState(true);

  const subtotal = getCartTotal();
  const tax = (subtotal * taxPercentage) / 100;
  const total = subtotal + tax;

  // Fetch restaurant tax percentage on mount
  useEffect(() => {
    const fetchTaxRate = async () => {
      try {
        const savedData = localStorage.getItem("customer_restaurant_data");
        console.log("[TAX] Saved data:", savedData);
        
        if (savedData) {
          const data = JSON.parse(savedData);
          const slug = data.restaurantSlug;
          const cachedRestaurantId = data.restaurantId; // CORE FIX: Check for cached restaurantId
          
          console.log("[TAX] Restaurant slug:", slug, "restaurantId:", cachedRestaurantId);
          
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          
          // CORE FIX: Use restaurantId if available, otherwise use slug
          const identifier = cachedRestaurantId || slug;
          const url = `${apiUrl}/api/restaurant/info/${identifier}`;
          
          console.log("[TAX] Fetching from:", url);
          
          const response = await fetch(url);
          console.log("[TAX] Response status:", response.status);
          
          if (response.ok) {
            const restaurantInfo = await response.json();
            console.log("[TAX] Restaurant info:", restaurantInfo);
            console.log("[TAX] Tax percentage from API:", restaurantInfo.taxPercentage);
            
            // CORE FIX: Cache restaurantId if we received it and don't have it yet
            if (restaurantInfo.id && !cachedRestaurantId) {
              const updatedData = { ...data, restaurantId: restaurantInfo.id };
              localStorage.setItem("customer_restaurant_data", JSON.stringify(updatedData));
              console.log("[TAX] Cached restaurantId:", restaurantInfo.id);
            }
            
            const taxValue = parseFloat(restaurantInfo.taxPercentage) || 5.0;
            console.log("[TAX] Setting tax to:", taxValue);
            setTaxPercentage(taxValue);
          } else {
            console.error("[TAX] Failed to fetch, status:", response.status);
          }
        } else {
          console.warn("[TAX] No restaurant data in localStorage");
        }
      } catch (error) {
        console.error("[TAX] Error fetching tax rate:", error);
        // Keep default 5%
      } finally {
        setLoadingTax(false);
        console.log("[TAX] Final tax percentage:", taxPercentage);
      }
    };

    fetchTaxRate();
  }, []);

  const handlePlaceOrder = async () => {
    // Validate payment method selection
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Validate email format if provided
    if (email && !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setProcessingPayment(true);

      const orderData = {
        items: cart,
        subtotal,
        tax,
        discount: 0,
        total,
        tableNumber,
        customerEmail: email,
        paymentMethod,
        // Mark UPI orders as pending payment
        paymentStatus: paymentMethod === "upi" ? "pending" : undefined,
      };

      // Handle different payment methods
      if (paymentMethod === "cash") {
        // Place order immediately for cash payment
        const order = await placeOrder(orderData);

        // Update payment status to pending (will pay at counter)
        await paymentService.updatePaymentStatus(order.id, "cash", "pending");

        clearCart();
        toast.success("Order placed! Pay at the counter");
        navigate(`../order-status?orderId=${order.id}`);
      } else if (paymentMethod === "card") {
        // Place order immediately for card payment
        const order = await placeOrder(orderData);

        // Update payment status to pending (will pay at counter)
        await paymentService.updatePaymentStatus(order.id, "card", "pending");

        clearCart();
        toast.success("Order placed! Pay with card at the counter");
        navigate(`../order-status?orderId=${order.id}`);
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
      navigate(`../order-status?orderId=${order.id}`);
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
          <Button onClick={() => navigate("../menu")}>View Menu</Button>
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
            onClick={() => navigate("../menu")}
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

        {/* Email for Invoice */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Email (Optional)</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Enter your email for loyalty benefits</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
            />
            <p className="text-sm text-muted-foreground">
              🎁 Get exclusive offers, rewards, and your invoice via email
            </p>
          </div>
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
              <span className="text-muted-foreground">
                Tax ({loadingTax ? '...' : `${taxPercentage.toFixed(1)}%`})
              </span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
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
            : paymentMethod === "cash"
            ? "Place Order - Cash on Delivery"
            : paymentMethod === "card"
            ? "Place Order - Pay by Card"
            : "Select Payment Method"}
        </Button>
      </div>
    </div>
  );
};
