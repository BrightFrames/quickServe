import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { MenuList } from "../components/MenuList";
import { CartDrawer } from "../components/CartDrawer";
import { Recommendations } from "../components/Recommendations";
import { Skeleton } from "@/shared/ui/skeleton";
import { useCart } from "../context/CartContext";

// Predefined categories (same as admin)
const MENU_CATEGORIES = [
  "Chinese",
  "Beverages",
  "Main Course",
  "Snacks",
  "Restaurant Special",
] as const;

export const MenuPage = () => {
  const navigate = useNavigate();
  const { tableNumber: urlTableNumber } = useParams<{ tableNumber: string }>();
  const { menu, loading, error, getRecommendations } = useMenu();
  const { tableNumber, setTableNumber } = useCart();
  const recommendations = getRecommendations();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hasCheckedTable, setHasCheckedTable] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Only check once
    if (hasCheckedTable) return;
    
    // Check if in captain mode
    const captainTable = sessionStorage.getItem('captainTableNumber');
    if (captainTable) {
      setTableNumber(captainTable);
      setHasCheckedTable(true);
      return;
    }
    
    // Priority: URL params > query params > default to t1
    if (urlTableNumber) {
      setTableNumber(urlTableNumber);
      setHasCheckedTable(true);
    } else {
      try {
        const params = new URLSearchParams(window.location.search);
        const queryTable = params.get("table");
        if (queryTable) {
          setTableNumber(queryTable);
          setHasCheckedTable(true);
        } else {
          // Default to table t1 and redirect
          setTableNumber("t1");
          navigate("../menu/table/t1", { replace: true });
          setHasCheckedTable(true);
        }
      } catch (e) {
        console.error('Error reading query params:', e);
        setTableNumber("t1");
        navigate("../menu/table/t1", { replace: true });
        setHasCheckedTable(true);
      }
    }
  }, [urlTableNumber, navigate, setTableNumber]);

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("../")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Our Menu</h1>
              <p className="text-sm text-muted-foreground">
                Choose from our delicious selection
              </p>
            </div>
          </div>
          {tableNumber && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-base">Table {tableNumber}</span>
            </div>
          )}
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
