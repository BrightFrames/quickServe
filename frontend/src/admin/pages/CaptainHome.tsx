import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CaptainTableSelection from "../components/captain/CaptainTableSelection";
import { RestaurantProvider } from "../../customer/context/RestaurantContext";
import { CartProvider } from "../../customer/context/CartContext";
import { MenuPage } from "../../customer/pages/MenuPage";

const CaptainHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  const handleLogout = () => {
    const restaurantSlug = user?.restaurantSlug;
    logout();
    // Redirect to restaurant's customer dashboard after logout
    if (restaurantSlug) {
      navigate(`/${restaurantSlug}/dashboard`);
    } else {
      navigate("/login");
    }
  };

  const handleTableSelect = (tableNumber: number) => {
    console.log('[CAPTAIN] Table selected:', tableNumber);
    
    // Get captain's restaurant data
    if (user?.restaurantSlug) {
      // Navigate to customer app with restaurant slug and table number
      const customerUrl = `/${user.restaurantSlug}/customer/menu/table/${tableNumber}`;
      
      // Set restaurant data for customer context
      const restaurantData = {
        restaurantName: user.restaurantName || 'Restaurant',
        restaurantSlug: user.restaurantSlug,
        token: localStorage.getItem('token') || ''
      };
      localStorage.setItem('customer_restaurant_data', JSON.stringify(restaurantData));
      sessionStorage.setItem('captainTableNumber', tableNumber.toString());
      
      // Open in same tab
      window.location.href = customerUrl;
    } else {
      console.error('[CAPTAIN] No restaurant slug found');
    }
  };

  const handleBackToTables = () => {
    setSelectedTable(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedTable && (
              <button
                onClick={handleBackToTables}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Captain Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                {selectedTable ? `Table ${selectedTable}` : "Select a table to start order"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {!selectedTable ? (
          <CaptainTableSelection onSelectTable={handleTableSelect} />
        ) : (
          <RestaurantProvider>
            <CartProvider>
              <MenuPage />
            </CartProvider>
          </RestaurantProvider>
        )}
      </div>
    </div>
  );
};

export default CaptainHome;
