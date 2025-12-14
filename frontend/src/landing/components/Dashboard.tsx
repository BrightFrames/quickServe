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
    console.log('Admin button clicked', { restaurant, restaurantCode: restaurant?.restaurantCode });
    if (restaurant) {
      if (restaurant.restaurantCode) {
        // Navigate to restaurant verification page with code
        // URL format: /verify/slug?code=QS1234&type=admin
        navigate(`/verify/${restaurant.slug}?code=${restaurant.restaurantCode}&type=admin`);
      } else {
        // If restaurantCode is missing (old session), go directly to admin login
        toast.info('Redirecting to admin login...');
        navigate(`/${restaurant.slug}/admin/login`);
      }
    } else {
      toast.error('Restaurant information not found. Please login again.');
      console.error('Cannot navigate: Missing restaurant data', restaurant);
    }
  };

  const handleNavigateToKitchen = () => {
    console.log('Kitchen button clicked', { restaurant });
    if (restaurant) {
      // Navigate to kitchen login with restaurant slug
      navigate(`/${restaurant.slug}/kitchen/login`);
    } else {
      toast.error('Restaurant information not found. Please login again.');
    }
  };

  const handleNavigateToCaptain = () => {
    console.log('Captain button clicked', { restaurant });
    if (restaurant) {
      // Navigate to captain login with restaurant slug
      navigate(`/${restaurant.slug}/captain/login`);
    } else {
      toast.error('Restaurant information not found. Please login again.');
    }
  };

  const handleNavigateToCustomer = () => {
    if (restaurant) {
      // Navigate to customer app with restaurant slug and data
      // Pass restaurant data via URL params which CustomerRestaurantProvider expects
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
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
        <Card className="mb-8 border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-red-600" />
              <span>Restaurant Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-red-600" />
                <div>
                  <span className="text-xs text-gray-500 block">Restaurant Code</span>
                  <span className="text-sm font-medium">{restaurant?.restaurantCode}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-red-600" />
                <div>
                  <span className="text-xs text-gray-500 block">Email</span>
                  <span className="text-sm font-medium">{restaurant?.email}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-red-600" />
                <div>
                  <span className="text-xs text-gray-500 block">Phone</span>
                  <span className="text-sm font-medium">{restaurant?.phone}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-red-600" />
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
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-red-600" />
                </div>
                <span>Update Admin Credentials</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-2">
                Set a unique admin username and password for your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {!showAdminForm ? (
                <div className="space-y-3">
                  <Button onClick={() => setShowAdminForm(true)} className="w-full bg-red-600 hover:bg-red-700 rounded-lg shadow-sm">
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

          {/* Update Kitchen Password */}
            <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-red-600" />
                <span>Update Kitchen Credentials</span>
              </CardTitle>
              <CardDescription>
                Set a unique kitchen staff username and password for your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showKitchenForm ? (
                <div className="space-y-3">
                  <Button onClick={() => setShowKitchenForm(true)} className="w-full bg-red-600 hover:bg-red-700">
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
        </div>

        {/* Captain Credentials - Full Width */}
        <div className="mb-8">
            <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-red-600" />
                <span>Update Captain Credentials</span>
              </CardTitle>
              <CardDescription>
                Set a unique captain/waiter username and password for your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showCaptainForm ? (
                <div className="space-y-3">
                  <Button onClick={() => setShowCaptainForm(true)} className="w-full bg-red-600 hover:bg-red-700">
                    <Users className="h-4 w-4 mr-2" />
                    Change Captain Credentials
                  </Button>
                </div>
              ) : (
                  <form onSubmit={handleCreateCaptain} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="captain-username">New Captain Username (Optional)</Label>
                        <Input
                          id="captain-username"
                          type="text"
                          placeholder="Enter new captain username"
                          value={captainFormData.username}
                          onChange={(e) => setCaptainFormData({ ...captainFormData, username: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave blank to keep current username</p>
                      </div>
                      <div>
                        <Label htmlFor="captain-password">New Captain Password (Optional)</Label>
                        <Input
                          id="captain-password"
                          type="password"
                          placeholder="Enter new captain password"
                          value={captainFormData.password}
                          onChange={(e) => setCaptainFormData({ ...captainFormData, password: e.target.value })}
                          minLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters, leave blank to keep current</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">Update Credentials</Button>
                      <Button type="button" variant="outline" onClick={() => setShowCaptainForm(false)}>Cancel</Button>
                    </div>
                  </form>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Admin Panel */}
            <Card className="border-gray-200 shadow-lg cursor-pointer transition-all hover:shadow-xl h-full flex flex-col" onClick={handleNavigateToAdmin}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-red-600" />
                <span>Admin Panel</span>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </CardTitle>
              <CardDescription>
                Manage restaurant operations, menu, and staff
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="space-y-3 flex-grow">
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
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/40 transition-all duration-300">
                Open Admin Panel
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Kitchen Panel */}
            <Card className="border-gray-200 shadow-lg cursor-pointer transition-all hover:shadow-xl h-full flex flex-col" onClick={handleNavigateToKitchen}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-red-600" />
                <span>Kitchen Panel</span>
                <ArrowRight className="h-4 w-4 text-red-400 ml-auto" />
              </CardTitle>
              <CardDescription>
                Real-time order management for kitchen staff
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="space-y-3 flex-grow">
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
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/40 transition-all duration-300">
                Open Kitchen Panel
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Captain Panel */}
            <Card className="border-gray-200 shadow-lg cursor-pointer transition-all hover:shadow-xl h-full flex flex-col" onClick={handleNavigateToCaptain}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-red-600" />
                <span>Captain Panel</span>
                <ArrowRight className="h-4 w-4 text-red-400 ml-auto" />
              </CardTitle>
              <CardDescription>
                Take orders on behalf of customers
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="space-y-3 flex-grow">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Select table and take orders</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <ChefHat className="h-4 w-4" />
                  <span>Browse menu and add items</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <BarChart3 className="h-4 w-4" />
                  <span>Send orders directly to kitchen</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/40 transition-all duration-300">
                Open Captain Panel
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Customer App */}
            <Card className="border-gray-200 shadow-lg cursor-pointer transition-all hover:shadow-xl h-full flex flex-col" onClick={handleNavigateToCustomer}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-red-600" />
                <span>Customer App</span>
                <ArrowRight className="h-4 w-4 text-red-400 ml-auto" />
              </CardTitle>
              <CardDescription>
                View your restaurant from customer perspective
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="space-y-3 flex-grow">
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
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/40 transition-all duration-300">
                Open Customer App
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">Track performance metrics</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ChefHat className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Kitchen Management</h3>
              <p className="text-sm text-gray-600 mt-1">Real-time order processing</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-red-600" />
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