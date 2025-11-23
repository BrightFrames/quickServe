import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tableNumber, setTableNumber] = useState("");

  useEffect(() => {
    // Check if table parameter is in URL (from QR code scan)
    const tableParam = searchParams.get("table");
    if (tableParam) {
      setTableNumber(tableParam);
      localStorage.setItem("tableId", tableParam);
      localStorage.setItem("tableNumber", tableParam);
      // Auto-navigate to menu if table is from QR code
      navigate("/customer/menu");
    }
  }, [searchParams, navigate]);

  const handleViewMenu = () => {
    if (tableNumber.trim()) {
      localStorage.setItem("tableId", tableNumber);
      localStorage.setItem("tableNumber", tableNumber);
    }
    navigate("/customer/menu");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo & Welcome */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-xl animate-scale-in">
            <Utensils className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            QuickServe
          </h1>
          <p className="text-lg text-muted-foreground">
            Order from your table, served to perfection
          </p>
        </div>

        {/* Table Number Input */}
        <div className="bg-card rounded-2xl p-6 shadow-lg border space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table" className="text-base">
              Table Number (Optional)
            </Label>
            <Input
              id="table"
              type="text"
              placeholder="e.g., T-12"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="h-14 text-lg text-center"
            />
            <p className="text-xs text-muted-foreground text-center">
              Help us serve you better by entering your table number
            </p>
          </div>

          <Button
            onClick={handleViewMenu}
            size="lg"
            className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            View Menu
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-3xl">🍽️</div>
            <p className="text-xs text-muted-foreground">Fresh Menu</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">⚡</div>
            <p className="text-xs text-muted-foreground">Quick Service</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">💳</div>
            <p className="text-xs text-muted-foreground">Easy Payment</p>
          </div>
        </div>
      </div>
    </div>
  );
};
