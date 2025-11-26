import { MenuItem as MenuItemType } from '../services/menuService';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

interface RecommendationsProps {
  items: MenuItemType[];
}

export const Recommendations = ({ items }: RecommendationsProps) => {
  const { addToCart } = useCart();

  if (items.length === 0) return null;

  const handleQuickAdd = (item: MenuItemType) => {
    addToCart({
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      quantity: 1,
      image: item.image,
    });
    
    toast.success('Added to cart');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="text-xl font-bold">You May Also Like</h2>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-4 pb-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className="flex-shrink-0 w-48 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-32 bg-muted">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                  {item.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">
                    ${typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleQuickAdd(item)}
                    disabled={!item.inStock}
                    className="h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
