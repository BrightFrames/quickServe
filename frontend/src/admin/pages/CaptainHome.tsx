import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CaptainTableSelection from '../components/captain/CaptainTableSelection';
import CaptainMenu from '../components/captain/CaptainMenu';
import CaptainCart from '../components/captain/CaptainCart';
import { LogOut, ArrowLeft } from 'lucide-react';

const CaptainHome = () => {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('captainToken');
    if (!token) {
      navigate('/captain/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('captainToken');
    localStorage.removeItem('captainUser');
    navigate('/captain/login');
  };

  const handleTableSelect = (tableId: number) => {
    setSelectedTable(tableId);
  };

  const handleBackToTables = () => {
    setSelectedTable(null);
    setCartItems([]);
    setShowCart(false);
  };

  const handleAddToCart = (item: any) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateCart = (items: any[]) => {
    setCartItems(items);
  };

  const handleOrderPlaced = () => {
    setCartItems([]);
    setShowCart(false);
    setSelectedTable(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedTable && (
              <button
                onClick={handleBackToTables}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-900">
              {selectedTable ? `Table ${selectedTable}` : 'Captain Dashboard'}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {!selectedTable ? (
          <CaptainTableSelection onTableSelect={handleTableSelect} />
        ) : showCart ? (
          <CaptainCart
            tableId={selectedTable}
            items={cartItems}
            onUpdateCart={handleUpdateCart}
            onBack={() => setShowCart(false)}
            onOrderPlaced={handleOrderPlaced}
          />
        ) : (
          <CaptainMenu
            tableId={selectedTable}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onViewCart={() => setShowCart(true)}
          />
        )}
      </div>
    </div>
  );
};

export default CaptainHome;
