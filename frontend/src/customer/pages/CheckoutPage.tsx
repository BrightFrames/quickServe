import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
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
        tableNumber: tableNumber || undefined,
        customerEmail: email,
        paymentMethod,
        // Mark UPI orders as pending payment
        paymentStatus: paymentMethod === "upi" ? "pending" as const : undefined,
      };

      // Handle different payment methods
      if (paymentMethod === "cash") {
        // Place order immediately for cash payment
        const order = await placeOrder(orderData);

        // Update payment status to pending (will pay at counter)
        if (order && order.id) {
          await paymentService.updatePaymentStatus(order.id, "cash", "pending");
          navigate(`../order-status?orderId=${order.id}`);
        }

        clearCart();
        toast.success("Order placed! Pay at the counter");
      } else if (paymentMethod === "card") {
        // Place order immediately for card payment
        const order = await placeOrder(orderData);

        // Update payment status to pending (will pay at counter)
        if (order && order.id) {
          await paymentService.updatePaymentStatus(order.id, "card", "pending");
          navigate(`../order-status?orderId=${order.id}`);
        }

        clearCart();
        toast.success("Order placed! Pay with card at the counter");
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

  const [showEmail, setShowEmail] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your cart matches your hunger... empty!</h2>
          <Button onClick={() => navigate(`../menu/table/${tableNumber || 't1'}`)} className="rounded-full px-8">Browse Menu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Simple Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`../menu/table/${tableNumber || 't1'}`)}
          className="rounded-full -ml-2 hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Button>
        <span className="font-bold text-lg text-gray-900">Checkout</span>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Order Items */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Your Order</h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {cart.map((item) => (
              <div key={item.id} className="p-4 flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900 line-clamp-1">{item.name}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  {item.variant && <span className="text-xs text-gray-500">{item.variant}</span>}
                  <span className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Invoice Email Toggle */}
        <section>
          <button
            onClick={() => setShowEmail(!showEmail)}
            className="flex items-center gap-2 text-sm text-blue-600 font-medium w-full p-2"
          >
            <Mail className="w-4 h-4" />
            {showEmail ? "Minimize Invoice Details" : "Add Email for Invoice (Optional)"}
          </button>

          {showEmail && (
            <div className="bg-white rounded-xl p-4 shadow-sm mt-2 border border-gray-100">
              <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-11 bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          )}
        </section>

        {/* Bill Details */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Bill Details</h3>
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3 border border-gray-100">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Item Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Taxes & Charges ({loadingTax ? '...' : `${taxPercentage.toFixed(1)}%`})</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <Separator className="bg-gray-100" />
            <div className="flex justify-between text-lg font-black text-gray-900 pt-1">
              <span>To Pay</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Method</h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
            />
          </div>
        </section>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-xl z-20">
        <div className="max-w-lg mx-auto flex gap-4 items-center">
          <div className="flex-1">
            <span className="block text-xs text-gray-500 font-medium">TOTAL</span>
            <span className="block text-xl font-black text-gray-900">{formatCurrency(total)}</span>
          </div>
          <Button
            onClick={handlePlaceOrder}
            size="lg"
            className="flex-[2] h-12 rounded-xl text-base font-bold"
            disabled={loading || processingPayment || !paymentMethod}
          >
            {processingPayment ? "Placing Order..." : "Place Order"}
            {!processingPayment && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
