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
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div
                onClick={() => navigate(`/${restaurantSlug}/customer/checkout`)}
                className={cn(
                    "relative overflow-hidden",
                    "bg-black/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl",
                    "border border-white/10",
                    "flex items-center justify-between cursor-pointer",
                    "active:scale-[0.98] transition-all duration-200",
                    "group"
                )}
            >
                {/* Subtle Gradient Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex flex-col relative z-10">
                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-tight">
                        {itemCount} {itemCount === 1 ? 'Item' : 'Items'} Added
                    </span>
                    <span className="text-xl font-bold font-heading tracking-tight">
                        {formatCurrency(total)}
                    </span>
                </div>

                <div className="flex items-center gap-3 font-bold text-sm relative z-10 pr-1">
                    <span className="text-white/90 group-hover:text-white transition-colors">
                        View Cart
                    </span>
                    <div className="bg-white/20 p-2 rounded-full group-hover:bg-primary group-hover:text-black transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};
