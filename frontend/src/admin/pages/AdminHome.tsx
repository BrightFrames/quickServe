import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRestaurant } from "../context/RestaurantContext";
import {
  LogOut,
  Menu as MenuIcon,
  Users,
  Package,
  TrendingUp,
  Building2,
  Wallet,
  Tag,
  Utensils,
  Search,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Settings
} from "lucide-react";
import Dashboard from "../components/admin/Dashboard";
import MenuManagement from "../components/admin/MenuManagement";
import InventoryManagement from "../components/admin/InventoryManagement";
import InventoryTracking from "../components/admin/InventoryTracking";
import UserManagement from "../components/admin/UserManagement";
import RestaurantInfo from "../components/admin/RestaurantInfo";
import PaymentSettings from "../components/admin/PaymentSettings";
import PromoCodeManagement from "../components/admin/PromoCodeManagement";
import TableManagement from "../components/admin/TableManagement";
import axios from "axios";

type Tab = "dashboard" | "menu" | "inventory" | "tracking" | "users" | "info" | "payment" | "promos" | "tables";

const AdminHome = () => {
  const { logout, user } = useAuth();
  const { restaurantSlug } = useRestaurant();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const getAxiosConfig = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('restaurantToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-restaurant-slug': restaurantSlug || '',
      }
    };
  };

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
      const response = await axios.get(`${apiUrl}/api/menu`, getAxiosConfig());
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
    { id: "dashboard" as Tab, name: "Dashboard", icon: LayoutDashboard },
    { id: "menu" as Tab, name: "Menu", icon: MenuIcon },
    { id: "tables" as Tab, name: "Active Tables", icon: Utensils },
    { id: "inventory" as Tab, name: "Inventory", icon: Package },
    { id: "tracking" as Tab, name: "Reports", icon: TrendingUp },
    { id: "users" as Tab, name: "Users", icon: Users },
    { id: "promos" as Tab, name: "Promo Codes", icon: Tag },
    { id: "payment" as Tab, name: "Payments", icon: Wallet },
    { id: "info" as Tab, name: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"
          } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <MenuIcon className="w-6 h-6 text-blue-500 mr-3" />
          {sidebarOpen && (
            <span className="text-lg font-bold tracking-tight">QuickServe</span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
            >
              <tab.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {sidebarOpen && <span className="font-medium text-sm">{tab.name}</span>}

              {/* Notification Badge for Inventory */}
              {tab.id === "inventory" && lowStockCount > 0 && sidebarOpen && (
                <span className="absolute right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                  {lowStockCount}
                </span>
              )}
              {tab.id === "inventory" && lowStockCount > 0 && !sidebarOpen && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </div>

        {/* Bottom Section (Logout) */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 mb-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-4' : 'justify-center'} py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all duration-200`}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3 font-medium text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          {/* Search Bar */}
          <div className="flex items-center w-96">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1 text-gray-800 font-semibold cursor-default">
              <span>QuickServe</span>
            </div>

            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">{user?.username || 'Admin'}</span>
                <span className="text-xs text-gray-500">Administrator</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold shadow-md">
                {(user?.username || 'A')[0].toUpperCase()}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 cursor-pointer" />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-8">
          {/* Dynamic Content */}
          <div className="max-w-7xl mx-auto">
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "menu" && <MenuManagement />}
            {activeTab === "tables" && <TableManagement />}
            {activeTab === "inventory" && <InventoryManagement />}
            {activeTab === "tracking" && <InventoryTracking />}
            {activeTab === "users" && <UserManagement />}
            {activeTab === "promos" && <PromoCodeManagement />}
            {activeTab === "info" && <RestaurantInfo />}
            {activeTab === "payment" && <PaymentSettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
