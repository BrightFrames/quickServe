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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex gap-4 p-4">
        {/* Item Image */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {!item.inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              {/* Veg/Non-Veg Dot Indicator */}
              <span
                className={`text-xl ${
                  item.isVegetarian ? "text-green-600" : "text-red-600"
                }`}
              >
                ●
              </span>
              <h3 className="font-semibold text-base sm:text-lg leading-tight">
                {item.name}
              </h3>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {item.spicyLevel && item.spicyLevel > 0 && (
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200"
                >
                  <Flame className="w-3 h-3" />
                </Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {item.description}
          </p>

          {/* Rating Display */}
          {item.averageRating && item.totalRatings > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(item.averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {item.averageRating.toFixed(1)} ({item.totalRatings}{" "}
                {item.totalRatings === 1 ? "rating" : "ratings"})
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-bold text-primary text-lg">
              {formatCurrency(item.price)}
            </span>

            {item.inStock && (
              <div className="flex gap-2">
                {item.variants || item.addOns ? (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-9">
                        <Plus className="w-4 h-4 mr-1" />
                        Customize
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
                  <Button size="sm" onClick={handleQuickAdd} className="h-9">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
