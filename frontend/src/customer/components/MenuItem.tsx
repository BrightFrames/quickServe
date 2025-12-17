import { useState } from "react";
import { Plus, Minus, Flame, Star } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { useCart } from "../context/CartContext";
import { MenuItem as MenuItemType } from "../services/menuService";
import { formatCurrency } from "@/shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Checkbox } from "@/shared/ui/checkbox";
import { toast } from "sonner";

interface MenuItemProps {
  item: MenuItemType;
}

export const MenuItem = ({ item }: MenuItemProps) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    item.variants?.[0]?.name || ""
  );
  const [selectedAddOns, setSelectedAddOns] = useState<
    { name: string; price: number }[]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getPrice = () => {
    const variantPrice =
      item.variants?.find((v) => v.name === selectedVariant)?.price ||
      item.price;
    const addOnsPrice = selectedAddOns.reduce(
      (sum, addOn) => sum + addOn.price,
      0
    );
    return variantPrice + addOnsPrice;
  };

  const handleAddToCart = () => {
    addToCart({
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      price: getPrice(),
      quantity,
      image: item.image,
      variant: selectedVariant || undefined,
      addOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
    });

    toast.success("Added to cart", {
      description: `${quantity}x ${item.name}`,
    });

    setIsDialogOpen(false);
    setQuantity(1);
    setSelectedAddOns([]);
  };

  const handleQuickAdd = () => {
    addToCart({
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    });

    toast.success("Added to cart");
  };

  const toggleAddOn = (addOn: { name: string; price: number }) => {
    setSelectedAddOns((prev) =>
      prev.find((a) => a.name === addOn.name)
        ? prev.filter((a) => a.name !== addOn.name)
        : [...prev, addOn]
    );
  };

  // Check if item is already in cart to show inline controls
  const { cart, updateQuantity, removeFromCart } = useCart();

  const cartItem = cart.find(
    (c) => c.name === item.name && c.variant === undefined && (!c.addOns || c.addOns.length === 0)
  );

  const handleInlineIncrement = () => {
    if (cartItem) {
      updateQuantity(cartItem.id, cartItem.quantity + 1);
    } else {
      handleQuickAdd();
    }
  };

  const handleInlineDecrement = () => {
    if (cartItem) {
      if (cartItem.quantity === 1) {
        removeFromCart(cartItem.id);
      } else {
        updateQuantity(cartItem.id, cartItem.quantity - 1);
      }
    }
  };

  const showInlineControls = !item.variants && (!item.addOns || item.addOns.length === 0) && item.inStock;

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-white rounded-xl mb-3">
      <div className="flex p-3 gap-3">
        {/* Left Side: Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start gap-2 mb-1">
              <span className={item.isVegetarian ? "text-green-600 text-xs mt-1" : "text-red-600 text-xs mt-1"}>
                {item.isVegetarian ? "🟢" : "🔴"}
              </span>
              <h3 className="font-bold text-gray-900 text-base leading-tight pr-2">
                {item.name}
              </h3>
            </div>

            <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-2">
              {item.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="font-bold text-gray-900">
              {formatCurrency(item.price)}
            </span>

            {/* Rating Pill (if applicable) */}
            {item.averageRating && (
              <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px] text-yellow-700 font-medium">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {Number(item.averageRating).toFixed(1)}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Image & Action */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-28 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {!item.inStock && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                <span className="text-xs font-bold text-gray-500 uppercase">Sold Out</span>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="-mt-6 relative z-10 w-24">
            {item.inStock ? (
              showInlineControls && cartItem ? (
                <div className="flex items-center justify-between bg-white border border-green-500 rounded-lg shadow-sm h-9 overflow-hidden">
                  <button
                    onClick={handleInlineDecrement}
                    className="w-8 h-full flex items-center justify-center text-green-600 hover:bg-green-50 active:bg-green-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-green-700">{cartItem.quantity}</span>
                  <button
                    onClick={handleInlineIncrement}
                    className="w-8 h-full flex items-center justify-center text-green-600 hover:bg-green-50 active:bg-green-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                item.variants || item.addOns ? (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full h-10 bg-white text-green-600 border border-gray-200 hover:bg-green-50 hover:border-green-200 font-bold text-sm shadow-sm">
                        ADD <Plus className="w-4 h-4 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{item.name}</DialogTitle>
                        <DialogDescription>
                          {item.description}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        {/* Variants */}
                        {item.variants && item.variants.length > 0 && (
                          <div>
                            <Label className="text-base font-semibold mb-3 block">
                              Choose Size
                            </Label>
                            <RadioGroup
                              value={selectedVariant}
                              onValueChange={setSelectedVariant}
                            >
                              {item.variants.map((variant) => (
                                <div
                                  key={variant.name}
                                  className="flex items-center space-x-3 mb-2"
                                >
                                  <RadioGroupItem
                                    value={variant.name}
                                    id={variant.name}
                                  />
                                  <Label
                                    htmlFor={variant.name}
                                    className="flex-1 cursor-pointer"
                                  >
                                    <span className="font-medium">
                                      {variant.name}
                                    </span>
                                    <span className="ml-auto text-primary font-semibold">
                                      {formatCurrency(variant.price)}
                                    </span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}

                        {/* Add-ons */}
                        {item.addOns && item.addOns.length > 0 && (
                          <div>
                            <Label className="text-base font-semibold mb-3 block">
                              Add-ons (Optional)
                            </Label>
                            <div className="space-y-2">
                              {item.addOns.map((addOn) => (
                                <div
                                  key={addOn.name}
                                  className="flex items-center space-x-3"
                                >
                                  <Checkbox
                                    id={addOn.name}
                                    checked={selectedAddOns.some(
                                      (a) => a.name === addOn.name
                                    )}
                                    onCheckedChange={() => toggleAddOn(addOn)}
                                  />
                                  <Label
                                    htmlFor={addOn.name}
                                    className="flex-1 cursor-pointer"
                                  >
                                    <span>{addOn.name}</span>
                                    <span className="ml-auto text-primary font-semibold">
                                      +{formatCurrency(addOn.price)}
                                    </span>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quantity */}
                        <div>
                          <Label className="text-base font-semibold mb-3 block">
                            Quantity
                          </Label>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                setQuantity(Math.max(1, quantity - 1))
                              }
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-lg font-semibold w-12 text-center">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setQuantity(quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="pt-4 border-t">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-semibold">Total</span>
                            <span className="text-2xl font-bold text-primary">
                              {formatCurrency(getPrice() * quantity)}
                            </span>
                          </div>
                          <Button
                            onClick={handleAddToCart}
                            className="w-full h-12 text-base"
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    onClick={handleQuickAdd}
                    className="w-full h-10 bg-white text-green-600 border border-gray-200 hover:bg-green-50 hover:border-green-200 font-bold text-sm shadow-sm"
                  >
                    ADD <Plus className="w-4 h-4 ml-1" />
                  </Button>
                )
              )
            ) : (
              <Button disabled className="w-full h-9 opacity-50 text-xs">Unavailable</Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
