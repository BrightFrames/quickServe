import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  Menu as MenuIcon,
  Users,
  Package,
  TrendingUp,
  QrCode,
  Building2,
  Wallet,
} from "lucide-react";
import Dashboard from "../components/admin/Dashboard";
import MenuManagement from "../components/admin/MenuManagement";
import InventoryManagement from "../components/admin/InventoryManagement";
import UserManagement from "../components/admin/UserManagement";
import TableManagement from "../components/admin/TableManagement";
import RestaurantInfo from "../components/admin/RestaurantInfo";
import PaymentSettings from "../components/admin/PaymentSettings";
import axios from "axios";

type Tab = "dashboard" | "menu" | "inventory" | "users" | "tables" | "info" | "payment";

const AdminHome = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    fetchLowStockCount();
    
    // Check every minute
    const interval = setInterval(() => {
      fetchLowStockCount();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchLowStockCount = async () => {
    try {
      const response = await axios.get('/api/menu');
      const items = response.data;
      const lowStock = items.filter(
        (item: any) => item.inventoryCount <= item.lowStockThreshold
      ).length;
      setLowStockCount(lowStock);
    } catch (error) {
      console.error('Failed to fetch inventory status');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const tabs = [
    { id: "dashboard" as Tab, name: "Dashboard", icon: TrendingUp },
    { id: "menu" as Tab, name: "Menu Management", icon: MenuIcon },
    { id: "inventory" as Tab, name: "Inventory", icon: Package },
    { id: "tables" as Tab, name: "Table Management", icon: QrCode },
    { id: "users" as Tab, name: "Kitchen Staff", icon: Users },
    { id: "info" as Tab, name: "Restaurant Info", icon: Building2 },
    { id: "payment" as Tab, name: "Payment Settings", icon: Wallet },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-blue-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Top Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <h1 className="text-xl font-bold">QuickServe Admin</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-blue-800 rounded-lg"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors relative ${
                  activeTab === tab.id
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-blue-800"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {sidebarOpen && <span>{tab.name}</span>}
                {tab.id === "inventory" && lowStockCount > 0 && (
                  <span className="absolute right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {lowStockCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Spacer to push logout to bottom */}
        <div className="flex-grow"></div>

        {/* Logout Button - Fixed at Bottom */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className={`${
              sidebarOpen ? "w-full" : "w-12"
            } flex items-center ${sidebarOpen ? 'justify-start' : 'justify-center'} gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-all duration-300`}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800">
              {tabs.find((t) => t.id === activeTab)?.name}
            </h2>
            <p className="text-gray-600">Welcome back, {user?.username}!</p>
          </div>

          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "menu" && <MenuManagement />}
          {activeTab === "inventory" && <InventoryManagement />}
          {activeTab === "tables" && <TableManagement />}
          {activeTab === "users" && <UserManagement />}
          {activeTab === "info" && <RestaurantInfo />}
          {activeTab === "payment" && <PaymentSettings />}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
