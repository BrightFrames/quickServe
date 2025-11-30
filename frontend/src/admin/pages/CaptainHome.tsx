import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CaptainTableSelection from "../components/captain/CaptainTableSelection";
import CaptainMenu from "../components/captain/CaptainMenu";
import CaptainCart from "../components/captain/CaptainCart";

const CaptainHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const handleLogout = () => {
    logout();
    navigate("/captain/login");
  };

  const handleTableSelect = (tableId: number) => {
    setSelectedTable(tableId);
    setCartItems([]); // Reset cart when selecting new table
  };

  const handleBackToTables = () => {
    setSelectedTable(null);
    setCartItems([]);
  };

  const handleAddToCart = (item: any) => {
    const existingItem = cartItems.find((i) => i.id === item.id);
    if (existingItem) {
      setCartItems(
        cartItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1, notes: "" }]);
    }
  };

  const handleUpdateQuantity = (itemId: number, change: number) => {
    setCartItems(
      cartItems
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleUpdateNotes = (itemId: number, notes: string) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      )
    );
  };

  const handleRemoveItem = (itemId: number) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const handleOrderPlaced = () => {
    setCartItems([]);
    setSelectedTable(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Captain Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              {selectedTable ? `Table ${selectedTable}` : "Select a table"}
            </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CaptainMenu
                onAddToCart={handleAddToCart}
                onBack={handleBackToTables}
              />
            </div>
            <div className="lg:col-span-1">
              <CaptainCart
                items={cartItems}
                tableNumber={selectedTable}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateNotes={handleUpdateNotes}
                onRemoveItem={handleRemoveItem}
                onOrderPlaced={handleOrderPlaced}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptainHome;
