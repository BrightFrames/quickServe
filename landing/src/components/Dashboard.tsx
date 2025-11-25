import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { 
  Users, 
  ChefHat, 
  BarChart3, 
  Settings,
  ArrowRight,
  Building,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { restaurant, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigateToAdmin = () => {
    // Navigate to admin panel within the same app
    navigate('/admin');
  };

  const handleNavigateToCustomer = () => {
    // Navigate to customer app within the same app
    navigate('/customer');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
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
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Restaurant Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{restaurant?.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{restaurant?.phone}</span>
                </div>
                <div className="flex items-center space-x-3 md:col-span-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{restaurant?.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin Panel */}
          <Card className="feature-card cursor-pointer transition-all hover:shadow-lg" onClick={handleNavigateToAdmin}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Admin Panel</span>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </CardTitle>
              <CardDescription>
                Manage your restaurant operations, menu, orders, and staff
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
                  <span>Manage menu items and inventory</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Manage tables and staff</span>
                </div>
              </div>
              <Button className="w-full mt-4" onClick={handleNavigateToAdmin}>
                Open Admin Panel
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Customer App */}
          <Card className="feature-card cursor-pointer transition-all hover:shadow-lg" onClick={handleNavigateToCustomer}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Customer App</span>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </CardTitle>
              <CardDescription>
                View your restaurant from the customer perspective
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
                  <span>View order status and history</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Table-based ordering system</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" onClick={handleNavigateToCustomer}>
                Open Customer App
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">Track performance metrics</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ChefHat className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Kitchen Management</h3>
              <p className="text-sm text-gray-600 mt-1">Streamline order processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Experience</h3>
              <p className="text-sm text-gray-600 mt-1">Enhance dining experience</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;