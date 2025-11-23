import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { MenuList } from "../components/MenuList";
import { CartDrawer } from "../components/CartDrawer";
import { Recommendations } from "../components/Recommendations";
import { Skeleton } from "@/components/ui/skeleton";

// Predefined categories (same as admin)
const MENU_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Appetizers",
  "Main Course",
  "Desserts",
  "Beverages",
  "Drinks",
  "Soups",
  "Salads",
  "Pizza",
  "Burgers",
  "Pasta",
  "Rice & Biryani",
  "Chinese",
  "Indian",
  "Continental",
  "Fast Food",
  "Healthy Options",
  "Vegan",
  "Sides",
  "Combos",
  "Other",
] as const;

export const MenuPage = () => {
  const navigate = useNavigate();
  const { menu, loading, error, getRecommendations } = useMenu();
  const recommendations = getRecommendations();
  const [tableId, setTableId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    window.scrollTo(0, 0);
    // Read table id from localStorage or URL (for direct links with ?table=)
    try {
      const params = new URLSearchParams(window.location.search);
      const t =
        params.get("table") ||
        localStorage.getItem("tableId") ||
        localStorage.getItem("tableNumber");
      if (t) setTableId(t);
    } catch (e) {
      const t =
        localStorage.getItem("tableId") || localStorage.getItem("tableNumber");
      if (t) setTableId(t);
    }
  }, []);

  // Filter menu by category
  const filteredMenu =
    selectedCategory === "all"
      ? menu
      : menu
          .map((category) => ({
            ...category,
            items: category.items.filter(
              (item) => item.category === selectedCategory
            ),
          }))
          .filter((category) => category.items.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">
            Error Loading Menu
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customer")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Our Menu</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Choose from our delicious selection
              {tableId && (
                <span className="ml-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Table {tableId.toString().replace(/[^0-9]/g, "") || tableId}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Category Filter */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <label className="block text-sm font-medium text-foreground mb-3">
            Filter by Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
          >
            <option value="all">All Categories</option>
            {MENU_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <MenuList menu={filteredMenu} />

        {recommendations.length > 0 && (
          <Recommendations items={recommendations} />
        )}
      </div>

      {/* Floating Cart Button */}
      <CartDrawer />
    </div>
  );
};
