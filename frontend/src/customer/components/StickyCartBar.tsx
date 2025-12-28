import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/shared/lib/utils";
import { useCart } from "../context/CartContext";
import { cn } from "@/shared/lib/utils";

export const StickyCartBar = () => {
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { cart, getCartTotal } = useCart();

    if (cart.length === 0) return null;

    const total = getCartTotal();
    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[100] pb-safe">
            <div
                onClick={() => navigate(`/${restaurantSlug}/customer/checkout`)}
                className={cn(
                    "relative overflow-hidden",
                    "bg-foreground text-background p-4 rounded-lg shadow-lg",
                    "flex items-center justify-between cursor-pointer",
                    "hover:bg-foreground/90 transition-colors",
                    "group"
                )}
            >
                <div className="flex flex-col relative z-10">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                        {itemCount} {itemCount === 1 ? 'Item' : 'Items'} Added
                    </span>
                    <span className="text-xl font-bold tracking-tight">
                        {formatCurrency(total)}
                    </span>
                </div>

                <div className="flex items-center gap-3 font-bold text-sm relative z-10 pr-1">
                    <span className="text-white/90">
                        View Cart
                    </span>
                    <div className="bg-white/10 p-2 rounded-full">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};
