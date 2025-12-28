import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { MenuList } from "../components/MenuList";
import { StickyCartBar } from "../components/StickyCartBar";
import { Recommendations } from "../components/Recommendations";
import { Skeleton } from "@/shared/ui/skeleton";
import { useCart } from "../context/CartContext";
import { Button } from "@/shared/ui/button";

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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* App Header */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">QuickServe</h1>
            <p className="text-sm text-gray-500">Table {tableNumber || 'Unknown'}</p>
          </div>
          {tableNumber && (
            <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border border-gray-200">
              T-{tableNumber}
            </div>
          )}
        </div>


        {/* Category Pills - Enterprise Style */}
        <div className="overflow-x-auto no-scrollbar pb-3 px-4 flex gap-2 border-b border-gray-100 bg-white pt-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`
              whitespace-nowrap px-4 py-1.5 rounded text-sm font-medium transition-colors border
              ${selectedCategory === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"}
            `}
          >
            All Items
          </button>
          {MENU_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                whitespace-nowrap px-4 py-1.5 rounded text-sm font-medium transition-colors border
                ${selectedCategory === category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"}
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Content */}
      <div className="px-4 pt-4 space-y-6">
        <MenuList menu={filteredMenu} />

        {recommendations.length > 0 && (
          <div className="pt-4">
            <h3 className="font-bold text-gray-900 mb-3 px-1">Recommended for You</h3>
            <Recommendations items={recommendations} />
          </div>
        )}
      </div>

      {/* Sticky Cart Bar (Replaces Drawer Trigger) */}
      <StickyCartBar />
    </div>
  );
};
