import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ChefHat,
  BarChart3,
  Settings,
  ArrowRight,
  Building,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  Key,
  ShieldCheck,
  LayoutDashboard,
  UtensilsCrossed,
  QrCode
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { restaurant, token, logout } = useAuth();
  const navigate = useNavigate();
  const { restaurantSlug } = useParams();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Account creation states
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showKitchenForm, setShowKitchenForm] = useState(false);
  const [showCaptainForm, setShowCaptainForm] = useState(false);
  const [adminFormData, setAdminFormData] = useState({ username: '', password: '' });
  const [kitchenFormData, setKitchenFormData] = useState({ username: '', password: '' });
  const [captainFormData, setCaptainFormData] = useState({ username: '', password: '' });

  // Validate that the URL slug matches the logged-in restaurant
  useEffect(() => {
    if (restaurant && !restaurant.slug) {
      alert('Your session is outdated. Please log in again.');
      logout();
      navigate('/', { replace: true });
      return;
    }

    if (restaurant && restaurantSlug !== restaurant.slug) {
      navigate(`/${restaurant.slug}/dashboard`, { replace: true });
    }
  }, [restaurant, restaurantSlug, navigate, logout]);

  const handleNavigateToAdmin = () => {
    if (restaurant) {
      if (restaurant.restaurantCode) {
        navigate(`/verify/${restaurant.slug}?code=${restaurant.restaurantCode}&type=admin`);
      } else {
        toast.info('Redirecting to admin login...');
        navigate(`/${restaurant.slug}/admin/login`);
      }
    } else {
      toast.error('Restaurant information not found. Please login again.');
    }
  };

  const handleNavigateToKitchen = () => {
    if (restaurant) {
      navigate(`/${restaurant.slug}/kitchen/login`);
    } else {
      toast.error('Restaurant information not found. Please login again.');
    }
  };

  const handleNavigateToCaptain = () => {
    if (restaurant) {
      navigate(`/${restaurant.slug}/captain/login`);
    } else {
      toast.error('Restaurant information not found. Please login again.');
    }
  };

  const handleNavigateToCustomer = () => {
    if (restaurant) {
      const token = localStorage.getItem('token') || '';
      navigate(`/${restaurant.slug}/customer/menu/table/t1?restaurantName=${encodeURIComponent(restaurant.name)}&restaurantId=${restaurant.id}&token=${encodeURIComponent(token)}`);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.restaurantCode) {
      toast.error('Restaurant code not found');
      return;
    }
    try {
      await axios.put(`${apiUrl}/api/restaurant/update-credentials/${restaurant.restaurantCode}`, {
        type: 'admin',
        username: adminFormData.username || undefined,
        password: adminFormData.password || undefined
      });
      toast.success('Admin credentials updated successfully!');
      setShowAdminForm(false);
      setAdminFormData({ username: '', password: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update admin credentials');
    }
  };

  const handleCreateKitchen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.restaurantCode) {
      toast.error('Restaurant code not found');
      return;
    }
    try {
      await axios.put(`${apiUrl}/api/restaurant/update-credentials/${restaurant.restaurantCode}`, {
        type: 'kitchen',
        username: kitchenFormData.username || undefined,
        password: kitchenFormData.password || undefined
      });
      toast.success('Kitchen credentials updated successfully!');
      setShowKitchenForm(false);
      setKitchenFormData({ username: '', password: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update kitchen credentials');
    }
  };

  const handleCreateCaptain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.restaurantCode) {
      toast.error('Restaurant code not found');
      return;
    }
    try {
      await axios.put(`${apiUrl}/api/restaurant/update-credentials/${restaurant.restaurantCode}`, {
        type: 'captain',
        username: captainFormData.username || undefined,
        password: captainFormData.password || undefined
      });
      toast.success('Captain credentials updated successfully!');
      setShowCaptainForm(false);
      setCaptainFormData({ username: '', password: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update captain credentials');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Professional Header with Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-red-600 to-red-700 p-2 rounded-xl shadow-lg shadow-red-200">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">QuickServe</h1>
                <p className="text-xs text-gray-500 font-medium">Restaurant Manager</p>
              </div>
            </div>
            <Button onClick={logout} variant="ghost" className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          className="space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold tracking-wide uppercase">Dashboard</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                Welcome back, {restaurant?.name}!
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Monitor your restaurant's performance, manage staff credentials, and oversee live operations from your command center.
              </p>
            </div>
          </motion.div>

          {/* Action Grid - Centerpiece */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-red-600" />
              Apps & Consoles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Admin Panel Card */}
              <div
                onClick={handleNavigateToAdmin}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-2xl hover:shadow-red-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Settings className="w-24 h-24 text-red-600 transform rotate-12 translate-x-4 -translate-y-4" />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-300">
                    <Settings className="w-6 h-6 text-red-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Admin Panel</h4>
                  <p className="text-sm text-gray-500 mb-6 flex-grow">Configure menu, tables, and settings.</p>
                  <div className="flex items-center text-red-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Launch Console <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>

              {/* Kitchen Panel Card */}
              <div
                onClick={handleNavigateToKitchen}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-2xl hover:shadow-orange-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <UtensilsCrossed className="w-24 h-24 text-orange-600 transform rotate-12 translate-x-4 -translate-y-4" />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors duration-300">
                    <ChefHat className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Kitchen View</h4>
                  <p className="text-sm text-gray-500 mb-6 flex-grow">Real-time order display for chefs.</p>
                  <div className="flex items-center text-orange-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Launch Display <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>

              {/* Captain Panel Card */}
              <div
                onClick={handleNavigateToCaptain}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users className="w-24 h-24 text-blue-600 transform rotate-12 translate-x-4 -translate-y-4" />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                    <Users className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Captain App</h4>
                  <p className="text-sm text-gray-500 mb-6 flex-grow">Order taking interface for waiters.</p>
                  <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Launch App <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>

              {/* Customer App Card */}
              <div
                onClick={handleNavigateToCustomer}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-2xl hover:shadow-green-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <QrCode className="w-24 h-24 text-green-600 transform rotate-12 translate-x-4 -translate-y-4" />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors duration-300">
                    <QrCode className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Customer Menu</h4>
                  <p className="text-sm text-gray-500 mb-6 flex-grow">Digital menu and self-ordering view.</p>
                  <div className="flex items-center text-green-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Launch Menu <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Stats & Info */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
              {/* Restaurant Info Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <Building className="w-5 h-5 text-gray-500" />
                  <h3 className="font-bold text-gray-900">Restaurant Info</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Key className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-uppercase text-gray-500 font-bold tracking-wider">CODE</p>
                      <p className="text-lg font-mono font-bold text-red-600">{restaurant?.restaurantCode}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-uppercase text-gray-500 font-bold tracking-wider">EMAIL</p>
                      <p className="text-sm text-gray-900 font-medium break-all">{restaurant?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-uppercase text-gray-500 font-bold tracking-wider">PHONE</p>
                      <p className="text-sm text-gray-900 font-medium">{restaurant?.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-uppercase text-gray-500 font-bold tracking-wider">ADDRESS</p>
                      <p className="text-sm text-gray-900 font-medium">{restaurant?.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Credential Management */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                Access Management
              </h3>

              {/* Admin Credentials */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Admin Account</h4>
                    <p className="text-sm text-gray-500">Full access to settings and logs.</p>
                  </div>
                  <Button
                    variant={showAdminForm ? "secondary" : "default"}
                    onClick={() => setShowAdminForm(!showAdminForm)}
                    className={showAdminForm ? "bg-gray-100 text-gray-900" : "bg-gray-900 hover:bg-black text-white"}
                  >
                    {showAdminForm ? "Cancel" : "Update"}
                  </Button>
                </div>

                <AnimatePresence>
                  {showAdminForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleCreateAdmin} className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="admin-username">New Username</Label>
                            <Input
                              id="admin-username"
                              placeholder="Enter new username"
                              value={adminFormData.username}
                              onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="admin-password">New Password</Label>
                            <Input
                              id="admin-password"
                              type="password"
                              placeholder="Min 6 characters"
                              min={6}
                              value={adminFormData.password}
                              onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                              className="bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" className="bg-red-600 hover:bg-red-700">
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Kitchen Credentials */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Kitchen Display</h4>
                    <p className="text-sm text-gray-500">Restricted access for kitchen staff.</p>
                  </div>
                  <Button
                    variant={showKitchenForm ? "secondary" : "default"}
                    onClick={() => setShowKitchenForm(!showKitchenForm)}
                    className={showKitchenForm ? "bg-gray-100 text-gray-900" : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"}
                  >
                    {showKitchenForm ? "Cancel" : "Update"}
                  </Button>
                </div>

                <AnimatePresence>
                  {showKitchenForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleCreateKitchen} className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="kitchen-username">New Username</Label>
                            <Input
                              id="kitchen-username"
                              placeholder="Enter new username"
                              value={kitchenFormData.username}
                              onChange={(e) => setKitchenFormData({ ...kitchenFormData, username: e.target.value })}
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="kitchen-password">New Password</Label>
                            <Input
                              id="kitchen-password"
                              type="password"
                              placeholder="Min 6 characters"
                              min={6}
                              value={kitchenFormData.password}
                              onChange={(e) => setKitchenFormData({ ...kitchenFormData, password: e.target.value })}
                              className="bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" className="bg-red-600 hover:bg-red-700">
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Captain Credentials */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Captain / Waiter</h4>
                    <p className="text-sm text-gray-500">Table ordering access for staff.</p>
                  </div>
                  <Button
                    variant={showCaptainForm ? "secondary" : "default"}
                    onClick={() => setShowCaptainForm(!showCaptainForm)}
                    className={showCaptainForm ? "bg-gray-100 text-gray-900" : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"}
                  >
                    {showCaptainForm ? "Cancel" : "Update"}
                  </Button>
                </div>

                <AnimatePresence>
                  {showCaptainForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleCreateCaptain} className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="captain-username">New Username</Label>
                            <Input
                              id="captain-username"
                              placeholder="Enter new username"
                              value={captainFormData.username}
                              onChange={(e) => setCaptainFormData({ ...captainFormData, username: e.target.value })}
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="captain-password">New Password</Label>
                            <Input
                              id="captain-password"
                              type="password"
                              placeholder="Min 6 characters"
                              min={6}
                              value={captainFormData.password}
                              onChange={(e) => setCaptainFormData({ ...captainFormData, password: e.target.value })}
                              className="bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" className="bg-red-600 hover:bg-red-700">
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;