import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
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
  Key
} from 'lucide-react';
import { GlowCard } from './ui/spotlight-card';

const Dashboard: React.FC = () => {
  const { restaurant, token, logout } = useAuth();
  const navigate = useNavigate();
  const { restaurantSlug } = useParams();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Account creation states
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showKitchenForm, setShowKitchenForm] = useState(false);
  const [adminFormData, setAdminFormData] = useState({ username: '', password: '' });
  const [kitchenFormData, setKitchenFormData] = useState({ username: '', password: '' });

  // Validate that the URL slug matches the logged-in restaurant
  useEffect(() => {
    // If restaurant doesn't have slug, force logout and re-login
    if (restaurant && !restaurant.slug) {
      alert('Your session is outdated. Please log in again.');
      logout();
      navigate('/', { replace: true });
      return;
    }

    if (restaurant && restaurantSlug !== restaurant.slug) {
      // Redirect to correct slug
      navigate(`/${restaurant.slug}/dashboard`, { replace: true });
    }
  }, [restaurant, restaurantSlug, navigate, logout]);

  const handleNavigateToAdmin = () => {
    if (restaurant && restaurant.restaurantCode) {
      // Navigate to restaurant verification page with code
      // URL format: /slug?code=QS1234&type=admin
      navigate(`/${restaurant.slug}?code=${restaurant.restaurantCode}&type=admin`);
    }
  };

  const handleNavigateToKitchen = () => {
    if (restaurant) {
      // Navigate to kitchen login with restaurant slug
      navigate(`/${restaurant.slug}/kitchen/login`);
    }
  };

  const handleNavigateToCustomer = () => {
    if (restaurant) {
      // Navigate to customer app with restaurant slug and data
      // Pass restaurant data via URL params which CustomerRestaurantProvider expects
      const token = localStorage.getItem('token') || '';
      navigate(`/${restaurant.slug}/customer/menu/table/t1?restaurantName=${encodeURIComponent(restaurant.name)}&token=${encodeURIComponent(token)}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img 
                src="/icon of the quick serve.png" 
                alt="QuickServe Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">QuickServe</h1>
                <p className="text-sm text-gray-500">Restaurant Management</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {restaurant?.name}!
          </h2>
          <p className="text-gray-600">
            Manage your restaurant operations from your centralized dashboard.
          </p>
        </div>

        {/* Restaurant Info Card */}
        <Card className="mb-8 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-orange-600" />
              <span>Restaurant Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-orange-600" />
                <div>
                  <span className="text-xs text-gray-500 block">Restaurant Code</span>
                  <span className="text-sm font-medium">{restaurant?.restaurantCode}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-orange-600" />
                <div>
                  <span className="text-xs text-gray-500 block">Email</span>
                  <span className="text-sm font-medium">{restaurant?.email}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-orange-600" />
                <div>
                  <span className="text-xs text-gray-500 block">Phone</span>
                  <span className="text-sm font-medium">{restaurant?.phone}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-orange-600" />
                <div>
                  <span className="text-xs text-gray-500 block">Address</span>
                  <span className="text-sm font-medium">{restaurant?.address}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management Section */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Update Admin Password */}
          <GlowCard glowColor="orange" customSize className="w-full h-auto">
            <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-orange-600" />
                <span>Update Admin Credentials</span>
              </CardTitle>
              <CardDescription>
                Set a unique admin username and password for your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showAdminForm ? (
                <div className="space-y-3">
                  <Button onClick={() => setShowAdminForm(true)} className="w-full bg-orange-600 hover:bg-orange-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Change Admin Credentials
                  </Button>
                </div>
              ) : (
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="admin-username">New Admin Username (Optional)</Label>
                      <Input
                        id="admin-username"
                        type="text"
                        placeholder="Enter new admin username"
                        value={adminFormData.username}
                        onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave blank to keep current username</p>
                    </div>
                    <div>
                      <Label htmlFor="admin-password">New Admin Password (Optional)</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter new admin password"
                        value={adminFormData.password}
                        onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters, leave blank to keep current</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">Update Credentials</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAdminForm(false)}>Cancel</Button>
                    </div>
                  </form>
                )}
            </CardContent>
          </Card>
          </GlowCard>

          {/* Update Kitchen Password */}
          <GlowCard glowColor="orange" customSize className="w-full h-auto">
            <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-orange-600" />
                <span>Update Kitchen Credentials</span>
              </CardTitle>
              <CardDescription>
                Set a unique kitchen staff username and password for your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showKitchenForm ? (
                <div className="space-y-3">
                  <Button onClick={() => setShowKitchenForm(true)} className="w-full bg-orange-600 hover:bg-orange-700">
                    <ChefHat className="h-4 w-4 mr-2" />
                    Change Kitchen Credentials
                  </Button>
                </div>
              ) : (
                  <form onSubmit={handleCreateKitchen} className="space-y-4">
                    <div>
                      <Label htmlFor="kitchen-username">New Kitchen Username (Optional)</Label>
                      <Input
                        id="kitchen-username"
                        type="text"
                        placeholder="Enter new kitchen username"
                        value={kitchenFormData.username}
                        onChange={(e) => setKitchenFormData({ ...kitchenFormData, username: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave blank to keep current username</p>
                    </div>
                    <div>
                      <Label htmlFor="kitchen-password">New Kitchen Password (Optional)</Label>
                      <Input
                        id="kitchen-password"
                        type="password"
                        placeholder="Enter new kitchen password"
                        value={kitchenFormData.password}
                        onChange={(e) => setKitchenFormData({ ...kitchenFormData, password: e.target.value })}
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters, leave blank to keep current</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">Update Credentials</Button>
                      <Button type="button" variant="outline" onClick={() => setShowKitchenForm(false)}>Cancel</Button>
                    </div>
                  </form>
                )}
            </CardContent>
          </Card>
          </GlowCard>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Panel */}
          <GlowCard glowColor="orange" customSize className="w-full h-auto">
            <Card className="border-0 bg-transparent shadow-none cursor-pointer transition-all" onClick={handleNavigateToAdmin}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-orange-600" />
                <span>Admin Panel</span>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </CardTitle>
              <CardDescription>
                Manage restaurant operations, menu, and staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <BarChart3 className="h-4 w-4" />
                  <span>View analytics and reports</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <ChefHat className="h-4 w-4" />
                  <span>Manage menu and inventory</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Manage tables and users</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white">
                Open Admin Panel
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          </GlowCard>

          {/* Kitchen Panel */}
          <GlowCard glowColor="orange" customSize className="w-full h-auto">
            <Card className="border-0 bg-transparent shadow-none cursor-pointer transition-all" onClick={handleNavigateToKitchen}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-orange-600" />
                <span>Kitchen Panel</span>
                <ArrowRight className="h-4 w-4 text-orange-400 ml-auto" />
              </CardTitle>
              <CardDescription>
                Real-time order management for kitchen staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <ChefHat className="h-4 w-4" />
                  <span>View incoming orders</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <BarChart3 className="h-4 w-4" />
                  <span>Update order status</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Manage preparation queue</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white">
                Open Kitchen Panel
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          </GlowCard>

          {/* Customer App */}
          <GlowCard glowColor="orange" customSize className="w-full h-auto">
            <Card className="border-0 bg-transparent shadow-none cursor-pointer transition-all" onClick={handleNavigateToCustomer}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span>Customer App</span>
                <ArrowRight className="h-4 w-4 text-orange-400 ml-auto" />
              </CardTitle>
              <CardDescription>
                View your restaurant from customer perspective
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <ChefHat className="h-4 w-4" />
                  <span>Browse menu and place orders</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <BarChart3 className="h-4 w-4" />
                  <span>Track order status</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>QR code table ordering</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white">
                Open Customer App
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          </GlowCard>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">Track performance metrics</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ChefHat className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Kitchen Management</h3>
              <p className="text-sm text-gray-600 mt-1">Real-time order processing</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Experience</h3>
              <p className="text-sm text-gray-600 mt-1">QR ordering and feedback</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;