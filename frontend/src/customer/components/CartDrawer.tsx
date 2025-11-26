import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { formatCurrency } from "@/shared/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";

export const CartDrawer = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    updateInstructions,
    getCartTotal,
    getItemCount,
  } = useCart();
  const navigate = useNavigate();
  const itemCount = getItemCount();

  const handleCheckout = () => {
    navigate("/customer/checkout");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 sm:h-16 sm:w-16"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {itemCount}
              </Badge>
            )}
          </div>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-2xl flex flex-col"
      >
        <SheetHeader className="pb-4 flex-shrink-0">
          <SheetTitle className="text-2xl">Your Cart</SheetTitle>
          <SheetDescription>
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </SheetDescription>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground">
              Add some delicious items to get started!
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
              {cart.map((item) => (
                <div key={item.id} className="bg-card rounded-lg p-4 border">
                  <div className="flex gap-3 mb-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base leading-tight mb-1">
                        {item.name}
                      </h4>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant}
                        </p>
                      )}
                      {item.addOns && item.addOns.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          + {item.addOns.map((a) => a.name).join(", ")}
                        </p>
                      )}
                      <p className="text-primary font-bold mt-1">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <span className="font-bold text-lg">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <Label
                      htmlFor={`instructions-${item.id}`}
                      className="text-xs"
                    >
                      Special Instructions
                    </Label>
                    <Textarea
                      id={`instructions-${item.id}`}
                      placeholder="e.g., No onions, extra sauce"
                      value={item.instructions || ""}
                      onChange={(e) =>
                        updateInstructions(item.id, e.target.value)
                      }
                      className="mt-1 text-sm h-16 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary - Fixed at bottom */}
            <div className="border-t pt-4 pb-2 space-y-3 flex-shrink-0 bg-background">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Subtotal</span>
                <span className="font-bold text-primary text-xl">
                  {formatCurrency(getCartTotal())}
                </span>
              </div>
              <Button
                onClick={handleCheckout}
                size="lg"
                className="w-full h-14 text-base font-semibold"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
